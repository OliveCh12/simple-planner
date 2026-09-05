"use client";

import { Bookmark, CalendarClock, FolderKanban, Inbox, ListTodo, X } from "lucide-react";
import { CalendarDot } from "@/components/plan/CalendarDot";
import { SourceMark } from "@/components/plan/SourceMark";
import type { PlanView } from "@/lib/planning/views";
import { cn } from "@/lib/utils";
import { useUIStore, type SavedView } from "@/store/uiStore";
import type { Plan } from "@/types";

interface PlanNavProps {
  view: PlanView;
  savedViewId: string | null;
  counts: { inbox: number; schedule: number; projects: number; tasks: number };
  plans: Plan[];
  calendarIds: string[];
  onViewChange: (view: PlanView) => void;
  onSavedView: (view: SavedView) => void;
  onCalendarToggle: (id: string | null) => void;
}

const VIEWS: { id: PlanView; label: string; icon: typeof Inbox; hint: string }[] = [
  { id: "inbox", label: "Inbox", icon: Inbox, hint: "Captured, not sorted yet" },
  { id: "schedule", label: "To schedule", icon: CalendarClock, hint: "Clarified work with no slot" },
  { id: "projects", label: "Projects", icon: FolderKanban, hint: "Goals, projects and their tasks" },
  { id: "tasks", label: "All tasks", icon: ListTodo, hint: "Everything, searchable" },
];

/** The Plan rail: four ways in, the calendars in view, and the cuts you saved. */
export function PlanNav({ view, savedViewId, counts, plans, calendarIds, onViewChange, onSavedView, onCalendarToggle }: PlanNavProps) {
  const savedViews = useUIStore((s) => s.savedViews);
  const removeSavedView = useUIStore((s) => s.removeSavedView);

  return (
    <div className="scroll-thin flex h-full min-h-0 flex-col gap-5 overflow-y-auto px-2 py-3">
      <nav aria-label="Plan views" className="flex flex-col gap-0.5">
        {VIEWS.map((entry) => {
          const active = view === entry.id && !savedViewId;
          const count = counts[entry.id];
          return (
            <button
              key={entry.id}
              type="button"
              aria-current={active ? "page" : undefined}
              title={entry.hint}
              className={cn(
                "flex h-8 items-center gap-2 rounded-md px-2 text-left text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active ? "bg-sidebar-accent font-medium text-foreground" : "text-foreground/80 hover:bg-sidebar-accent/70 hover:text-foreground"
              )}
              onClick={() => onViewChange(entry.id)}
            >
              <entry.icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
              <span className="min-w-0 flex-1 truncate">{entry.label}</span>
              {count > 0 && entry.id !== "tasks" && (
                <span className={cn("text-[11px] tabular-nums", entry.id === "inbox" && count > 0 ? "font-semibold text-foreground" : "text-muted-foreground")}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {savedViews.length > 0 && (
        <section className="flex flex-col gap-0.5">
          <p className="mb-1 px-2 text-[11.5px] font-semibold uppercase tracking-wider text-foreground/55">Saved views</p>
          {savedViews.map((saved) => {
            const active = savedViewId === saved.id;
            return (
              <div
                key={saved.id}
                className={cn(
                  "group/saved flex h-8 items-center gap-2 rounded-md pr-1 pl-2 text-[13px]",
                  active ? "bg-sidebar-accent font-medium text-foreground" : "text-foreground/80 hover:bg-sidebar-accent/70"
                )}
              >
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => onSavedView(saved)}
                >
                  <Bookmark className={cn("size-3.5 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                  <span className="truncate">{saved.name}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${saved.name}`}
                  className="flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground opacity-0 outline-none hover:text-foreground group-hover/saved:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => removeSavedView(saved.id)}
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
        </section>
      )}

      {plans.length > 1 && (
        <section className="flex flex-col gap-0.5">
          <p className="mb-1 px-2 text-[11.5px] font-semibold uppercase tracking-wider text-foreground/55">Calendars</p>
          <button
            type="button"
            aria-pressed={calendarIds.length === 0}
            className={cn(
              "flex h-7 items-center gap-2 rounded-md px-2 text-left text-[12.5px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
              calendarIds.length === 0 ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onCalendarToggle(null)}
          >
            <span className="size-2 rounded-full bg-foreground/40" />
            All calendars
          </button>
          {plans.map((plan) => {
            const on = calendarIds.includes(plan.id);
            return (
              <button
                key={plan.id}
                type="button"
                aria-pressed={on}
                className={cn(
                  "flex h-7 items-center gap-2 rounded-md px-2 text-left text-[12.5px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  on ? "bg-sidebar-accent font-medium text-foreground" : "text-foreground/80 hover:bg-sidebar-accent/70",
                  calendarIds.length > 0 && !on && "opacity-60"
                )}
                onClick={() => onCalendarToggle(plan.id)}
              >
                <CalendarDot color={plan.color} />
                <span className="min-w-0 flex-1 truncate">{plan.title}</span>
                <SourceMark source={plan.source} />
              </button>
            );
          })}
        </section>
      )}
    </div>
  );
}
