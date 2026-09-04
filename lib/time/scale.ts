import {
  differenceInCalendarDays,
  endOfDay,
  format,
  startOfDay,
  startOfHour,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import type { TimeScale } from "@/types";
import { addUnits, parseLocal } from "@/lib/time/local";

export const SCALES: readonly TimeScale[] = ["year", "month", "week", "day", "hour"];

export const COLUMN_GAP = 12;

export const COLUMN_WIDTH: Record<TimeScale, number> = {
  year: 320,
  month: 300,
  week: 280,
  day: 240,
  hour: 160,
};

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

export function columnKey(scale: TimeScale, start: Date): string {
  return `${scale}:${format(start, "yyyy-MM-dd'T'HH")}`;
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

/** Horizontal offset of `instant` on a board whose columns all have `width`. */
export function xOfInstant(columns: TimeColumn[], instant: Date, width: number): number {
  const index = nearestColumnIndex(columns, instant);
  if (index < 0) return 0;
  const column = columns[index];
  const span = column.end.getTime() - column.start.getTime();
  const fraction = Math.min(1, Math.max(0, (instant.getTime() - column.start.getTime()) / span));
  return (index + fraction) * width;
}

export function instantAtX(columns: TimeColumn[], x: number, width: number): Date | null {
  if (columns.length === 0) return null;
  const position = Math.max(0, Math.min(columns.length, x / width));
  const index = Math.min(columns.length - 1, Math.floor(position));
  const column = columns[index];
  const fraction = position - index;
  const span = column.end.getTime() - column.start.getTime();
  return new Date(column.start.getTime() + fraction * span);
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
