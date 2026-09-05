"use client";

import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { useCalendarUi } from "@/components/calendar/calendar-ui";
import { CalendarEvent, CalendarOccurrenceList } from "@/components/calendar/CalendarEvent";
import { DayWeather } from "@/components/environment/DayWeather";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { occupiesMonthDay, type CalendarOccurrence } from "@/lib/calendar";
import { useState } from "react";
import { useNowCoarse } from "@/hooks/useNow";
import { useScrollbarGutter } from "@/hooks/useScrollbarGutter";
import { useDailyWeather, useEnvironmentSettings } from "@/hooks/useWeather";
import { formatLocalDate } from "@/lib/time/local";
import { containsNow, isElapsedDay, isElapsedOccurrence } from "@/lib/time/presence";
import { cn } from "@/lib/utils";

const WEEKDAY_COUNT = 7;
const MONTH_VISIBLE = 4;

interface CalendarMonthProps {
  focus: Date;
  weekStartsOn: 0 | 1;
  occurrences: CalendarOccurrence[];
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  highlightId?: string | null;
}

function WeekdayHeaders({ weekStartsOn, gutter }: { weekStartsOn: 0 | 1; gutter: number }) {
  const start = startOfWeek(new Date(2027, 8, 13), { weekStartsOn });
  const days = eachDayOfInterval({ start, end: addDays(start, 6) });
  return (
    <div className="grid grid-cols-7 border-b border-cal-line-strong" style={{ paddingRight: gutter }}>
      {days.map((day) => (
        <div
          key={day.toISOString()}
          className="px-2 py-1.5 text-right text-[11.5px] font-semibold uppercase tracking-wide text-foreground/60"
        >
          <span className="sm:hidden">{format(day, "EEEEE")}</span>
          <span className="hidden sm:inline">{format(day, "EEE")}</span>
        </div>
      ))}
    </div>
  );
}

function DayNumber({ day, current, muted }: { day: Date; current: boolean; muted: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
        current && "bg-now font-semibold text-now-foreground",
        !current && muted && "text-muted-foreground"
      )}
    >
      {format(day, "d")}
    </span>
  );
}

