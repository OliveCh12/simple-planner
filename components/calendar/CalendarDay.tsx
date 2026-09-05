"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Sunrise } from "lucide-react";
import { addDays, isSameDay } from "date-fns";
import { useCalendarUi } from "@/components/calendar/calendar-ui";
import { CalendarEvent } from "@/components/calendar/CalendarEvent";
import { TimedGhost } from "@/components/calendar/CalendarGhost";
import { CalendarNowLine, CalendarPastFill } from "@/components/calendar/CalendarNowLine";
import { DayWeather, sunSummary } from "@/components/environment/DayWeather";
import { DaylightLayer } from "@/components/environment/DaylightLayer";
import { HOUR_PX, HourGutter, initialScrollTop } from "@/components/calendar/CalendarWeek";
import { occurrenceInterval, packInRange, timedLabel, type CalendarOccurrence } from "@/lib/calendar";
import { useCalendarPointer } from "@/hooks/useCalendarPointer";
import { useUIStore } from "@/store/uiStore";
import { useNowCoarse } from "@/hooks/useNow";
import { useDailyWeather, useEnvironmentSettings } from "@/hooks/useWeather";
import { sunTimesCached } from "@/lib/environment/sun";
import { useScrollbarGutter } from "@/hooks/useScrollbarGutter";
import { formatLocalDate, formatLocalDateTime, parseLocal } from "@/lib/time/local";
import { containsNow, isElapsedOccurrence } from "@/lib/time/presence";
import { cn } from "@/lib/utils";

