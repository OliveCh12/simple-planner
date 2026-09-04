"use client";

import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { CalendarEvent, CalendarOccurrenceList } from "@/components/calendar/CalendarEvent";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { occupiesMonthDay, type CalendarOccurrence } from "@/lib/calendar";
import { cn } from "@/lib/utils";

const WEEKDAY_COUNT = 7;
const MONTH_VISIBLE = 3;

interface CalendarMonthProps {
  focus: Date;
  weekStartsOn: 0 | 1;
  occurrences: CalendarOccurrence[];
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  highlightId?: string | null;
}

function WeekdayHeaders({ weekStartsOn }: { weekStartsOn: 0 | 1 }) {
  const start = startOfWeek(new Date(2027, 8, 13), { weekStartsOn });
  const days = eachDayOfInterval({ start, end: addDays(start, 6) });
  return (
    <div className="grid grid-cols-7 border-b">
      {days.map((day) => (
        <div
          key={day.toISOString()}
          className="px-1 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:px-2"
        >
          <span className="sm:hidden">{format(day, "EEEEE")}</span>
          <span className="hidden sm:inline">{format(day, "EEE")}</span>
        </div>
      ))}
    </div>
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
  const today = new Date();
  const selectedItems = occurrences.filter((occurrence) => occupiesMonthDay(occurrence, selectedDay));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <WeekdayHeaders weekStartsOn={weekStartsOn} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:hidden">
        <div className="grid grid-cols-7 border-b">
          {days.map((day) => {
            const inMonth = isSameMonth(day, monthStart);
            const current = isSameDay(day, today);
            const selected = isSameDay(day, selectedDay);
            const count = occurrences.filter((occurrence) => occupiesMonthDay(occurrence, day)).length;
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelectDay(day)}
                className={cn(
                  "flex flex-col items-center gap-1 border-r border-b py-2 last:border-r-0",
                  !inMonth && "text-muted-foreground",
                  selected && "bg-accent",
                  current && !selected && "bg-primary/5"
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-7 items-center justify-center text-sm tabular-nums",
                    current && "rounded-full bg-primary font-semibold text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
                <span className="flex h-1.5 items-center gap-0.5">
                  {count > 0 && (
                    <span className="size-1.5 rounded-full bg-primary" aria-label={`${count} items`} />
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <p className="mb-2 text-sm font-medium">{format(selectedDay, "EEEE d MMMM")}</p>
          <CalendarOccurrenceList occurrences={selectedItems} highlightId={highlightId} />
        </div>
      </div>

      <div className="hidden min-h-0 flex-1 flex-col overflow-y-auto md:flex">
        {weeks.map((weekDays) => (
          <div key={weekDays[0].toISOString()} className="grid min-h-[7.5rem] flex-1 grid-cols-7 border-b">
            {weekDays.map((day) => {
              const inMonth = isSameMonth(day, monthStart);
              const current = isSameDay(day, today);
              const selected = isSameDay(day, selectedDay);
              const dayItems = occurrences.filter((occurrence) => occupiesMonthDay(occurrence, day));
              const visible = dayItems.slice(0, MONTH_VISIBLE);
              const extra = dayItems.length - visible.length;
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex flex-col border-r px-1 pb-1 last:border-r-0",
                    !inMonth && "bg-muted/30 text-muted-foreground",
                    current && "bg-primary/5",
                    selected && "bg-accent/60"
                  )}
                  onClick={() => onSelectDay(day)}
                >
                  <button
                    type="button"
                    onClick={() => onSelectDay(day)}
                    className="flex items-center justify-start px-0.5 pt-1 text-left"
                  >
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center text-xs tabular-nums",
                        current && "rounded-full bg-primary font-semibold text-primary-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </button>
                  <div className="flex min-h-0 flex-1 flex-col gap-0.5">
                    {visible.map((occurrence) => (
                      <CalendarEvent
                        key={occurrence.id}
                        occurrence={occurrence}
                        highlight={occurrence.itemId === highlightId}
                      />
                    ))}
                    {extra > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="h-5 justify-start px-1 text-[11px] text-muted-foreground"
                            aria-label={`${extra} more on ${format(day, "d MMMM")}`}
                          >
                            +{extra} more
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-72 p-2">
                          <p className="mb-2 px-1 text-sm font-medium">{format(day, "EEEE d MMMM")}</p>
                          <CalendarOccurrenceList occurrences={dayItems} highlightId={highlightId} />
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
