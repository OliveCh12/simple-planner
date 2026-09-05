"use client";

import type { ReactNode } from "react";
import { Flag, ListTodo, PanelLeftClose, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useCalendarUi } from "@/components/calendar/calendar-ui";
import { planningContext } from "@/lib/planning/context";
import { getKindOption, getStatusOption } from "@/lib/constants";
import { categorySurface } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";
import type { PlanItem, TimeScale } from "@/types";
import type { Interval } from "@/lib/time/local";

interface PlanningPanelProps {
  range: Interval;
  scale: TimeScale;
  periodLabel: string;
  onClose: () => void;
}

export function PlanningPanel({ range, scale, periodLabel, onClose }: PlanningPanelProps) {
  const items = usePlannerStore((s) => s.items);
  const categories = usePlannerStore((s) => s.categories);
  const colorById = new Map(categories.map((category) => [category.id, category.color]));
  const context = planningContext(items, range, scale === "hour" ? "day" : scale);
  const empty = context.objectives.length === 0 && context.prep.length === 0 && context.open.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">Plan</p>
          <p className="truncate text-xs text-muted-foreground">{periodLabel}</p>
        </div>
        <Button type="button" variant="ghost" size="icon-xs" aria-label="Close plan" onClick={onClose}>
          <PanelLeftClose />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {empty ? (
          <p className="text-sm text-muted-foreground">Nothing in this period yet.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {context.objectives.length > 0 && (
              <section className="space-y-2">
                <SectionLabel icon={Flag}>Objectives</SectionLabel>
                {context.objectives.map((group) => (
                  <ObjectiveBlock
                    key={group.item.id}
                    item={group.item}
                    progress={group.progress}
                    events={group.events}
                    tasks={group.tasks}
                    color={group.item.categoryId ? colorById.get(group.item.categoryId) : undefined}
                    showLists={scale !== "year"}
                  />
                ))}
              </section>
            )}
            {context.prep.length > 0 && (
              <section className="space-y-2">
                <SectionLabel icon={Sparkles}>Prepare</SectionLabel>
                {context.prep.map((entry) => (
                  <PrepBlock key={entry.event.id} event={entry.event} tasks={entry.tasks} />
                ))}
              </section>
            )}
            {context.open.length > 0 && (
              <section className="space-y-1">
                <SectionLabel icon={ListTodo}>Still open</SectionLabel>
                {context.open.map((item) => (
                  <ItemLine key={item.id} item={item} />
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ icon: Icon, children }: { icon: typeof Flag; children: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      <Icon className="size-3" />
      {children}
    </p>
  );
}

function ObjectiveBlock({
  item,
  progress,
  events,
  tasks,
  color,
  showLists,
}: {
  item: PlanItem;
  progress: { done: number; total: number };
  events: PlanItem[];
  tasks: PlanItem[];
  color?: string;
  showLists: boolean;
}) {
  const ui = useCalendarUi();
  const selected = ui?.selectedId === item.id;
  const surface = color ? categorySurface(color, "objective") : undefined;

  return (
    <div className="space-y-1">
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        className={cn(
          "flex w-full flex-col gap-1.5 rounded-md px-2 py-1.5 text-left text-sm",
          selected ? "ring-1 ring-ring" : "hover:bg-sidebar-accent"
        )}
        style={surface ? { backgroundImage: surface.backgroundImage } : undefined}
        onClick={() => ui?.onSelect(item.id)}
      >
        <span className="flex items-center gap-2">
          <Flag className="size-3.5 shrink-0" style={surface ? { color: surface.color } : undefined} />
          <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
          {progress.total > 0 && (
            <span className="shrink-0 tabular-nums text-[11px] text-muted-foreground">
              {progress.done}/{progress.total}
            </span>
          )}
        </span>
        {progress.total > 0 && (
          <Progress
            value={Math.round((progress.done / progress.total) * 100)}
            aria-label={`${progress.done} of ${progress.total} done`}
            className="h-1"
          />
        )}
      </button>
      {showLists && events.map((event) => <ItemLine key={event.id} item={event} muted />)}
      {showLists && tasks.map((task) => <ItemLine key={task.id} item={task} muted />)}
    </div>
  );
}

function PrepBlock({ event, tasks }: { event: PlanItem; tasks: PlanItem[] }) {
  const remaining = tasks.filter((task) => task.status !== "completed" && task.status !== "cancelled").length;
  return (
    <div className="space-y-0.5">
      <ItemLine item={event} />
      <p className="px-2 text-[11px] text-muted-foreground">
        {remaining === 0 ? "Ready" : `${remaining} to prepare`}
      </p>
      {tasks.map((task) => (
        <ItemLine key={task.id} item={task} muted />
      ))}
    </div>
  );
}

function ItemLine({ item, muted }: { item: PlanItem; muted?: boolean }) {
  const ui = useCalendarUi();
  const selected = ui?.selectedId === item.id;
  const kind = getKindOption(item.kind);
  const status = getStatusOption(item.status);
  const Icon = kind.icon;
  const done = item.status === "completed";

  return (
    <button
      type="button"
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1 text-left text-sm",
        muted && "text-[13px]",
        selected ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/70",
        done && "text-muted-foreground"
      )}
      onClick={() => ui?.onSelect(item.id)}
    >
      <Icon className="size-3.5 shrink-0 opacity-80" />
      <span className={cn("min-w-0 flex-1 truncate", done && "line-through")}>{item.title}</span>
      <status.icon className={cn("size-3 shrink-0 opacity-70", status.className)} />
    </button>
  );
}
