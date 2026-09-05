"use client";

import type { ReactNode } from "react";
import { ChevronDown, Flag, ListTodo, PanelLeftClose, Sparkles } from "lucide-react";
import { useCalendarUi } from "@/components/calendar/calendar-ui";
import { ProgressDonut } from "@/components/item/ProgressDonut";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { categorySurface } from "@/lib/colors";
import { getKindOption, getStatusOption } from "@/lib/constants";
import { planningContext, type PlanningObjective } from "@/lib/planning/context";
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
  const zoom = scale === "hour" ? "day" : scale;
  const context = planningContext(items, range, zoom);
  const empty = context.objectives.length === 0 && context.prep.length === 0 && context.toSchedule.length === 0;
  const openByDefault = zoom === "week" || zoom === "day";

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
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:thin]">
        {empty ? (
          <p className="text-sm text-muted-foreground">
            No goals in this period. Events without a goal stay on the calendar.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {context.objectives.length > 0 && (
              <section className="space-y-2">
                <SectionLabel icon={Flag}>{zoom === "year" ? "Horizons" : "Goals"}</SectionLabel>
                {context.objectives.map((group) => (
                  <GoalBlock
                    key={group.item.id}
                    group={group}
                    color={group.item.categoryId ? colorById.get(group.item.categoryId) : undefined}
                    defaultOpen={openByDefault}
                    showChildren={zoom !== "year"}
                  />
                ))}
              </section>
            )}
            {context.prep.length > 0 && (
              <section className="space-y-2">
                <SectionLabel icon={Sparkles}>Before events</SectionLabel>
                {context.prep.map((entry) => (
                  <div key={entry.event.id} className="space-y-0.5">
                    <ItemLine item={entry.event} />
                    {entry.tasks.map((task) => (
                      <ItemLine key={task.id} item={task} muted />
                    ))}
                  </div>
                ))}
              </section>
            )}
            {context.toSchedule.length > 0 && (
              <section className="space-y-1">
                <SectionLabel icon={ListTodo}>To schedule</SectionLabel>
                {context.toSchedule.map((item) => (
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

function GoalBlock({
  group,
  color,
  defaultOpen,
  showChildren,
}: {
  group: PlanningObjective;
  color?: string;
  defaultOpen: boolean;
  showChildren: boolean;
}) {
  const ui = useCalendarUi();
  const selected = ui?.selectedId === group.item.id;
  const surface = color ? categorySurface(color, "objective") : undefined;
  const hasBody = showChildren && (group.events.length > 0 || group.tasks.length > 0 || group.toSchedule.length > 0);

  return (
    <Collapsible defaultOpen={defaultOpen} className="group rounded-md">
      <div
        className={cn("rounded-md", selected && "ring-1 ring-ring")}
        style={surface ? { backgroundImage: surface.backgroundImage } : undefined}
      >
        <div className="flex items-start gap-1">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm"
            onClick={() => ui?.onSelect(group.item.id)}
          >
            <Flag className="size-3.5 shrink-0" style={surface ? { color: surface.color } : undefined} />
            <span className="min-w-0 flex-1 truncate font-medium">{group.item.title}</span>
          </button>
          {group.progress.total > 0 && (
            <span className="py-1 pr-1">
              <ProgressDonut done={group.progress.done} total={group.progress.total} />
            </span>
          )}
          {hasBody && (
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="mt-1 mr-1"
                aria-label="Toggle goal details"
              >
                <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
          )}
        </div>
      </div>
      {hasBody && (
        <CollapsibleContent className="space-y-0.5 pt-1 pl-2">
          {group.events.map((event) => (
            <ItemLine key={event.id} item={event} muted />
          ))}
          {group.tasks.map((task) => (
            <ItemLine key={task.id} item={task} muted />
          ))}
          {group.toSchedule.map((task) => (
            <ItemLine key={task.id} item={task} muted />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
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
