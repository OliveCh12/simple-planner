"use client";

import { TaskDetailsPanel } from "@/components/item/TaskDetailsPanel";
import { timedLabel, type CalendarOccurrence } from "@/lib/calendar";
import { colorAlpha } from "@/lib/colors";
import { getKindOption, getStatusOption } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";
import { useState } from "react";

interface CalendarEventProps {
  occurrence: CalendarOccurrence;
  time?: string;
  className?: string;
  highlight?: boolean;
}

export function CalendarEvent({ occurrence, time, className, highlight }: CalendarEventProps) {
  const item = usePlannerStore((s) => s.items.find((entry) => entry.id === occurrence.itemId));
  const [detailsOpen, setDetailsOpen] = useState(false);
  if (!item) return null;

  const kind = getKindOption(occurrence.kind);
  const status = getStatusOption(occurrence.status);
  const color = occurrence.categoryColor;
  const label = time ?? timedLabel(occurrence);

  return (
    <TaskDetailsPanel item={item} open={detailsOpen} onOpenChange={setDetailsOpen}>
      <button
        type="button"
        title={`${kind.label}: ${occurrence.title}`}
        aria-label={`${kind.label}: ${occurrence.title}`}
        className={cn(
          "flex w-full min-w-0 items-center gap-1 overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-xs leading-tight",
          occurrence.kind === "event" && "border-l-[3px] font-medium",
          occurrence.kind === "task" && "bg-transparent",
          occurrence.kind === "objective" && "border-dashed",
          occurrence.status === "completed" && "opacity-50 line-through",
          !color && "border-primary/40 bg-primary/15",
          highlight && "ring-2 ring-ring",
          className
        )}
        style={
          color
            ? {
                borderColor: color,
                borderLeftColor: color,
                backgroundColor: colorAlpha(color, occurrence.kind === "event" ? 0.22 : 0.12),
              }
            : undefined
        }
      >
        <kind.icon className="size-3 shrink-0 opacity-80" />
        {label && <span className="shrink-0 tabular-nums text-muted-foreground">{label}</span>}
        <span className="min-w-0 truncate">{occurrence.title}</span>
        <status.icon className={cn("ml-auto size-3 shrink-0", status.className)} />
      </button>
    </TaskDetailsPanel>
  );
}

export function CalendarOccurrenceList({
  occurrences,
  highlightId,
}: {
  occurrences: CalendarOccurrence[];
  highlightId?: string | null;
}) {
  if (occurrences.length === 0) {
    return <p className="px-1.5 text-xs text-muted-foreground">Nothing on this day.</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {occurrences.map((occurrence) => (
        <li key={occurrence.id}>
          <CalendarEvent occurrence={occurrence} highlight={occurrence.itemId === highlightId} />
        </li>
      ))}
    </ul>
  );
}
