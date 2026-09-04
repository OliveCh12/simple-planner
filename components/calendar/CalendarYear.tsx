"use client";

import { addDays, addMonths, eachDayOfInterval, format, isSameDay, startOfMonth, startOfWeek } from "date-fns";
import { occupiesMonthDay, type CalendarOccurrence } from "@/lib/calendar";
import { cn } from "@/lib/utils";

interface CalendarYearProps {
  year: Date;
  weekStartsOn: 0 | 1;
  occurrences: CalendarOccurrence[];
  onFocusMonth: (date: Date) => void;
}

export function CalendarYear({ year, weekStartsOn, occurrences, onFocusMonth }: CalendarYearProps) {
  const months = Array.from({ length: 12 }, (_, index) => addMonths(year, index));
  const today = new Date();

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        return (
          <section key={month.toISOString()} className="rounded-xl border bg-card p-3">
            <button
              type="button"
              className="mb-2 text-left text-sm font-semibold hover:text-primary"
              onClick={() => onFocusMonth(month)}
            >
              {format(month, "MMMM")}
            </button>
            <div className="grid grid-cols-7 gap-y-1">
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
                const current = isSameDay(day, today);
                const hasItems =
                  inMonth && occurrences.some((occurrence) => occupiesMonthDay(occurrence, day));
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={!inMonth}
                    onClick={() => onFocusMonth(day)}
                    className={cn(
                      "relative mx-auto flex size-7 items-center justify-center rounded-full text-xs tabular-nums",
                      !inMonth && "invisible",
                      current && "bg-primary font-semibold text-primary-foreground",
                      inMonth && !current && "hover:bg-muted"
                    )}
                  >
                    {format(day, "d")}
                    {hasItems && !current && (
                      <span className="absolute bottom-0.5 size-1 rounded-full bg-primary" />
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
