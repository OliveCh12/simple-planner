"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ListChecks, Moon, Plus, Settings, Sun, Waypoints } from "lucide-react";
import { CaptureDialog } from "@/components/capture/CaptureDialog";
import { CalendarSwitcher } from "@/components/layout/CalendarSwitcher";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHydrated } from "@/hooks/useHydrated";
import { isTypingTarget } from "@/hooks/useUndoRedo";
import { cn, shellClasses } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";
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

/** Calendar answers “what is on the clock”; Plan answers “what must get done”. */
function PrimaryNav() {
  const pathname = usePathname();
  const currentPlan = usePlannerStore((s) => s.currentPlan);
  const plans = usePlannerStore((s) => s.plans);
  const loadPlans = usePlannerStore((s) => s.loadPlans);
  const captureCalendarId = useUIStore((s) => s.captureCalendarId);
  const hydrated = useHydrated();

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const inPlan = pathname === "/plan";
  const inCalendar = pathname.startsWith("/plan/") || pathname === "/";
  const lastCalendar =
    currentPlan?.id ?? plans.find((plan) => plan.id === captureCalendarId)?.id ?? plans[0]?.id;
  const calendarHref = hydrated && lastCalendar ? `/plan/${lastCalendar}` : "/";

  return (
    <nav aria-label="Primary" className="ml-1 flex items-center gap-0.5 rounded-md bg-muted/60 p-0.5">
      <NavLink href={calendarHref} active={inCalendar} icon={CalendarDays}>
        Calendar
      </NavLink>
      <NavLink href="/plan" active={inPlan} icon={ListChecks}>
        Plan
      </NavLink>
    </nav>
  );
}

function NavLink({
  href,
  active,
  icon: Icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: typeof CalendarDays;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-[5px] px-2 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-3.5" />
      <span className="hidden sm:inline">{children}</span>
    </Link>
  );
}

function CaptureButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "k") {
        if (isTypingTarget(event.target) && !open) return;
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Capture" onClick={() => setOpen(true)}>
            <Plus />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Capture <Kbd>⌘K</Kbd>
        </TooltipContent>
      </Tooltip>
      <CaptureDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

/** Identity and global actions only. Period, views and creation live in the calendar toolbar. */
export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-cal-line-strong bg-background">
      <div className={cn(shellClasses(), "flex h-11 items-center justify-between gap-3")}>
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-md text-sm font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Waypoints className="size-4 text-primary" />
            Planner
          </Link>
          <PrimaryNav />
          <CalendarSwitcher />
        </div>
        <nav className="flex shrink-0 items-center gap-0.5">
          <CaptureButton />
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
