"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronsUpDown, LayoutGrid, Plus } from "lucide-react";
import { CalendarDot } from "@/components/plan/CalendarDot";
import { CreatePlanDialog } from "@/components/plan/CreatePlanDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { suggestPlanColor } from "@/lib/domain/plans";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";

/** Header control to jump between calendars. Only shown inside a calendar. */
export function CalendarSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const currentPlan = usePlannerStore((s) => s.currentPlan);
  const plans = usePlannerStore((s) => s.plans);
  const loadPlans = usePlannerStore((s) => s.loadPlans);
  const [createOpen, setCreateOpen] = useState(false);
  const inCalendar = pathname.startsWith("/plan/");

  useEffect(() => {
    if (inCalendar) void loadPlans();
  }, [inCalendar, loadPlans]);

  if (!inCalendar || !currentPlan) return null;

  return (
    <>
      <span aria-hidden className="select-none text-muted-foreground/40">
        /
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Switch calendar"
            className="-ml-1 min-w-0 max-w-36 gap-2 px-2 font-semibold sm:max-w-64"
          >
            <CalendarDot color={currentPlan.color} />
            <span className="truncate">{currentPlan.title}</span>
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Calendars</DropdownMenuLabel>
          {plans.map((plan) => {
            const active = plan.id === currentPlan.id;
            return (
              <DropdownMenuItem
                key={plan.id}
                className={cn(active && "bg-accent/60")}
                onSelect={() => {
                  if (!active) router.push(`/plan/${plan.id}`);
                }}
              >
                <CalendarDot color={plan.color} />
                <span className="min-w-0 flex-1 truncate">{plan.title}</span>
                {active && <Check className="text-muted-foreground" />}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => router.push("/")}>
            <LayoutGrid />
            All calendars
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setCreateOpen(true)}>
            <Plus />
            New calendar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreatePlanDialog
        open={createOpen}
        defaultColor={suggestPlanColor(plans)}
        onClose={() => setCreateOpen(false)}
        onCreated={(plan) => router.push(`/plan/${plan.id}`)}
      />
    </>
  );
}
