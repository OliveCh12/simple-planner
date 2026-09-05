"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addDays, isSameDay } from "date-fns";
import { useCalendarUi } from "@/components/calendar/calendar-ui";
import { CalendarEvent } from "@/components/calendar/CalendarEvent";
import { HOUR_PX, TimedGhost } from "@/components/calendar/CalendarWeek";
import { occurrenceInterval, packInRange, timedLabel, type CalendarOccurrence } from "@/lib/calendar";
import { useCalendarPointer } from "@/hooks/useCalendarPointer";
import { formatLocalDate, parseLocal } from "@/lib/time/local";
import { cn } from "@/lib/utils";

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

interface CalendarDayProps {
  focus: Date;
  occurrences: CalendarOccurrence[];
  selectedHour?: number;
  onSelectHour: (hour: number) => void;
  highlightId?: string | null;
}

export function CalendarDay({
  focus,
  occurrences,
  selectedHour,
  onSelectHour,
  highlightId,
}: CalendarDayProps) {
  const start = new Date(focus.getFullYear(), focus.getMonth(), focus.getDate());
  const range = { start, end: addDays(start, 1) };
  const allDay = occurrences.filter((occurrence) => occurrence.allDay);
  const timed = occurrences.filter((occurrence) => !occurrence.allDay);
  const packed = packInRange(
    timed.map((occurrence) => ({ id: occurrence.id, interval: occurrenceInterval(occurrence) })),
    range
  );
  const byId = new Map(timed.map((occurrence) => [occurrence.id, occurrence]));
  const laneCount = Math.max(1, packed.laneCount);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [gridEl, setGridEl] = useState<HTMLDivElement | null>(null);
  const ui = useCalendarUi();
  const onMoveItem = ui?.onMoveItem;
  const onCommit = useCallback(
    (commit: Parameters<NonNullable<typeof onMoveItem>>[0]) => {
      onMoveItem?.(commit);
    },
    [onMoveItem]
  );
  const { preview, draggingId } = useCalendarPointer(gridEl, onCommit);

  useEffect(() => {
    if (!scrollerRef.current) return;
    const highlighted = highlightId
      ? occurrences.find((occurrence) => occurrence.itemId === highlightId && !occurrence.allDay)
      : undefined;
    const hour = highlighted
      ? parseLocal(highlighted.start).getHours()
      : isSameDay(focus, new Date())
        ? new Date().getHours()
        : 8;
    scrollerRef.current.scrollTop = Math.max(0, (hour - 1) * HOUR_PX);
  }, [focus, highlightId, occurrences]);

  return (
    <div
      ref={setGridEl}
      data-cal-grid="day"
      data-cal-origin={formatLocalDate(start)}
      data-cal-days="1"
      data-cal-gutter="64"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div data-cal-allday className="shrink-0 border-b px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">All day</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {allDay.length === 0 && <p className="text-xs text-muted-foreground">No all-day items</p>}
          {allDay.map((occurrence) => (
            <div key={occurrence.id} className="max-w-xs">
              <CalendarEvent
                occurrence={occurrence}
                highlight={occurrence.itemId === highlightId}
                draggable
                dimmed={draggingId === occurrence.itemId}
              />
            </div>
          ))}
        </div>
      </div>
      <div ref={scrollerRef} data-cal-timed className="relative min-h-0 flex-1 overflow-y-auto">
        {Array.from({ length: 24 }, (_, hour) => (
          <button
            key={hour}
            type="button"
            className={cn(
              "flex h-11 w-full border-b border-border/50 text-left hover:bg-muted/40",
              selectedHour === hour && "bg-accent/60"
            )}
            onClick={() => onSelectHour(hour)}
          >
            <span className="w-16 shrink-0 px-3 py-1 text-xs tabular-nums text-muted-foreground">
              {pad(hour)}:00
            </span>
          </button>
        ))}
        <div className="pointer-events-none absolute inset-y-0 left-16 right-2">
          {packed.spans.map((span) => {
            const occurrence = byId.get(span.id);
            if (!occurrence) return null;
            const colWidth = 100 / laneCount;
            return (
              <div
                key={span.id}
                className="pointer-events-auto absolute px-0.5"
                style={{
                  top: span.startFrac * 24 * HOUR_PX,
                  height: Math.max(18, (span.endFrac - span.startFrac) * 24 * HOUR_PX),
                  left: `${span.lane * colWidth}%`,
                  width: `${colWidth}%`,
                }}
              >
                <CalendarEvent
                  occurrence={occurrence}
                  time={timedLabel(occurrence)}
                  variant="block"
                  className="h-full"
                  highlight={occurrence.itemId === highlightId}
                  draggable
                  dimmed={draggingId === occurrence.itemId}
                />
              </div>
            );
          })}
          {preview && !preview.allDay && (
            <TimedGhost preview={preview} origin={start} days={1} gutter="0px" />
          )}
        </div>
      </div>
    </div>
  );
}
