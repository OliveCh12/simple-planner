"use client";

import type { ReactNode } from "react";
import { ChevronRight, Repeat } from "lucide-react";
import { useCalendarUi } from "@/components/calendar/calendar-ui";
import { ProgressDonut } from "@/components/item/ProgressDonut";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
}

/**
 * The plan for the visible period: goals with their work, prep before events,
 * and tasks still to place. Reads as an outline; hierarchy comes from indent
 * and type, not from fills.
 */
export function PlanningPanel({ range, scale }: PlanningPanelProps) {
  const items = usePlannerStore((s) => s.items);
  const categories = usePlannerStore((s) => s.categories);
  const colorById = new Map(categories.map((category) => [category.id, category.color]));
  const zoom = scale === "hour" ? "day" : scale;
  const context = planningContext(items, range, zoom);
  const empty = context.objectives.length === 0 && context.prep.length === 0 && context.toSchedule.length === 0;
  const openByDefault = zoom === "week" || zoom === "day";

  return (
    <div className="scroll-thin flex h-full min-h-0 flex-col overflow-y-auto px-2 py-3">
      {empty ? (
        <p className="px-2 pt-1 text-[13px] leading-relaxed text-muted-foreground">
          Nothing planned for this period. Goals and the work behind them will appear here.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {context.objectives.length > 0 && (
            <section className="flex flex-col gap-0.5">
              <SectionLabel>{zoom === "year" ? "Horizons" : "Goals"}</SectionLabel>
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
            <section className="flex flex-col gap-0.5">
              <SectionLabel>Before events</SectionLabel>
              {context.prep.map((entry) => (
                <div key={entry.event.id}>
                  <ItemLine item={entry.event} color={entry.event.categoryId ? colorById.get(entry.event.categoryId) : undefined} />
                  <div className="ml-[15px] border-l border-cal-line-strong pl-1.5">
                    {entry.tasks.map((task) => (
                      <ItemLine key={task.id} item={task} nested />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}
          {context.toSchedule.length > 0 && (
            <section className="flex flex-col gap-0.5">
              <SectionLabel>To schedule</SectionLabel>
              {context.toSchedule.map((item) => (
                <ItemLine key={item.id} item={item} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
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
  const hasBody = showChildren && (group.events.length > 0 || group.tasks.length > 0 || group.toSchedule.length > 0);
  const done = group.item.status === "completed";

  return (
    <Collapsible defaultOpen={defaultOpen} className="group/goal">
      <div
        className={cn(
          "relative flex h-8 items-center gap-1 rounded-md pr-1 transition-colors",
          selected ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/70"
        )}
      >
        <span
          aria-hidden
          className="absolute top-1.5 bottom-1.5 left-1 w-[3px] rounded-full bg-[var(--goal,var(--primary))]"
          style={color ? ({ "--goal": color } as React.CSSProperties) : undefined}
        />
        {hasBody ? (
          <CollapsibleTrigger asChild>
            <button
              type="button"
              aria-label="Toggle goal details"
              className="ml-2.5 flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]/goal:rotate-90" />
            </button>
          </CollapsibleTrigger>
        ) : (
          <span className="ml-2.5 size-5 shrink-0" />
        )}
        <button
          type="button"
          aria-current={selected ? "true" : undefined}
          className={cn(
            "flex h-full min-w-0 flex-1 items-center gap-2 rounded-sm text-left text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
            done && "text-muted-foreground line-through"
          )}
          onClick={() => ui?.onSelect(group.item.id)}
        >
          <span className="truncate">{group.item.title}</span>
        </button>
        {group.progress.total > 0 && (
          <span className="flex shrink-0 items-center gap-1.5 pr-1 text-[11px] tabular-nums text-muted-foreground">
            <ProgressDonut
              done={group.progress.done}
              total={group.progress.total}
              size={16}
              stroke={2.5}
              label={false}
              color={color}
            />
            {group.progress.done}/{group.progress.total}
          </span>
        )}
      </div>
      {hasBody && (
        <CollapsibleContent className="ml-[19px] border-l border-cal-line-strong pl-1.5 pt-0.5 pb-1">
          {group.events.map((event) => (
            <ItemLine key={event.id} item={event} nested />
          ))}
          {group.tasks.map((task) => (
            <ItemLine key={task.id} item={task} nested />
          ))}
          {group.toSchedule.map((task) => (
            <ItemLine key={task.id} item={task} nested unscheduled />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

function ItemLine({
  item,
  nested,
  unscheduled,
  color,
}: {
  item: PlanItem;
  nested?: boolean;
  unscheduled?: boolean;
  color?: string;
}) {
  const ui = useCalendarUi();
  const selected = ui?.selectedId === item.id;
  const kind = getKindOption(item.kind);
  const status = getStatusOption(item.status);
  const Icon = kind.icon;
  const done = item.status === "completed";
  const showStatus = item.status !== "pending";

  return (
    <button
      type="button"
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex h-7 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "bg-sidebar-accent text-foreground" : "hover:bg-sidebar-accent/70",
        done && "text-muted-foreground",
        unscheduled && !done && "text-foreground/80"
      )}
      onClick={() => ui?.onSelect(item.id)}
    >
      <Icon
        className={cn("size-3.5 shrink-0", !color && "text-muted-foreground")}
        style={color ? { color } : undefined}
      />
      <span className={cn("min-w-0 flex-1 truncate", done && "line-through", nested && "text-[12.5px]")}>
        {item.title}
      </span>
      {item.recurrence && <Repeat className="size-3 shrink-0 text-muted-foreground" />}
      {unscheduled && !done && (
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">plan</span>
      )}
      {showStatus && <status.icon className={cn("size-3 shrink-0", status.className)} />}
    </button>
  );
}
