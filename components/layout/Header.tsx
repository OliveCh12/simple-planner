// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Moon, Sun, Menu, ExternalLink, Calendar, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Store and Utilities
import { useUIStore } from '@/store/uiStore';
import { exportData } from '@/lib/db';
import { containerClasses } from '@/lib/utils';

// --- Sub-components for better organization ---

// Logo and Title Component
const Logo = () => (
  <Link href="/" className="flex items-center gap-2 group">
    <div>
      <h1 className="font-bold text-md tracking-tight group-hover:text-primary transition-colors">
        PLANNER
      </h1>
      <p className="text-xs text-muted-foreground">Plan your goals across time</p>
    </div>
  </Link>
);

// Reusable Theme Toggle Component
const ThemeToggle = () => {
  const { settings, updateSettings } = useUIStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Render a placeholder or nothing to avoid hydration mismatch
    return <div className="h-10 w-10" />;
  }

  const isDarkMode = settings.theme === 'dark';

  const toggleTheme = () => {
    updateSettings({ theme: isDarkMode ? 'light' : 'dark' });
  };

  return (
    <Button variant="secondary" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {isDarkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
};

// --- Main Header and Navigation Components ---

// Data Export Button
const ExportButton = ({ onSuccess }: { onSuccess?: () => void }) => {
  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
      onSuccess?.(); // Call the success callback if it exists
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} className="gap-2">
      Export Data
      <ExternalLink className="h-4 w-4" />
    </Button>
  );
};

// Settings Button Component
const SettingsButton = () => (
  <Link href="/settings">
    <Button variant="secondary" size="icon" aria-label="Settings">
      <Settings className="h-5 w-5" />
    </Button>
  </Link>
);

// Desktop Navigation
const DesktopNav = () => (
  <nav className="hidden sm:flex items-center gap-2">
    <SettingsButton />
    <ExportButton />
    <ThemeToggle />
  </nav>
);

// Mobile Navigation Sheet
const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings } = useUIStore();
  const isDarkMode = settings.theme === 'dark';

  return (
    <div className="sm:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="grid gap-6 py-6">
            <div className="flex items-center justify-center">
              <SettingsButton />
            </div>
            <ExportButton onSuccess={() => setIsOpen(false)} />
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="theme-switch" className="font-medium">
                Dark Mode
              </Label>
              <Switch
                id="theme-switch"
                checked={isDarkMode}
                onCheckedChange={(checked) => {
                  updateSettings({ theme: checked ? 'dark' : 'light' });
                }}
                aria-label="Toggle dark mode"
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

// --- The Main Header Component ---

export function Header() {
  const { settings } = useUIStore();

  // Effect to apply the theme class to the document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className={`flex h-16 items-center justify-between ${containerClasses()}`}>
        <div className="hidden sm:block">
          <Logo />
        </div>
        
        {/* Simplified logo for mobile to save space */}
        <div className="sm:hidden">
            <Link href="/" className="font-bold text-xl">Planner</Link>
        </div>

        <DesktopNav />
        <MobileNav />
      </div>
    </header>
  );
}