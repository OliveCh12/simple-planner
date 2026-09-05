"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addDays, eachDayOfInterval, format, isSameDay, startOfWeek } from "date-fns";
import { useCalendarUi } from "@/components/calendar/calendar-ui";
import { CalendarEvent } from "@/components/calendar/CalendarEvent";
import { AllDayGhost, TimedGhost } from "@/components/calendar/CalendarGhost";
import { CalendarNowLine, CalendarPastFill } from "@/components/calendar/CalendarNowLine";
import { DayWeather, sunSummary } from "@/components/environment/DayWeather";
import { DaylightLayer } from "@/components/environment/DaylightLayer";
import {
  occupiesMonthDay,
  occurrenceInterval,
  packInRange,
  timedLabel,
  type CalendarOccurrence,
} from "@/lib/calendar";
import { HOUR_PX, nowLineOffset, pad2 } from "@/lib/calendar-snap";
import { useCalendarPointer } from "@/hooks/useCalendarPointer";
import { useUIStore } from "@/store/uiStore";
import { useNowCoarse } from "@/hooks/useNow";
import { useDailyWeather, useEnvironmentSettings } from "@/hooks/useWeather";
import { sunTimesCached } from "@/lib/environment/sun";
import { useScrollbarGutter } from "@/hooks/useScrollbarGutter";
import { formatLocalDate, parseLocal } from "@/lib/time/local";
import { containsNow, isElapsedDay, isElapsedOccurrence } from "@/lib/time/presence";
import { cn } from "@/lib/utils";

export { HOUR_PX };
export { AllDayGhost, TimedGhost } from "@/components/calendar/CalendarGhost";
const LANE_PX = 22;
const GUTTER = "3.25rem";
const GUTTER_PX = 52;

function dayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return { start, end: addDays(start, 1) };
}

/** Open the day around now when today is in view, otherwise at the morning. */
export function initialScrollTop(range: { start: Date; end: Date }): number {
  const now = new Date();
  if (containsNow(range, now)) return Math.max(0, nowLineOffset(now) - 2 * HOUR_PX);
  return 8 * HOUR_PX;
}

/** Hour labels sit on the line they name; midnight is implied by the top edge. */
export function HourGutter() {
  return (
    <div className="relative" aria-hidden>
      {Array.from({ length: 23 }, (_, index) => {
        const hour = index + 1;
        return (
          <span
            key={hour}
            className="absolute right-2 -translate-y-1/2 text-[11.5px] leading-none font-medium tabular-nums text-foreground/55"
            style={{ top: hour * HOUR_PX }}
          >
            {pad2(hour)}:00
          </span>
        );
      })}
    </div>
  );
}

