'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Calendar, Moon, Sun, Menu, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useUIStore } from '@/store/uiStore';
import { useEffect, useState } from 'react';
import { exportData } from '@/lib/db';

import { containerClasses } from '@/lib/utils';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { settings, updateSettings } = useUIStore();
  const [mounted, setMounted] = useState(false);
  // State to control the mobile menu sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Effect to ensure client-side logic runs only after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Simplified effect to apply the theme class to the document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Note: If you add a 'system' theme, you'd handle window.matchMedia here
  }, [settings.theme, mounted]);

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    updateSettings({ theme: newTheme });
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      // Close the sheet after exporting on mobile
      setIsSheetOpen(false); 
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Derived state for the theme icon for cleaner rendering
  const isDarkMode = mounted && settings.theme === 'dark';

  return (
    <header className="sticky top-0 z-50 w-full  border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className={`flex items-center justify-between py-4 ${containerClasses()}`}>
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            aria-label="Go to homepage"
          >
            <Calendar className="h-6 w-6" />
          </Button> */}
          <div className="hidden sm:block">
            <button
              onClick={() => router.push('/')}
              className="font-bold text-xl hover:opacity-80 transition-opacity"
            >
              Planner
            </button>
            <p className="text-xs text-muted-foreground">
              Plan your goals across time
            </p>
          </div>
        </div>

        {/* Desktop Navigation (Visible on screens larger than 'sm') */}
        <nav className="hidden sm:flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            Export Data
            <ExternalLink className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </nav>

        {/* Mobile Navigation Menu (Visible only on 'sm' and smaller screens) */}
        <div className="sm:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="w-full justify-start gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Export Data
                </Button>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <span className="text-sm font-medium">Switch Theme</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                  >
                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}