"use client";

import { useLayoutEffect, useRef } from "react";
import { Flag } from "lucide-react";
import { useCalendarUi } from "@/components/calendar/calendar-ui";
import { ProgressDonut } from "@/components/item/ProgressDonut";
import { useChildProgress } from "@/hooks/useItemTree";
import { unfold } from "@/lib/motion";
import { cn, shellClasses } from "@/lib/utils";
import type { Category, PlanItem } from "@/types";

interface ObjectiveStripProps {
  objectives: PlanItem[];
  categories: Category[];
  highlightId?: string | null;
}

/**
 * Objectives active in the visible period, above the calendar grid.
 * Shown when the plan pane is closed, so the long horizon stays one glance away.
 */
export function ObjectiveStrip({ objectives, categories, highlightId }: ObjectiveStripProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const empty = objectives.length === 0;

  // The strip takes the plan pane's place: it unfolds rather than snapping in.
  useLayoutEffect(() => {
    if (!empty && rootRef.current) unfold(rootRef.current);
  }, [empty]);

  if (empty) return null;
  const colorById = new Map(categories.map((category) => [category.id, category.color]));

  return (
    <div
      ref={rootRef}
      className={cn(
        shellClasses(),
        "scroll-thin flex h-9 shrink-0 items-center gap-1 overflow-x-auto border-b border-cal-line-strong"
      )}
    >
      <span className="mr-1 shrink-0 text-[11.5px] font-semibold uppercase tracking-wider text-foreground/55">
        Goals
      </span>
      {objectives.map((objective) => (
        <ObjectiveChip
          key={objective.id}
          item={objective}
          color={objective.categoryId ? colorById.get(objective.categoryId) : undefined}
          highlight={objective.id === highlightId}
        />
      ))}
    </div>
  );
}

function ObjectiveChip({
  item,
  color,
  highlight,
}: {
  item: PlanItem;
  color?: string;
  highlight: boolean;
}) {
  const ui = useCalendarUi();
  const { done, total } = useChildProgress(item.id);
  const completed = item.status === "completed";
  const selected = highlight || ui?.selectedId === item.id;

  return (
    <button
      type="button"
      title={`Objective: ${item.title}`}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "bg-accent text-foreground" : "text-foreground/85 hover:bg-accent/70 hover:text-foreground",
        completed && "opacity-60"
      )}
      onClick={() => ui?.onSelect(item.id)}
    >
      <Flag className="size-3 shrink-0" style={color ? { color } : undefined} />
      <span className={cn("max-w-48 truncate font-medium", completed && "line-through")}>{item.title}</span>
      {total > 0 && (
        <>
          <ProgressDonut done={done} total={total} size={14} stroke={2.5} label={false} color={color} />
          <span className="tabular-nums text-muted-foreground">
            {done}/{total}
          </span>
        </>
      )}
    </button>
  );
}