export function HourRows() {
  return (
    <>
      {Array.from({ length: 24 }, (_, hour) => (
        <div key={hour} className="border-b border-cal-line last:border-b-0" style={{ height: HOUR_PX }} />
      ))}
    </>
  );
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
  const [scrollerEl, setScrollerEl] = useState<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const attachScroller = useCallback((el: HTMLDivElement | null) => {
    scrollerRef.current = el;
    setScrollerEl(el);
  }, []);
  const [gridEl, setGridEl] = useState<HTMLDivElement | null>(null);
  const scrollbar = useScrollbarGutter(scrollerEl);
  const ui = useCalendarUi();
  const now = useNowCoarse();
  const anchorNow = containsNow(weekRange, now);
  const env = useEnvironmentSettings();
  const place = env.location ?? null;
  const { byDate: weather } = useDailyWeather(place, env.weather, env.units);
  const showDaylight = env.daylight && place !== null;
  const onMoveItem = ui?.onMoveItem;
  const onCommit = useCallback(
    (commit: Parameters<NonNullable<typeof onMoveItem>>[0]) => {
      onMoveItem?.(commit);
    },
    [onMoveItem]
  );
  const onCreate = ui?.canCreate ? ui.onCreateSlot : undefined;
  const hoverPreview = useUIStore((s) => s.settings.hoverPreview);
  const pointerOptions = useMemo(() => ({ hoverPreview }), [hoverPreview]);
  const { preview, hover } = useCalendarPointer(gridEl, onCommit, onCreate, pointerOptions);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const start = startOfWeek(focus, { weekStartsOn });
    scroller.scrollTop = initialScrollTop({ start, end: addDays(start, 7) });
  }, [focus, scrollerEl, weekStartsOn]);

  const columns = `${GUTTER} repeat(7, minmax(0, 1fr))`;
  // Rows above the scroller reserve its scrollbar width, so every column
  // (header, all-day, timed) shares one reference grid.
  const rowStyle = { gridTemplateColumns: columns, paddingRight: scrollbar };

  return (
    <div
      ref={setGridEl}
      data-cal-grid="week"
      data-cal-origin={formatLocalDate(weekStart)}
      data-cal-days="7"
      data-cal-gutter={GUTTER_PX}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="grid border-b border-cal-line-strong" style={rowStyle}>
        <div />
        {days.map((day) => {
          const current = isSameDay(day, now);
          const selected = isSameDay(day, selectedDay);
          const elapsed = anchorNow && isElapsedDay(day, now);
          const dateKey = formatLocalDate(day);
          const sun = showDaylight && place
            ? sunTimesCached(place.lat, place.lon, { year: day.getFullYear(), month: day.getMonth() + 1, day: day.getDate() })
            : undefined;
          const sunText = sunSummary(sun, place?.timezone);
          return (
            <button
              key={day.toISOString()}
              type="button"
              aria-current={current ? "date" : undefined}
              title={!env.weather && sunText ? sunText : undefined}
              onClick={() => onSelectDay(day)}
              className={cn(
                "@container flex h-9 min-w-0 items-center gap-1 overflow-hidden border-l border-cal-line px-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:gap-1.5 sm:px-2",
                current && "bg-cal-today",
                selected && !current && "bg-cal-selected"
              )}
            >
              <span
                className={cn(
                  "text-[11.5px] font-semibold uppercase tracking-wide",
                  current ? "text-now" : "text-foreground/60"
                )}
              >
                <span className="@min-[5.5rem]:hidden">{format(day, "EEEEE")}</span>
                <span className="hidden @min-[5.5rem]:inline">{format(day, "EEE")}</span>
              </span>
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums",
                  current && "bg-now text-now-foreground",
                  elapsed && !current && "text-muted-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              {env.weather && place && (
                <DayWeather
                  day={weather.get(dateKey)}
                  dateKey={dateKey}
                  units={env.units}
                  detail={env.detail}
                  sun={sun}
                  timeZone={place.timezone}
                  className="ml-auto"
                  responsive
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="shrink-0 border-b border-cal-line-strong">
        <div className="grid" style={rowStyle}>
          <p className="self-center pr-2 text-right text-[10.5px] font-semibold uppercase tracking-wider text-foreground/55">
            All day
          </p>
          <div
            data-cal-allday
            className="relative col-span-7"
            style={{ height: Math.max(1, packed.laneCount) * LANE_PX + 6 }}
          >
            {days.map((day, index) => (
              <div
                key={day.toISOString()}
                aria-hidden
                className={cn(
                  "absolute inset-y-0 border-l border-cal-line",
                  isSameDay(day, now) && "bg-cal-today"
                )}
                style={{ left: `${(index / 7) * 100}%`, width: `${100 / 7}%` }}
              />
            ))}
            {packed.spans.map((span) => {
              const occurrence = allDayById.get(span.id);
              if (!occurrence) return null;
              return (
                <div
                  key={span.id}
                  data-cal-slot
                  className="absolute px-0.5 pt-[3px]"
                  style={{
                    left: `${span.startFrac * 100}%`,
                    width: `${Math.max(1 / 7, span.endFrac - span.startFrac) * 100}%`,
                    top: span.lane * LANE_PX,
                  }}
                >
                  <CalendarEvent
                    occurrence={occurrence}
                    highlight={occurrence.itemId === highlightId}
                    draggable
                    elapsed={anchorNow && isElapsedOccurrence(occurrence, now)}
                  />
                </div>
              );
            })}
            {preview?.allDay && <AllDayGhost preview={preview} origin={weekStart} />}
          </div>
        </div>
      </div>

      <div ref={attachScroller} data-cal-timed className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <div data-cal-columns className="relative grid" style={{ gridTemplateColumns: columns, height: 24 * HOUR_PX }}>
          <HourGutter />
          {days.map((day) => {
            const range = dayRange(day);
            const timed = occurrences.filter(
              (occurrence) =>
                !occurrence.allDay &&
                occurrenceInterval(occurrence).start < range.end &&
                occurrenceInterval(occurrence).end > range.start
            );
            const packedDay = packInRange(
              timed.map((occurrence) => ({ id: occurrence.id, interval: occurrenceInterval(occurrence) })),
              range
            );
            const byId = new Map(timed.map((occurrence) => [occurrence.id, occurrence]));
            const laneCount = Math.max(1, packedDay.laneCount);
            const current = isSameDay(day, now);
            const selected = isSameDay(day, selectedDay);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "relative border-l border-cal-line",
                  current && "bg-cal-today",
                  selected && !current && "bg-cal-selected"
                )}
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const hour = Math.min(23, Math.max(0, Math.floor((event.clientY - rect.top) / HOUR_PX)));
                  onSelectDay(day, hour);
                }}
              >
                {showDaylight && place && <DaylightLayer place={place} day={day} />}
                <HourRows />
                {packedDay.spans.map((span) => {
                  const occurrence = byId.get(span.id);
                  if (!occurrence) return null;
                  const colWidth = 100 / laneCount;
                  const slotHeight = Math.max(20, (span.endFrac - span.startFrac) * 24 * HOUR_PX);
                  return (
                    <div
                      key={span.id}
                      data-cal-slot
                      className="absolute px-0.5 py-px"
                      style={{
                        top: span.startFrac * 24 * HOUR_PX,
                        height: slotHeight,
                        left: `${span.lane * colWidth}%`,
                        width: `${colWidth}%`,
                      }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <CalendarEvent
                        occurrence={occurrence}
                        time={timedLabel(occurrence)}
                        variant="block"
                        height={slotHeight - 2}
                        highlight={occurrence.itemId === highlightId}
                        draggable
                        elapsed={anchorNow && isElapsedOccurrence(occurrence, now)}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
          {anchorNow && (
            <>
              <CalendarPastFill origin={weekStart} days={7} gutter={GUTTER} />
              <CalendarNowLine origin={weekStart} days={7} gutter={GUTTER} />
            </>
          )}
          {preview && !preview.allDay && (
            <TimedGhost preview={preview} origin={weekStart} days={7} gutter={GUTTER} />
          )}
          {!preview && hover && <TimedGhost preview={hover} origin={weekStart} days={7} gutter={GUTTER} />}
        </div>
      </div>
    </div>
  );
}
