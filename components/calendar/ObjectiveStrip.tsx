"use client";

import { Flag } from "lucide-react";
import { useCalendarUi } from "@/components/calendar/calendar-ui";
import { Progress } from "@/components/ui/progress";
import { useChildProgress } from "@/hooks/useItemTree";
import { categorySurface } from "@/lib/colors";
import { cn, shellClasses } from "@/lib/utils";
import type { Category, PlanItem } from "@/types";

interface ObjectiveStripProps {
  objectives: PlanItem[];
  categories: Category[];
  highlightId?: string | null;
}

/**
 * Objectives active in the visible period, above the calendar grid.
 * They are not listed per day: this is where the long horizon lives.
 */
export function ObjectiveStrip({ objectives, categories, highlightId }: ObjectiveStripProps) {
  if (objectives.length === 0) return null;
  const colorById = new Map(categories.map((category) => [category.id, category.color]));

  return (
    <div
      className={cn(
        shellClasses(),
        "flex shrink-0 items-center gap-2 overflow-x-auto border-b py-2 [scrollbar-width:thin]"
      )}
    >
      <span className="flex shrink-0 items-center gap-1 pr-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Flag className="size-3" />
        Objectives
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
  const surface = color ? categorySurface(color, "objective") : undefined;

  return (
    <button
      type="button"
      title={`Objective: ${item.title}`}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex h-7 shrink-0 items-center gap-2 rounded-md border border-dashed px-2 text-xs transition-colors hover:bg-accent/40",
        !color && "border-primary/50 bg-primary/10",
        completed && "opacity-60",
        selected && "ring-2 ring-ring"
      )}
      style={surface}
      onClick={() => ui?.onSelect(item.id)}
    >
      <Flag className="size-3 shrink-0 opacity-80" />
      <span className={cn("max-w-48 truncate font-medium", completed && "line-through")}>{item.title}</span>
      {total > 0 && (
        <span
          className="flex items-center gap-1.5 [&_[data-slot=progress-indicator]]:bg-current"
          style={color ? { color } : undefined}
        >
          <Progress
            value={Math.round((done / total) * 100)}
            aria-label={`${done} of ${total} tasks done`}
            className={cn("h-1 w-10", color ? "bg-current/15" : "bg-primary/20")}
          />
          <span className="tabular-nums text-muted-foreground">
            {done}/{total}
          </span>
        </span>
      )}
    </button>
  );
}
