"use client";

import { ChevronRight, CornerDownRight } from "lucide-react";
import { useCalendarUi } from "@/components/calendar/calendar-ui";
import { useChildProgress, useHasFoldableChildren, useIsSubtask } from "@/hooks/useItemTree";
import { timedLabel, type CalendarOccurrence } from "@/lib/calendar";
import { categorySurface, surfaceTone } from "@/lib/colors";
import { getKindOption, getStatusOption } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";

interface CalendarEventProps {
  occurrence: CalendarOccurrence;
  time?: string;
  className?: string;
  highlight?: boolean;
}

export function CalendarEvent({ occurrence, time, className, highlight }: CalendarEventProps) {
  const item = usePlannerStore((s) => s.items.find((entry) => entry.id === occurrence.itemId));
  const ui = useCalendarUi();
  const { done, total } = useChildProgress(occurrence.itemId);
  const foldable = useHasFoldableChildren(occurrence.itemId);
  const subtask = useIsSubtask({ kind: occurrence.kind, parentId: item?.parentId });
  if (!item) return null;

  const kind = getKindOption(occurrence.kind);
  const status = getStatusOption(occurrence.status);
  const color = occurrence.categoryColor;
  const label = time ?? timedLabel(occurrence);
  const Icon = subtask ? CornerDownRight : kind.icon;
  const expanded = Boolean(ui?.showSubtasks || ui?.expandedIds.has(occurrence.itemId));
  const selected = highlight || ui?.selectedId === occurrence.itemId;
  const surface = color ? categorySurface(color, surfaceTone(occurrence.kind, subtask)) : undefined;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-stretch overflow-hidden rounded-md border text-xs leading-tight",
        occurrence.kind === "event" && "border-l-[3px] font-medium",
        occurrence.kind === "objective" && "border-dashed",
        subtask && "border-dotted text-muted-foreground",
        occurrence.status === "completed" && "opacity-50",
        !color && "border-primary/40 bg-primary/15",
        selected && "ring-2 ring-ring",
        className
      )}
      style={surface}
      onClick={(event) => event.stopPropagation()}
    >
      {foldable && (
        <button
          type="button"
          data-expand
          aria-expanded={expanded}
          aria-label={expanded ? `Hide subtasks of ${occurrence.title}` : `Show subtasks of ${occurrence.title}`}
          title={expanded ? "Hide subtasks" : "Show subtasks"}
          className="flex w-5 shrink-0 items-center justify-center text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation();
            ui?.onToggleExpand(occurrence.itemId);
          }}
        >
          <ChevronRight className={cn("size-3 transition-transform", expanded && "rotate-90")} />
        </button>
      )}
      <button
        type="button"
        title={`${subtask ? "Subtask" : kind.label}: ${occurrence.title}`}
        aria-label={`${subtask ? "Subtask" : kind.label}: ${occurrence.title}`}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "flex min-w-0 flex-1 items-start gap-1 px-1.5 py-0.5 text-left",
          occurrence.status === "completed" && "line-through"
        )}
        onClick={(event) => {
          event.stopPropagation();
          ui?.onSelect(occurrence.itemId, item.recurrence ? occurrence.start : undefined);
        }}
      >
        <Icon className="size-3 shrink-0 opacity-80" />
        {label && <span className="shrink-0 tabular-nums text-muted-foreground">{label}</span>}
        <span className="min-w-0 flex-1 truncate">{occurrence.title}</span>
        {total > 0 && (
          <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground" aria-label={`${done} of ${total} done`}>
            {done}/{total}
          </span>
        )}
        <status.icon className={cn("size-3 shrink-0", status.className)} />
      </button>
    </div>
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