export function CalendarMonth({
  focus,
  weekStartsOn,
  occurrences,
  selectedDay,
  onSelectDay,
  highlightId,
}: CalendarMonthProps) {
  const monthStart = startOfMonth(focus);
  const gridStart = startOfWeek(monthStart, { weekStartsOn });
  const gridLast = endOfWeek(endOfMonth(monthStart), { weekStartsOn });
  const days = eachDayOfInterval({ start: gridStart, end: gridLast });
  const weeks: Date[][] = [];
  for (let index = 0; index < days.length; index += WEEKDAY_COUNT) {
    weeks.push(days.slice(index, index + WEEKDAY_COUNT));
  }
  const now = useNowCoarse();
  const ui = useCalendarUi();
  const [scrollerEl, setScrollerEl] = useState<HTMLDivElement | null>(null);
  const gutter = useScrollbarGutter(scrollerEl);
  const env = useEnvironmentSettings();
  const place = env.location ?? null;
  const { byDate: weather } = useDailyWeather(place, env.weather, env.units);
  const monthRange = { start: monthStart, end: addMonths(monthStart, 1) };
  const anchorNow = containsNow(monthRange, now);
  const canCreate = Boolean(ui?.canCreate && ui.onCreateSlot);
  const selectedItems = occurrences.filter((occurrence) => occupiesMonthDay(occurrence, selectedDay));

  const createOnDay = (day: Date) => {
    const date = formatLocalDate(day);
    ui?.onCreateSlot?.(date, date);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <WeekdayHeaders weekStartsOn={weekStartsOn} gutter={gutter} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:hidden">
        <div className="grid grid-cols-7 border-b border-cal-line-strong">
          {days.map((day) => {
            const inMonth = isSameMonth(day, monthStart);
            const current = isSameDay(day, now);
            const selected = isSameDay(day, selectedDay);
            const elapsed = anchorNow && inMonth && isElapsedDay(day, now);
            const count = occurrences.filter((occurrence) => occupiesMonthDay(occurrence, day)).length;
            return (
              <button
                key={day.toISOString()}
                type="button"
                aria-current={current ? "date" : undefined}
                onClick={() => onSelectDay(day)}
                className={cn(
                  "flex flex-col items-center gap-1 border-r border-b border-cal-line py-2 outline-none last:border-r-0 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  selected && "bg-cal-selected"
                )}
              >
                <DayNumber day={day} current={current} muted={!inMonth || elapsed} />
                <span className="flex h-1.5 items-center gap-0.5">
                  {count > 0 && (
                    <span className="size-1.5 rounded-full bg-foreground/50" aria-label={`${count} items`} />
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-3">
          <p className="mb-2 text-sm font-medium">{format(selectedDay, "EEEE d MMMM")}</p>
          <CalendarOccurrenceList
            occurrences={selectedItems}
            highlightId={highlightId}
            now={anchorNow ? now : undefined}
          />
          {canCreate && (
            <button
              type="button"
              className="mt-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => createOnDay(selectedDay)}
            >
              Add event
            </button>
          )}
        </div>
      </div>

      <div ref={setScrollerEl} className="scroll-thin hidden min-h-0 flex-1 flex-col overflow-y-auto md:flex">
        {weeks.map((weekDays, weekIndex) => (
          <div
            key={weekDays[0].toISOString()}
            className={cn(
              "grid min-h-[7.5rem] flex-1 grid-cols-7",
              weekIndex < weeks.length - 1 && "border-b border-cal-line"
            )}
          >
            {weekDays.map((day) => {
              const inMonth = isSameMonth(day, monthStart);
              const current = isSameDay(day, now);
              const selected = isSameDay(day, selectedDay);
              const elapsed = anchorNow && inMonth && isElapsedDay(day, now);
              const dayItems = occurrences.filter((occurrence) => occupiesMonthDay(occurrence, day));
              const visible = dayItems.slice(0, MONTH_VISIBLE);
              const extra = dayItems.length - visible.length;
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex min-w-0 flex-col border-r border-cal-line px-1 pb-1 last:border-r-0",
                    !inMonth && "text-muted-foreground",
                    current && "bg-cal-today",
                    selected && !current && "bg-cal-selected"
                  )}
                  onClick={() => {
                    onSelectDay(day);
                    if (canCreate) createOnDay(day);
                  }}
                >
                  <div className="@container flex items-center justify-between gap-1 overflow-hidden px-0.5 pt-1">
                    {env.weather && place ? (
                      <DayWeather
                        day={weather.get(formatLocalDate(day))}
                        dateKey={formatLocalDate(day)}
                        units={env.units}
                        detail={env.detail}
                        timeZone={place.timezone}
                        className="min-w-0 pl-0.5"
                        responsive
                      />
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      aria-current={current ? "date" : undefined}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectDay(day);
                      }}
                      className="flex justify-end outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <DayNumber day={day} current={current} muted={!inMonth || elapsed} />
                    </button>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col gap-px pt-0.5">
                    {visible.map((occurrence) => (
                      <CalendarEvent
                        key={occurrence.id}
                        occurrence={occurrence}
                        variant={occurrence.allDay ? "chip" : "dot"}
                        highlight={occurrence.itemId === highlightId}
                        elapsed={anchorNow && isElapsedOccurrence(occurrence, now)}
                      />
                    ))}
                    {extra > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="w-fit rounded-sm px-1.5 py-0.5 text-[11px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`${extra} more on ${format(day, "d MMMM")}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            {extra} more
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-72 p-2">
                          <p className="mb-2 px-1 text-sm font-medium">{format(day, "EEEE d MMMM")}</p>
                          <CalendarOccurrenceList
                            occurrences={dayItems}
                            highlightId={highlightId}
                            now={anchorNow ? now : undefined}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
