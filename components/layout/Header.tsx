'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Calendar, Moon, Sun, Menu, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/uiStore';
import { useEffect, useState } from 'react';
import { exportData } from '@/lib/db';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { settings, updateSettings } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setMounted(true);
    // Check system preference or saved theme
    const savedTheme = settings.theme;
    if (savedTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      setTheme(savedTheme as 'light' | 'dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    if (mounted) {
      // Apply theme to document
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme, mounted]);

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
      } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export data. Please try again.');
      }
    };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  const isHomePage = pathname === '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="h-10 w-10"
          >
            <Calendar className="h-6 w-6" />
          </Button>
          <div className="hidden sm:block">
            <button
              onClick={() => router.push('/')}
              className="font-bold text-xl hover:opacity-80 transition-opacity"
            >
              Timeline Planner
            </button>
            <p className="text-xs text-muted-foreground">
              Plan your goals across time
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-2">

          <Button
            variant="outline"
            onClick={handleExport}
          >
            Export Data

            <ExternalLink className="h-4 w-4" />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-10 w-10"
          >
            {mounted && theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Mobile Menu (placeholder for future) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 sm:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
