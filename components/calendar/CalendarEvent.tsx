"use client";

import { ChevronRight, CornerDownRight, Repeat } from "lucide-react";
import { useCalendarUi } from "@/components/calendar/calendar-ui";
import { SubtaskTree } from "@/components/calendar/SubtaskTree";
import { useChildProgress, useHasFoldableChildren, useIsSubtask } from "@/hooks/useItemTree";
import { timedLabel, type CalendarOccurrence } from "@/lib/calendar";
import { categorySurface, surfaceTone } from "@/lib/colors";
import { getKindOption, getStatusOption } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";

interface CalendarEventProps {
  occurrence: CalendarOccurrence;
  time?: string;
  /** Compact row (month, all-day) or a filling block (week/day timed). */
  variant?: "chip" | "block";
  className?: string;
  highlight?: boolean;
}

export function CalendarEvent({
  occurrence,
  time,
  variant = "chip",
  className,
  highlight,
}: CalendarEventProps) {
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
  const block = variant === "block";
  const compactTree = variant === "chip";

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col rounded-md text-xs leading-tight",
        expanded ? "z-20 overflow-visible" : "overflow-hidden",
        occurrence.kind === "event" && "font-medium",
        subtask && "text-muted-foreground",
        occurrence.status === "completed" && "opacity-50",
        !color && "bg-primary/15",
        selected && "ring-1 ring-ring ring-offset-1 ring-offset-background",
        className
      )}
      style={surface ? { backgroundImage: surface.backgroundImage } : undefined}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex min-w-0 items-stretch">
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
            "flex min-w-0 flex-1 gap-1.5 px-1.5 text-left",
            block ? "h-full items-start py-1" : "items-center py-0.5",
            occurrence.status === "completed" && "line-through"
          )}
          onClick={(event) => {
            event.stopPropagation();
            ui?.onSelect(occurrence.itemId, item.recurrence ? occurrence.start : undefined);
          }}
        >
          <Icon
            className={cn("size-3 shrink-0", block && "mt-px")}
            style={surface ? { color: surface.color } : undefined}
          />
          {item.recurrence && <Repeat className="size-3 shrink-0 opacity-50" />}
          {label && (
            <span className="shrink-0 text-[10px] leading-4 tabular-nums text-muted-foreground">{label}</span>
          )}
          <span className="min-w-0 flex-1 truncate leading-4">{occurrence.title}</span>
          {total > 0 && (
            <span className="shrink-0 text-[10px] leading-4 tabular-nums text-muted-foreground" aria-label={`${done} of ${total} done`}>
              {done}/{total}
            </span>
          )}
          <status.icon className={cn("size-3 shrink-0", status.className)} />
        </button>
      </div>
      {foldable && expanded && <SubtaskTree parentId={occurrence.itemId} compact={compactTree} />}
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
