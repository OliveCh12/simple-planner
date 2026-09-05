"use client";

import { addDays, addMinutes, differenceInMinutes } from "date-fns";
import { Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RECURRENCE_PRESETS, recurrencePresetId } from "@/lib/recurrence-presets";
import {
  formatLocal,
  formatLocalDate,
  isAllDay,
  joinLocal,
  parseLocal,
  splitLocal,
} from "@/lib/time/local";
import { useUIStore } from "@/store/uiStore";

interface ScheduleFieldProps {
  start: string;
  end?: string;
  recurrence?: string;
  onChange: (start: string, end?: string) => void;
  onRecurrenceChange: (rule?: string) => void;
}

function withDate(original: string, nextDate: Date): string {
  const time = splitLocal(original).time;
  return joinLocal(formatLocalDate(nextDate), time);
}

export function ScheduleField({ start, end, recurrence, onChange, onRecurrenceChange }: ScheduleFieldProps) {
  const weekStartsOn = useUIStore((s) => s.settings.firstDayOfWeek);
  const allDay = isAllDay(start);
  const hasEnd = end !== undefined;
  const startParts = splitLocal(start);
  const endParts = end ? splitLocal(end) : { date: "", time: "" };
  const preset = recurrencePresetId(recurrence);
  const durationMin =
    !allDay && hasEnd ? Math.max(15, differenceInMinutes(parseLocal(end), parseLocal(start))) : undefined;

  const setStartTime = (time: string) => {
    const nextStart = joinLocal(startParts.date, time);
    if (!end || allDay) {
      onChange(nextStart, end);
      return;
    }
    const nextEnd = formatLocal(addMinutes(parseLocal(nextStart), durationMin ?? 60), false);
    onChange(nextStart, nextEnd);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">When</h2>
        <Button
          type="button"
          variant={allDay ? "secondary" : "ghost"}
          size="xs"
          onClick={() => {
            if (allDay) {
              onChange(`${start}T09:00`, end ? `${end.slice(0, 10)}T${start === end ? "10:00" : "18:00"}` : `${start}T10:00`);
              return;
            }
            onChange(start.slice(0, 10), end?.slice(0, 10));
          }}
        >
          All day
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <DateInput
          label="Starts"
          value={parseLocal(start)}
          weekStartsOn={weekStartsOn}
          onChange={(date) => {
            const nextStart = withDate(start, date);
            if (!end) {
              onChange(nextStart);
              return;
            }
            const duration = parseLocal(end).getTime() - parseLocal(start).getTime();
            onChange(nextStart, formatLocal(new Date(parseLocal(nextStart).getTime() + duration), isAllDay(end)));
          }}
        />
        <DateInput
          label="Ends"
          value={end ? parseLocal(end) : parseLocal(start)}
          weekStartsOn={weekStartsOn}
          onChange={(date) => {
            if (!end) {
              onChange(start, withDate(start, date));
              return;
            }
            onChange(start, withDate(end, date));
          }}
        />
      </div>
      {!allDay && (
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-xs text-muted-foreground">
            Start time
            <Input
              type="time"
              aria-label="Start time"
              value={startParts.time}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            End time
            <Input
              type="time"
              aria-label="End time"
              value={hasEnd ? endParts.time : ""}
              onChange={(event) => {
                const time = event.target.value;
                if (!time) return;
                onChange(start, joinLocal(endParts.date || startParts.date, time));
              }}
            />
          </label>
        </div>
      )}
      {durationMin !== undefined && (
        <p className="text-xs text-muted-foreground">
          {durationMin >= 60
            ? `${Math.floor(durationMin / 60)} h${durationMin % 60 ? ` ${durationMin % 60} min` : ""}`
            : `${durationMin} min`}
        </p>
      )}
      <div className="flex flex-wrap gap-1">
        {RECURRENCE_PRESETS.filter((entry) => entry.id !== "custom").map((entry) => (
          <Button
            key={entry.id}
            type="button"
            size="xs"
            variant={preset === entry.id ? "secondary" : "ghost"}
            onClick={() => onRecurrenceChange(entry.rrule)}
          >
            {entry.id === "none" ? null : <Repeat className="size-3" />}
            {entry.label}
          </Button>
        ))}
      </div>
      {preset === "custom" && recurrence && (
        <p className="text-xs text-muted-foreground">Custom repeat</p>
      )}
    </section>
  );
}

function DateInput({
  label,
  value,
  weekStartsOn,
  onChange,
}: {
  label: string;
  value: Date;
  weekStartsOn: 0 | 1;
  onChange: (date: Date) => void;
}) {
  return (
    <label className="space-y-1 text-xs text-muted-foreground">
      {label}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="h-9 w-full justify-start font-normal">
            {value.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-0">
          <Calendar
            mode="single"
            required
            weekStartsOn={weekStartsOn}
            selected={value}
            onSelect={(date) => {
              if (date) onChange(date);
            }}
            className="w-full"
          />
          <div className="flex gap-1 border-t p-2">
            <Button type="button" variant="ghost" size="xs" onClick={() => onChange(new Date())}>
              Today
            </Button>
            <Button type="button" variant="ghost" size="xs" onClick={() => onChange(addDays(new Date(), 1))}>
              Tomorrow
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </label>
  );
}
