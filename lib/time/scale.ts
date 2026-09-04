import {
  differenceInCalendarDays,
  endOfDay,
  startOfDay,
  startOfHour,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import type { TimeScale } from "@/types";
import { addUnits, parseLocal } from "@/lib/time/local";

export const SCALES: readonly TimeScale[] = ["year", "month", "week", "day", "hour"];
export const CALENDAR_SCALES: readonly TimeScale[] = ["year", "month", "week", "day"];

export interface TimeColumn {
  key: string;
  scale: TimeScale;
  index: number;
  start: Date;
  /** Exclusive. */
  end: Date;
}

export interface ScaleOptions {
  weekStartsOn: 0 | 1;
}

export function startOfUnit(date: Date, scale: TimeScale, options: ScaleOptions): Date {
  switch (scale) {
    case "year":
      return startOfYear(date);
    case "month":
      return startOfMonth(date);
    case "week":
      return startOfWeek(date, { weekStartsOn: options.weekStartsOn });
    case "day":
      return startOfDay(date);
    case "hour":
      return startOfHour(date);
  }
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function columnKey(scale: TimeScale, start: Date): string {
  return `${scale}:${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T${pad(start.getHours())}`;
}

/** Whole units of `scale` covering the inclusive `[planStart, planEnd]` date range. */
export function columnsFor(
  scale: TimeScale,
  planStart: string,
  planEnd: string,
  options: ScaleOptions
): TimeColumn[] {
  const first = startOfUnit(parseLocal(planStart), scale, options);
  const last = startOfUnit(endOfDay(parseLocal(planEnd)), scale, options);
  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) return [];

  const columns: TimeColumn[] = [];
  let cursor = first;
  while (cursor <= last) {
    const end = addUnits(cursor, scale, 1);
    columns.push({ key: columnKey(scale, cursor), scale, index: columns.length, start: cursor, end });
    cursor = end;
  }
  return columns;
}

/** Index of the column containing `instant`, or -1 when outside every column. */
export function columnIndexContaining(columns: TimeColumn[], instant: Date): number {
  let low = 0;
  let high = columns.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const column = columns[mid];
    if (instant < column.start) high = mid - 1;
    else if (instant >= column.end) low = mid + 1;
    else return mid;
  }
  return -1;
}

/** Like `columnIndexContaining`, but clamps to the nearest edge column. */
export function nearestColumnIndex(columns: TimeColumn[], instant: Date): number {
  if (columns.length === 0) return -1;
  if (instant < columns[0].start) return 0;
  const last = columns.length - 1;
  if (instant >= columns[last].end) return last;
  return columnIndexContaining(columns, instant);
}

export function defaultScaleFor(planStart: string, planEnd: string): TimeScale {
  const days = differenceInCalendarDays(parseLocal(planEnd), parseLocal(planStart)) + 1;
  if (days <= 2) return "hour";
  if (days <= 42) return "day";
  if (days <= 183) return "week";
  if (days <= 1096) return "month";
  return "year";
}

export function zoomIn(scale: TimeScale): TimeScale | null {
  const index = SCALES.indexOf(scale);
  return index < SCALES.length - 1 ? SCALES[index + 1] : null;
}

export function zoomOut(scale: TimeScale): TimeScale | null {
  const index = SCALES.indexOf(scale);
  return index > 0 ? SCALES[index - 1] : null;
}
