"use client";

import Link from "next/link";
import { Moon, Settings, Sun, Waypoints } from "lucide-react";
import { CalendarSwitcher } from "@/components/layout/CalendarSwitcher";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHydrated } from "@/hooks/useHydrated";
import { cn, shellClasses } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";

function isDarkTheme(theme: "light" | "dark" | "auto") {
  if (theme === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return theme === "dark";
}

function ThemeToggle() {
  const theme = useUIStore((s) => s.settings.theme);
  const updateSettings = useUIStore((s) => s.updateSettings);
  const hydrated = useHydrated();

  if (!hydrated) return <div className="size-8" />;

  const dark = isDarkTheme(theme);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          onClick={() => updateSettings({ theme: dark ? "light" : "dark" })}
        >
          {dark ? <Sun /> : <Moon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{dark ? "Light theme" : "Dark theme"}</TooltipContent>
    </Tooltip>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className={cn(shellClasses(), "flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1")}>
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-md text-sm font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Waypoints className="size-4 text-primary" />
            Planner
          </Link>
          <CalendarSwitcher />
        </div>
        <nav className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href="/settings/appearance" aria-label="Settings">
                  <Settings />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </nav>
      </div>
    </header>
  );
}
