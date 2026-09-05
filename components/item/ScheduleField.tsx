"use client";

import { addDays, addMinutes, differenceInMinutes } from "date-fns";
import { Repeat } from "lucide-react";
import { PropertyRow } from "@/components/item/PropertyRow";
import { PropertyChip } from "@/components/task/PropertyChip";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { RECURRENCE_PRESETS, recurrencePresetId, type RecurrencePresetId } from "@/lib/recurrence-presets";
import {
  formatLocal,
  formatLocalDate,
  isAllDay,
  joinLocal,
  parseLocal,
  splitLocal,
} from "@/lib/time/local";
import { cn } from "@/lib/utils";
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

function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
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
    if (!time) return;
    const nextStart = joinLocal(startParts.date, time);
    if (!end || allDay) {
      onChange(nextStart, end);
      return;
    }
    const nextEnd = formatLocal(addMinutes(parseLocal(nextStart), durationMin ?? 60), false);
    onChange(nextStart, nextEnd);
  };

  const toggleAllDay = (next: boolean) => {
    if (next) {
      onChange(start.slice(0, 10), end?.slice(0, 10));
      return;
    }
    const sameDay = !end || end === start;
    onChange(`${start}T09:00`, end ? `${end.slice(0, 10)}T${sameDay ? "10:00" : "18:00"}` : `${start}T10:00`);
  };

  return (
    <div className="flex flex-col">
      <PropertyRow label="Starts">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <DateInput
            label="Start date"
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
          {!allDay && <TimeInput label="Start time" value={startParts.time} onChange={setStartTime} />}
        </div>
      </PropertyRow>
      <PropertyRow label="Ends">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <DateInput
            label="End date"
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
          {!allDay && (
            <TimeInput
              label="End time"
              value={hasEnd ? endParts.time : ""}
              onChange={(time) => {
                if (!time) return;
                onChange(start, joinLocal(endParts.date || startParts.date, time));
              }}
            />
          )}
          {durationMin !== undefined && (
            <span className="pl-1 text-xs tabular-nums text-muted-foreground">{durationLabel(durationMin)}</span>
          )}
        </div>
      </PropertyRow>
      <PropertyRow label="All day" htmlFor="schedule-all-day">
        <Switch id="schedule-all-day" size="sm" checked={allDay} onCheckedChange={toggleAllDay} />
      </PropertyRow>
      <PropertyRow label="Repeats">
        <RepeatChip
          value={preset}
          onChange={(next) => {
            if (next === "custom") return;
            onRecurrenceChange(RECURRENCE_PRESETS.find((entry) => entry.id === next)?.rrule);
          }}
        />
      </PropertyRow>
    </div>
  );
}

function RepeatChip({
  value,
  onChange,
}: {
  value: RecurrencePresetId;
  onChange: (next: RecurrencePresetId) => void;
}) {
  const current = RECURRENCE_PRESETS.find((entry) => entry.id === value);
  const label = current?.label ?? "Does not repeat";
  const options = RECURRENCE_PRESETS.filter((entry) => entry.id !== "custom" || value === "custom");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PropertyChip aria-label={`Repeats: ${label}`} className={cn("-ml-1.5", value === "none" && "text-muted-foreground")}>
          <Repeat className={cn(value === "none" ? "opacity-60" : "text-foreground")} />
          {label}
        </PropertyChip>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Repeats</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as RecurrencePresetId)}>
          {options.map((entry) => (
            <DropdownMenuRadioItem key={entry.id} value={entry.id} disabled={entry.id === "custom"}>
              {entry.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (time: string) => void;
}) {
  return (
    <Input
      type="time"
      aria-label={label}
      value={value}
      className="h-7 w-[6.25rem] px-2 text-xs tabular-nums shadow-none"
      onChange={(event) => onChange(event.target.value)}
    />
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
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          aria-label={label}
          className="-ml-1.5 h-7 px-1.5 text-[13px] font-normal"
        >
          {value.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
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
  );
}
