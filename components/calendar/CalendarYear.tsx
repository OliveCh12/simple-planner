"use client";

import { addDays, addMonths, addYears, eachDayOfInterval, format, isSameDay, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { occupiesMonthDay, type CalendarOccurrence } from "@/lib/calendar";
import { useNowCoarse } from "@/hooks/useNow";
import { containsNow, isElapsedMonth } from "@/lib/time/presence";
import { cn } from "@/lib/utils";

interface CalendarYearProps {
  year: Date;
  weekStartsOn: 0 | 1;
  occurrences: CalendarOccurrence[];
  onFocusMonth: (date: Date) => void;
}

export function CalendarYear({ year, weekStartsOn, occurrences, onFocusMonth }: CalendarYearProps) {
  const months = Array.from({ length: 12 }, (_, index) => addMonths(year, index));
  const now = useNowCoarse();
  const yearStart = startOfYear(year);
  const anchorNow = containsNow({ start: yearStart, end: addYears(yearStart, 1) }, now);

  return (
    <div className="scroll-thin grid min-h-0 flex-1 grid-cols-1 gap-x-8 gap-y-6 overflow-y-auto px-6 py-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {months.map((month) => {
        const monthStart = startOfMonth(month);
        const gridStart = startOfWeek(monthStart, { weekStartsOn });
        const days = eachDayOfInterval({
          start: gridStart,
          end: addDays(gridStart, 41),
        });
        const weekdayLabels = eachDayOfInterval({
          start: gridStart,
          end: addDays(gridStart, 6),
        });
        const currentMonth = anchorNow && now.getMonth() === month.getMonth();
        return (
          <section
            key={month.toISOString()}
            className={cn(anchorNow && isElapsedMonth(month, now) && "opacity-60")}
          >
            <button
              type="button"
              className={cn(
                "mb-1.5 rounded-sm text-left text-sm font-semibold outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring",
                currentMonth && "text-now"
              )}
              onClick={() => onFocusMonth(month)}
            >
              {format(month, "MMMM")}
            </button>
            <div className="grid grid-cols-7 gap-y-0.5">
              {weekdayLabels.map((day) => (
                <div
                  key={`h-${day.toISOString()}`}
                  className="text-center text-[10px] font-medium uppercase text-muted-foreground"
                >
                  {format(day, "EEEEE")}
                </div>
              ))}
              {days.map((day) => {
                const inMonth = day.getMonth() === month.getMonth();
                const current = isSameDay(day, now);
                const hasItems =
                  inMonth && occurrences.some((occurrence) => occupiesMonthDay(occurrence, day));
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={!inMonth}
                    aria-current={current ? "date" : undefined}
                    onClick={() => onFocusMonth(day)}
                    className={cn(
                      "relative mx-auto flex size-7 items-center justify-center rounded-full text-xs tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      !inMonth && "invisible",
                      current && "bg-now font-semibold text-now-foreground",
                      inMonth && !current && "hover:bg-muted"
                    )}
                  >
                    {format(day, "d")}
                    {hasItems && !current && (
                      <span className="absolute bottom-0.5 size-1 rounded-full bg-foreground/45" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
