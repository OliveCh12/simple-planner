"use client";

import { useEffect, useRef } from "react";
import { addDays, eachDayOfInterval, format, isSameDay, startOfWeek } from "date-fns";
import { CalendarEvent } from "@/components/calendar/CalendarEvent";
import {
  occupiesMonthDay,
  occurrenceInterval,
  packInRange,
  timedLabel,
  type CalendarOccurrence,
} from "@/lib/calendar";
import { parseLocal } from "@/lib/time/local";
import { cn } from "@/lib/utils";

export const HOUR_PX = 44;
const LANE_PX = 22;

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function dayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return { start, end: addDays(start, 1) };
}

interface CalendarWeekProps {
  focus: Date;
  weekStartsOn: 0 | 1;
  occurrences: CalendarOccurrence[];
  selectedDay: Date;
  onSelectDay: (day: Date, hour?: number) => void;
  highlightId?: string | null;
}

export function CalendarWeek({
  focus,
  weekStartsOn,
  occurrences,
  selectedDay,
  onSelectDay,
  highlightId,
}: CalendarWeekProps) {
  const weekStart = startOfWeek(focus, { weekStartsOn });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  const weekRange = { start: weekStart, end: addDays(weekStart, 7) };
  const today = new Date();
  const allDay = occurrences.filter((occurrence) => occurrence.allDay);
  const packed = packInRange(
    allDay
      .filter((occurrence) => days.some((day) => occupiesMonthDay(occurrence, day)))
      .map((occurrence) => {
        if (occurrence.kind === "event") {
          return { id: occurrence.id, interval: occurrenceInterval(occurrence) };
        }
        const start = parseLocal(occurrence.start.slice(0, 10));
        return { id: occurrence.id, interval: { start, end: addDays(start, 1) } };
      }),
    weekRange
  );
  const allDayById = new Map(allDay.map((occurrence) => [occurrence.id, occurrence]));
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollerRef.current) return;
    const hour = isSameDay(focus, new Date()) ? new Date().getHours() : 8;
    scrollerRef.current.scrollTop = Math.max(0, (hour - 1) * HOUR_PX);
  }, [focus]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="grid border-b" style={{ gridTemplateColumns: "3.5rem repeat(7, minmax(0, 1fr))" }}>
        <div />
        {days.map((day) => {
          const current = isSameDay(day, today);
          const selected = isSameDay(day, selectedDay);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "border-l px-1 py-2 text-left sm:px-2",
                current && "bg-primary/5",
                selected && "bg-accent/70"
              )}
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {format(day, "EEE")}
              </p>
              <p
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  current &&
                    "inline-flex size-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </p>
            </button>
          );
        })}
      </div>

      <div className="shrink-0 border-b">
        <div className="grid" style={{ gridTemplateColumns: "3.5rem repeat(7, minmax(0, 1fr))" }}>
          <p className="px-1 pt-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            All day
          </p>
          <div
            className="relative col-span-7"
            style={{ height: Math.max(1, packed.laneCount) * LANE_PX + 8 }}
          >
            {packed.spans.map((span) => {
              const occurrence = allDayById.get(span.id);
              if (!occurrence) return null;
              return (
                <div
                  key={span.id}
                  className="absolute px-0.5"
                  style={{
                    left: `${span.startFrac * 100}%`,
                    width: `${Math.max(1 / 7, span.endFrac - span.startFrac) * 100}%`,
                    top: span.lane * LANE_PX,
                  }}
                >
                  <CalendarEvent
                    occurrence={occurrence}
                    highlight={occurrence.itemId === highlightId}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto">
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: "3.5rem repeat(7, minmax(0, 1fr))",
            height: 24 * HOUR_PX,
          }}
        >
          <div>
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="border-b border-border/50 px-1 text-[11px] tabular-nums text-muted-foreground"
                style={{ height: HOUR_PX }}
              >
                {pad(hour)}:00
              </div>
            ))}
          </div>
          {days.map((day) => {
            const range = dayRange(day);
            const timed = occurrences.filter(
              (occurrence) => !occurrence.allDay && occurrenceInterval(occurrence).start < range.end && occurrenceInterval(occurrence).end > range.start
            );
            const packedDay = packInRange(
              timed.map((occurrence) => ({ id: occurrence.id, interval: occurrenceInterval(occurrence) })),
              range
            );
            const byId = new Map(timed.map((occurrence) => [occurrence.id, occurrence]));
            const laneCount = Math.max(1, packedDay.laneCount);
            const selected = isSameDay(day, selectedDay);
            return (
              <div
                key={day.toISOString()}
                className={cn("relative border-l", selected && "bg-accent/30")}
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const hour = Math.min(23, Math.max(0, Math.floor((event.clientY - rect.top) / HOUR_PX)));
                  onSelectDay(day, hour);
                }}
              >
                {Array.from({ length: 24 }, (_, hour) => (
                  <div key={hour} className="border-b border-border/50" style={{ height: HOUR_PX }} />
                ))}
                {packedDay.spans.map((span) => {
                  const occurrence = byId.get(span.id);
                  if (!occurrence) return null;
                  const colWidth = 100 / laneCount;
                  return (
                    <div
                      key={span.id}
                      className="absolute px-0.5"
                      style={{
                        top: span.startFrac * 24 * HOUR_PX,
                        height: Math.max(18, (span.endFrac - span.startFrac) * 24 * HOUR_PX),
                        left: `${span.lane * colWidth}%`,
                        width: `${colWidth}%`,
                      }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <CalendarEvent
                        occurrence={occurrence}
                        time={timedLabel(occurrence)}
                        variant="block"
                        className="h-full"
                        highlight={occurrence.itemId === highlightId}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
