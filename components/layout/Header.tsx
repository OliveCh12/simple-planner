"use client";

import Link from "next/link";
import { Moon, Sun, Menu, ExternalLink, Settings } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUIStore } from "@/store/uiStore";
import { downloadBackup } from "@/lib/db";
import { containerClasses } from "@/lib/utils";

const emptySubscribe = () => () => {};

function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

function isDarkTheme(theme: "light" | "dark" | "auto") {
  if (theme === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return theme === "dark";
}

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

const ThemeToggle = () => {
  const theme = useUIStore((s) => s.settings.theme);
  const updateSettings = useUIStore((s) => s.updateSettings);
  const hydrated = useHydrated();

  if (!hydrated) {
    return <div className="h-10 w-10" />;
  }

  const isDarkMode = isDarkTheme(theme);

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={() => updateSettings({ theme: isDarkMode ? "light" : "dark" })}
      aria-label="Toggle theme"
    >
      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
};

const ExportButton = ({ onSuccess }: { onSuccess?: () => void }) => {
  const settings = useUIStore((s) => s.settings);

  const handleExport = async () => {
    try {
      await downloadBackup(settings);
      onSuccess?.();
    } catch (error) {
      console.error("Export failed:", error);
      useUIStore.getState().notify("Failed to export data. Please try again.");
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} className="gap-2">
      Export Data
      <ExternalLink className="h-4 w-4" />
    </Button>
  );
};

const SettingsButton = () => (
  <Link href="/settings">
    <Button variant="secondary" size="icon" aria-label="Settings">
      <Settings className="h-5 w-5" />
    </Button>
  </Link>
);

const DesktopNav = () => (
  <nav className="hidden sm:flex items-center gap-2">
    <SettingsButton />
    <ExportButton />
    <ThemeToggle />
  </nav>
);

const MobileNav = () => {
  const hydrated = useHydrated();
  const theme = useUIStore((s) => s.settings.theme);
  const updateSettings = useUIStore((s) => s.updateSettings);

  return (
    <div className="sm:hidden">
      <Sheet>
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
            <ExportButton />
            {hydrated && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="theme-switch" className="font-medium">
                  Dark Mode
                </Label>
                <Switch
                  id="theme-switch"
                  checked={isDarkTheme(theme)}
                  onCheckedChange={(checked) => {
                    updateSettings({ theme: checked ? "dark" : "light" });
                  }}
                  aria-label="Toggle dark mode"
                />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className={`flex h-16 items-center justify-between ${containerClasses()}`}>
        <div className="hidden sm:block">
          <Logo />
        </div>
        <div className="sm:hidden">
          <Link href="/" className="font-bold text-xl">
            Planner
          </Link>
        </div>
        <DesktopNav />
        <MobileNav />
      </div>
    </header>
  );
}