const GUTTER = "3.25rem";
const GUTTER_PX = 52;

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
  const anchorNow = containsNow(range, now);
  const today = isSameDay(start, now);
  const env = useEnvironmentSettings();
  const place = env.location ?? null;
  const { byDate: weather } = useDailyWeather(place, env.weather, env.units);
  const showDaylight = env.daylight && place !== null;
  const dateKey = formatLocalDate(start);
  const dayWeather = env.weather ? weather.get(dateKey) : undefined;
  const sun = showDaylight && place
    ? sunTimesCached(place.lat, place.lon, { year: start.getFullYear(), month: start.getMonth() + 1, day: start.getDate() })
    : undefined;
  const sunText = sunSummary(sun, place?.timezone);
  const onMoveItem = ui?.onMoveItem;
  const onCommit = useCallback(
    (commit: Parameters<NonNullable<typeof onMoveItem>>[0]) => {
      onMoveItem?.(commit);
    },
    [onMoveItem]
  );
  const onCreate = ui?.canCreate ? ui.onCreateSlot : undefined;
  const hoverPreview = useUIStore((s) => s.settings.hoverPreview);
  const placing = ui?.placing ?? null;
  const pointerOptions = useMemo(
    () => ({ hoverPreview: hoverPreview || Boolean(placing), hoverTitle: placing?.title }),
    [hoverPreview, placing]
  );
  const { preview, hover } = useCalendarPointer(gridEl, onCommit, onCreate, pointerOptions);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const highlighted = highlightId
      ? occurrences.find((occurrence) => occurrence.itemId === highlightId && !occurrence.allDay)
      : undefined;
    if (highlighted) {
      scroller.scrollTo({ top: Math.max(0, (parseLocal(highlighted.start).getHours() - 1) * HOUR_PX), behavior: "smooth" });
      return;
    }
    if (scroller.dataset.settled) return;
    scroller.dataset.settled = "true";
    const dayStart = new Date(focus.getFullYear(), focus.getMonth(), focus.getDate());
    scroller.scrollTop = initialScrollTop({ start: dayStart, end: addDays(dayStart, 1) });
  }, [focus, highlightId, occurrences, scrollerEl]);

  const columns = `${GUTTER} minmax(0, 1fr)`;

  return (
    <div
      ref={setGridEl}
      data-cal-grid="day"
      data-cal-origin={formatLocalDate(start)}
      data-cal-days="1"
      data-cal-gutter={GUTTER_PX}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      {(dayWeather || sunText) && (
        <div className="flex h-7 shrink-0 items-center justify-end gap-3 border-b border-cal-line px-3 text-[11px] text-muted-foreground">
          {dayWeather && place && (
            <DayWeather day={dayWeather} dateKey={dateKey} units={env.units} detail="full" wide sun={sun} timeZone={place.timezone} />
          )}
          {sunText && (
            <span className="inline-flex items-center gap-1">
              <Sunrise className="size-3" aria-hidden />
              {sunText}
            </span>
          )}
        </div>
      )}
      <div
        data-cal-allday
        className="grid shrink-0 border-b border-cal-line-strong"
        style={{ gridTemplateColumns: columns, paddingRight: scrollbar }}
      >
        <p className="self-center pr-2 text-right text-[10.5px] font-semibold uppercase tracking-wider text-foreground/55">
          All day
        </p>
        <div className={cn("flex min-h-8 flex-wrap gap-1 border-l border-cal-line px-1 py-1", today && "bg-cal-today")}>
          {allDay.length === 0 && (
            <p className="self-center px-1 text-[11px] text-muted-foreground/80">Nothing all day</p>
          )}
          {allDay.map((occurrence) => (
            <div key={occurrence.id} data-cal-slot className="max-w-xs min-w-32 flex-1">
              <CalendarEvent
                occurrence={occurrence}
                highlight={occurrence.itemId === highlightId}
                draggable
                elapsed={anchorNow && isElapsedOccurrence(occurrence, now)}
              />
            </div>
          ))}
        </div>
      </div>
      <div ref={attachScroller} data-cal-timed className="scroll-thin relative min-h-0 flex-1 overflow-y-auto">
        <div
          data-cal-columns
          className="relative grid"
          style={{ gridTemplateColumns: columns, height: 24 * HOUR_PX }}
        >
          <HourGutter />
          <div className={cn("relative border-l border-cal-line", today && "bg-cal-today")}>
            {showDaylight && place && <DaylightLayer place={place} day={start} />}
            {Array.from({ length: 24 }, (_, hour) => (
              <button
                key={hour}
                type="button"
                aria-label={`${String(hour).padStart(2, "0")}:00`}
                className={cn(
                  "block w-full border-b border-cal-line text-left outline-none last:border-b-0 hover:bg-foreground/[0.03] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  selectedHour === hour && "bg-cal-selected"
                )}
                style={{ height: HOUR_PX }}
                onClick={() => onSelectHour(hour)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  if (!ui?.canCreate || !ui.onCreateSlot) return;
                  event.preventDefault();
                  onSelectHour(hour);
                  const from = new Date(start.getFullYear(), start.getMonth(), start.getDate(), hour);
                  ui.onCreateSlot(
                    formatLocalDateTime(from),
                    formatLocalDateTime(new Date(from.getTime() + 60 * 60 * 1000))
                  );
                }}
              />
            ))}
            <div className="pointer-events-none absolute inset-y-0 right-2 left-0">
              {packed.spans.map((span) => {
                const occurrence = byId.get(span.id);
                if (!occurrence) return null;
                const colWidth = 100 / laneCount;
                const slotHeight = Math.max(20, (span.endFrac - span.startFrac) * 24 * HOUR_PX);
                return (
                  <div
                    key={span.id}
                    data-cal-slot
                    className="pointer-events-auto absolute px-0.5 py-px"
                    style={{
                      top: span.startFrac * 24 * HOUR_PX,
                      height: slotHeight,
                      left: `${span.lane * colWidth}%`,
                      width: `${colWidth}%`,
                    }}
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
          </div>
          {anchorNow && (
            <>
              <CalendarPastFill origin={start} days={1} gutter={GUTTER} />
              <CalendarNowLine origin={start} days={1} gutter={GUTTER} />
            </>
          )}
          {preview && !preview.allDay && (
            <TimedGhost preview={preview} origin={start} days={1} gutter={GUTTER} />
          )}
          {!preview && hover && <TimedGhost preview={hover} origin={start} days={1} gutter={GUTTER} />}
        </div>
      </div>
    </div>
  );
}
