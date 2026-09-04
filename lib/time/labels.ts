import { format, getISOWeek, getWeek, isSameDay, isSameMonth, isSameYear, subMilliseconds } from "date-fns";
import type { Task, TimeScale } from "@/types";
import { isAllDay, parseLocal } from "@/lib/time/local";
import type { TimeColumn } from "@/lib/time/scale";

export interface ColumnLabel {
  eyebrow?: string;
  title: string;
}

export interface LabelOptions {
  weekStartsOn: 0 | 1;
  showWeekNumbers: boolean;
}

export function columnLabel(column: TimeColumn, options: LabelOptions): ColumnLabel {
  const { start, scale } = column;
  const last = subMilliseconds(column.end, 1);

  switch (scale) {
    case "year":
      return { title: format(start, "yyyy") };
    case "month":
      return { eyebrow: format(start, "yyyy"), title: format(start, "MMMM") };
    case "week": {
      const week =
        options.weekStartsOn === 1 ? getISOWeek(start) : getWeek(start, { weekStartsOn: 0 });
      const year = format(start, "yyyy");
      return {
        eyebrow: options.showWeekNumbers ? `W${week} · ${year}` : year,
        title: isSameMonth(start, last)
          ? `${format(start, "d")} – ${format(last, "d MMM")}`
          : `${format(start, "d MMM")} – ${format(last, "d MMM")}`,
      };
    }
    case "day":
      return { eyebrow: format(start, "MMM yyyy"), title: format(start, "EEE d") };
    case "hour":
      return { eyebrow: format(start, "EEE d MMM"), title: format(start, "HH:mm") };
  }
}

function dayRange(start: Date, end: Date): string {
  if (isSameDay(start, end)) return format(start, "d");
  if (isSameMonth(start, end)) return `${format(start, "d")}–${format(end, "d")}`;
  return `${format(start, "d MMM")} – ${format(end, "d MMM")}`;
}

function monthDayRange(start: Date, end: Date): string {
  if (isSameDay(start, end)) return format(start, "MMM d");
  if (isSameMonth(start, end)) return `${format(start, "MMM d")}–${format(end, "d")}`;
  return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
}

/** True when `end` falls on the same day, counting the next midnight as this day. */
function endsSameDay(start: Date, end: Date): boolean {
  return isSameDay(start, end) || (end > start && isSameDay(start, subMilliseconds(end, 1)));
}

function timeRange(start: Date, end: Date): string {
  return `${format(start, "HH:mm")}–${format(end, "HH:mm")}`;
}

/** Short date range, used when a task is not contained in the column it is shown in. */
export function shortDateRange(start: Date, end: Date): string {
  if (isSameYear(start, end)) return monthDayRange(start, end);
  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}

/** Full label of a task's dates, with times when it has them. */
export function taskDatesLabel(task: Pick<Task, "start" | "end">): string {
  const start = parseLocal(task.start);
  const end = parseLocal(task.end);
  if (isAllDay(task.start)) return shortDateRange(start, end);
  if (endsSameDay(start, end)) return `${format(start, "MMM d")} · ${timeRange(start, end)}`;
  return `${format(start, "MMM d HH:mm")} – ${format(end, "MMM d HH:mm")}`;
}

function dayLabel(date: Date, withYear: boolean): string {
  return format(date, withYear ? "MMM d, yyyy" : "MMM d");
}

/**
 * Readable date for a property field. Year is included when it is not the current
 * year, or when a range crosses a year boundary.
 */
export function itemDatesLabel(
  item: { start: string; end?: string },
  now: Date = new Date()
): string {
  const start = parseLocal(item.start);
  const end = item.end ? parseLocal(item.end) : undefined;
  const allDay = isAllDay(item.start);
  const sameDay = !end || endsSameDay(start, end);
  const yearNeeded =
    start.getFullYear() !== now.getFullYear() ||
    (end !== undefined && end.getFullYear() !== now.getFullYear());

  if (sameDay) {
    const day = dayLabel(start, yearNeeded);
    if (allDay) return day;
    if (!end) return `${day} · ${format(start, "HH:mm")}`;
    return `${day} · ${timeRange(start, end)}`;
  }

  if (allDay && end) {
    if (isSameMonth(start, end) && isSameYear(start, end)) {
      return yearNeeded
        ? `${format(start, "MMM d")}–${format(end, "d, yyyy")}`
        : `${format(start, "MMM d")}–${format(end, "d")}`;
    }
    if (isSameYear(start, end)) {
      return yearNeeded
        ? `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
        : `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
    }
    return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
  }

  if (end) {
    const startFmt = format(start, yearNeeded ? "MMM d, yyyy HH:mm" : "MMM d HH:mm");
    const endFmt = format(end, yearNeeded ? "MMM d, yyyy HH:mm" : "MMM d HH:mm");
    return `${startFmt} – ${endFmt}`;
  }

  return dayLabel(start, yearNeeded);
}

/**
 * Compact range shown next to a task title. `contained` says whether the task
 * fits entirely in the column it is rendered in; null means "nothing to add".
 */
export function taskRangeLabel(
  task: Pick<Task, "start" | "end">,
  scale: TimeScale,
  contained: boolean
): string | null {
  const start = parseLocal(task.start);
  const end = parseLocal(task.end);
  const allDay = isAllDay(task.start);

  if (!contained) {
    if (!allDay && endsSameDay(start, end)) return timeRange(start, end);
    return shortDateRange(start, end);
  }

  switch (scale) {
    case "year":
      return monthDayRange(start, end);
    case "month":
    case "week":
      return dayRange(start, end);
    case "day":
    case "hour":
      return allDay ? null : timeRange(start, end);
  }
}
