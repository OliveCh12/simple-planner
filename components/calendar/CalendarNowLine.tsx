"use client";

import { differenceInCalendarDays } from "date-fns";
import { useNowMinute } from "@/hooks/useNow";
import { nowLineOffset, pad2 } from "@/lib/calendar-snap";

interface CalendarNowProps {
  origin: Date;
  days: number;
  gutter: string;
}

function columnStyle(index: number, days: number, gutter: string): { left: string; width: string } {
  return {
    left: `calc(${gutter} + ${index} * (100% - ${gutter}) / ${days})`,
    width: `calc((100% - ${gutter}) / ${days})`,
  };
}

function todayIndex(now: Date, origin: Date, days: number): number {
  const index = differenceInCalendarDays(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    origin
  );
  if (index < 0 || index >= days) return -1;
  return index;
}

/**
 * Current-time indicator for week and day grids. Owns its own minute clock so a
 * tick moves only this element, never the grid around it. A faint line crosses
 * every day; today's column carries the solid line, the dot and the time.
 */
export function CalendarNowLine({ origin, days, gutter }: CalendarNowProps) {
  const now = useNowMinute();
  const index = todayIndex(now, origin, days);
  if (index < 0) return null;
  const top = nowLineOffset(now);
  const label = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  const column = columnStyle(index, days, gutter);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-20 h-0 transition-[top] duration-700 ease-out"
      style={{ top }}
      role="status"
      aria-live="off"
      aria-label={`Current time ${label}`}
    >
      {days > 1 && (
        <div aria-hidden className="absolute right-0 h-px bg-now/25" style={{ left: gutter }} />
      )}
      <div aria-hidden className="absolute h-0.5 -translate-y-px bg-now" style={column} />
      <span
        aria-hidden
        className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-now ring-2 ring-background"
        style={{ left: column.left }}
      />
      <span
        aria-hidden
        className="absolute h-7 -translate-y-1/2 bg-background"
        style={{ left: 0, width: `calc(${gutter} - 1px)` }}
      />
      <span
        aria-hidden
        className="absolute -translate-y-1/2 rounded-sm bg-now px-1 py-px text-center text-[10px] leading-4 font-semibold tabular-nums text-now-foreground"
        style={{ left: 4, width: `calc(${gutter} - 8px)` }}
      >
        {label}
      </span>
    </div>
  );
}

/** Faint wash over the hours already gone today. Same self-owned clock. */
export function CalendarPastFill({ origin, days, gutter }: CalendarNowProps) {
  const now = useNowMinute();
  const index = todayIndex(now, origin, days);
  if (index < 0) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-[1] bg-cal-past transition-[height] duration-700 ease-out"
      style={{ top: 0, height: nowLineOffset(now), ...columnStyle(index, days, gutter) }}
    />
  );
}
