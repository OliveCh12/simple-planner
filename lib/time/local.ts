import { add, addDays, addMinutes, format, isValid, type Duration } from "date-fns";
import type { LocalDateTime, Task, TimeScale } from "@/types";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export interface Interval {
  start: Date;
  /** Exclusive. */
  end: Date;
}

export function isAllDay(value: LocalDateTime): boolean {
  return !value.includes("T");
}

export function parseLocal(value: LocalDateTime): Date {
  const timed = DATETIME_RE.exec(value);
  if (timed) {
    const [, y, m, d, h, min] = timed.map(Number);
    return new Date(y, m - 1, d, h, min);
  }
  const dated = DATE_RE.exec(value);
  if (dated) {
    const [, y, m, d] = dated.map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(NaN);
}

export function isValidLocal(value: unknown): value is LocalDateTime {
  if (typeof value !== "string") return false;
  if (!DATE_RE.test(value) && !DATETIME_RE.test(value)) return false;
  const date = parseLocal(value);
  return isValid(date) && formatLocal(date, isAllDay(value)) === value;
}

export function formatLocalDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatLocalDateTime(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function formatLocal(date: Date, allDay: boolean): LocalDateTime {
  return allDay ? formatLocalDate(date) : formatLocalDateTime(date);
}

export function todayLocal(): string {
  return formatLocalDate(new Date());
}

/** Half-open `[start, end)` interval of a task, in local time. */
export function intervalOf(task: Pick<Task, "start" | "end">): Interval {
  const start = parseLocal(task.start);
  const rawEnd = parseLocal(task.end);
  const end = isAllDay(task.end) ? addDays(rawEnd, 1) : rawEnd;
  return { start, end: end > start ? end : addMinutes(start, 1) };
}

export function intersects(a: Interval, b: Interval): boolean {
  return a.start < b.end && a.end > b.start;
}

export function contains(outer: Interval, inner: Interval): boolean {
  return inner.start >= outer.start && inner.end <= outer.end;
}

const UNIT: Record<TimeScale, keyof Duration> = {
  year: "years",
  month: "months",
  week: "weeks",
  day: "days",
  hour: "hours",
};

export function addUnits(date: Date, scale: TimeScale, amount: number): Date {
  return add(date, { [UNIT[scale]]: amount });
}

/** Moves a task by whole units of `scale`, keeping its duration and all-day-ness. */
export function shiftTask<T extends Pick<Task, "start" | "end">>(
  task: T,
  scale: TimeScale,
  delta: number
): T {
  if (delta === 0) return task;
  const allDay = isAllDay(task.start);
  return {
    ...task,
    start: formatLocal(addUnits(parseLocal(task.start), scale, delta), allDay),
    end: formatLocal(addUnits(parseLocal(task.end), scale, delta), allDay),
  };
}
