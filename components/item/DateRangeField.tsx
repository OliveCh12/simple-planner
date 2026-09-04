"use client";

import { addDays, startOfDay } from "date-fns";
import { CalendarRange, Clock } from "lucide-react";
import { PropertyChip } from "@/components/task/PropertyChip";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { itemDatesLabel } from "@/lib/time/labels";
import {
  formatLocal,
  formatLocalDate,
  isAllDay,
  joinLocal,
  parseLocal,
  splitLocal,
} from "@/lib/time/local";
import { useUIStore } from "@/store/uiStore";

interface DateRangeFieldProps {
  start: string;
  end?: string;
  onChange: (start: string, end?: string) => void;
  id?: string;
}

function withDate(original: string, nextDate: Date): string {
  const time = splitLocal(original).time;
  return joinLocal(formatLocalDate(nextDate), time);
}

function ordered(start: string, end: string): [string, string] {
  return start <= end ? [start, end] : [end, start];
}

export function DateRangeField({ start, end, onChange, id }: DateRangeFieldProps) {
  const weekStartsOn = useUIStore((s) => s.settings.firstDayOfWeek);
  const allDay = isAllDay(start);
  const hasEnd = end !== undefined;
  const label = itemDatesLabel({ start, end });
  const startParts = splitLocal(start);
  const endParts = end ? splitLocal(end) : { date: "", time: "" };

  const applyStartDate = (date: Date) => {
    const nextStart = withDate(start, date);
    if (!end) {
      onChange(nextStart);
      return;
    }
    const duration = parseLocal(end).getTime() - parseLocal(start).getTime();
    const nextEnd = new Date(parseLocal(nextStart).getTime() + duration);
    onChange(nextStart, formatLocal(nextEnd, isAllDay(end)));
  };

  const setTime = (which: "start" | "end", time: string) => {
    if (which === "start") {
      onChange(joinLocal(startParts.date, time), end ? joinLocal(endParts.date, endParts.time || time) : undefined);
      return;
    }
    if (!end) return;
    onChange(start, joinLocal(endParts.date, time));
  };

  const today = startOfDay(new Date());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <PropertyChip id={id} aria-label={`Date: ${label}`}>
          <CalendarRange className="text-muted-foreground" />
          {label}
        </PropertyChip>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <div className="flex flex-wrap gap-1">
          <Button type="button" variant="ghost" size="xs" onClick={() => applyStartDate(today)}>
            Today
          </Button>
          <Button type="button" variant="ghost" size="xs" onClick={() => applyStartDate(addDays(today, 1))}>
            Tomorrow
          </Button>
          <Button type="button" variant="ghost" size="xs" onClick={() => applyStartDate(addDays(today, 7))}>
            Next week
          </Button>
        </div>
        {hasEnd ? (
          <Calendar
            mode="range"
            required
            weekStartsOn={weekStartsOn}
            selected={{ from: parseLocal(start), to: parseLocal(end) }}
            onSelect={(range) => {
              if (!range?.from) return;
              const nextStart = withDate(start, range.from);
              const nextEnd = withDate(end, range.to ?? range.from);
              onChange(...ordered(nextStart, nextEnd));
            }}
          />
        ) : (
          <Calendar
            mode="single"
            required
            weekStartsOn={weekStartsOn}
            selected={parseLocal(start)}
            onSelect={(date) => {
              if (date) onChange(withDate(start, date));
            }}
          />
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {hasEnd ? (
            <Button type="button" variant="ghost" size="xs" onClick={() => onChange(start)}>
              Remove end
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="xs" onClick={() => onChange(start, start)}>
              Add end
            </Button>
          )}
          {allDay ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() =>
                onChange(
                  `${start}T09:00`,
                  end ? `${end}T${start === end ? "10:00" : "18:00"}` : undefined
                )
              }
            >
              <Clock />
              Add time
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onChange(start.slice(0, 10), end?.slice(0, 10))}
            >
              All day
            </Button>
          )}
        </div>
        {!allDay && (
          <div className="mt-2 flex items-center gap-2">
            <Input
              type="time"
              aria-label="Start time"
              value={startParts.time}
              onChange={(event) => setTime("start", event.target.value)}
              className="h-8 w-auto"
            />
            {hasEnd ? (
              <>
                <span className="text-muted-foreground">–</span>
                <Input
                  type="time"
                  aria-label="End time"
                  value={endParts.time}
                  onChange={(event) => setTime("end", event.target.value)}
                  className="h-8 w-auto"
                />
              </>
            ) : null}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
