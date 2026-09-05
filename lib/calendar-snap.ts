import { addDays, addMinutes, differenceInCalendarDays } from "date-fns";
import { formatLocal, formatLocalDate, formatLocalDateTime, isAllDay, parseLocal } from "@/lib/time/local";

export const SNAP_MINUTES = 15;
export const MIN_TIMED_MINUTES = 15;
export const DEFAULT_TIMED_MINUTES = 60;
export const HOUR_PX = 48;

export type CalendarZone = "allDay" | "timed";

export interface GridHit {
  zone: CalendarZone;
  day: Date;
  minutes: number;
}

export function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function snapMinutes(total: number): number {
  const snapped = Math.round(total / SNAP_MINUTES) * SNAP_MINUTES;
  return Math.min(24 * 60 - SNAP_MINUTES, Math.max(0, snapped));
}

export function minutesOf(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function atMinutes(day: Date, minutes: number): Date {
  const snapped = snapMinutes(minutes);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(snapped / 60), snapped % 60);
}

export function durationMs(start: string, end?: string): number {
  const from = parseLocal(start).getTime();
  if (!end) return isAllDay(start) ? 24 * 60 * 60 * 1000 : MIN_TIMED_MINUTES * 60 * 1000;
  const to = parseLocal(end).getTime();
  if (isAllDay(start) && isAllDay(end)) {
    return Math.max(1, differenceInCalendarDays(addDays(parseLocal(end), 1), parseLocal(start))) * 24 * 60 * 60 * 1000;
  }
  return Math.max(MIN_TIMED_MINUTES * 60 * 1000, to - from);
}

export function shiftToDay(start: string, end: string | undefined, day: Date, minutes?: number): { start: string; end?: string } {
  const allDay = minutes === undefined;
  const duration = durationMs(start, end);
  if (allDay) {
    const days = Math.max(1, Math.round(duration / (24 * 60 * 60 * 1000)));
    const nextStart = formatLocalDate(day);
    const nextEnd = days <= 1 ? nextStart : formatLocalDate(addDays(day, days - 1));
    return { start: nextStart, end: nextEnd };
  }
  const nextStartDate = atMinutes(day, minutes);
  const nextStart = formatLocalDateTime(nextStartDate);
  const nextEnd = formatLocalDateTime(new Date(nextStartDate.getTime() + duration));
  return { start: nextStart, end: nextEnd };
}

export function resizeTimed(
  start: string,
  end: string | undefined,
  edge: "start" | "end",
  day: Date,
  minutes: number
): { start: string; end: string } {
  const currentEnd = end ?? start;
  const snapped = atMinutes(day, minutes);
  if (edge === "start") {
    const limit = addMinutes(parseLocal(currentEnd), -MIN_TIMED_MINUTES);
    const next = snapped > limit ? limit : snapped;
    return { start: formatLocal(next, false), end: currentEnd.includes("T") ? currentEnd : formatLocalDateTime(parseLocal(currentEnd)) };
  }
  const limit = addMinutes(parseLocal(start), MIN_TIMED_MINUTES);
  const next = snapped < limit ? limit : snapped;
  return { start, end: formatLocal(next, false) };
}

export function resizeAllDay(
  start: string,
  end: string | undefined,
  edge: "start" | "end",
  day: Date
): { start: string; end: string } {
  const startDay = parseLocal(start.slice(0, 10));
  const endDay = parseLocal((end ?? start).slice(0, 10));
  if (edge === "start") {
    const nextStart = day > endDay ? endDay : day;
    return { start: formatLocalDate(nextStart), end: formatLocalDate(endDay) };
  }
  const nextEnd = day < startDay ? startDay : day;
  return { start: formatLocalDate(startDay), end: formatLocalDate(nextEnd) };
}

export function nowLineOffset(now: Date, hourPx = HOUR_PX): number {
  return (minutesOf(now) / 60) * hourPx;
}

export function slotFromClick(hit: GridHit): { start: string; end: string } {
  if (hit.zone === "allDay") {
    const day = formatLocalDate(hit.day);
    return { start: day, end: day };
  }
  const start = atMinutes(hit.day, hit.minutes);
  return {
    start: formatLocalDateTime(start),
    end: formatLocalDateTime(addMinutes(start, DEFAULT_TIMED_MINUTES)),
  };
}

export function slotFromDrag(from: GridHit, to: GridHit): { start: string; end: string } {
  if (from.zone === "allDay") {
    const startDay = from.day <= to.day ? from.day : to.day;
    const endDay = from.day <= to.day ? to.day : from.day;
    return { start: formatLocalDate(startDay), end: formatLocalDate(endDay) };
  }
  const a = atMinutes(from.day, from.minutes);
  const b = atMinutes(to.day, to.minutes);
  const start = a <= b ? a : b;
  let end = a <= b ? b : a;
  if (end.getTime() - start.getTime() < MIN_TIMED_MINUTES * 60 * 1000) {
    end = addMinutes(start, MIN_TIMED_MINUTES);
  }
  return { start: formatLocalDateTime(start), end: formatLocalDateTime(end) };
}

export function scheduleLabel(start: string, end?: string): string {
  const from = parseLocal(start);
  if (isAllDay(start)) {
    if (!end || end.slice(0, 10) === start.slice(0, 10)) {
      return from.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    }
    const to = parseLocal(end);
    return `${from.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${to.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }
  const startText = `${pad2(from.getHours())}:${pad2(from.getMinutes())}`;
  if (!end) return startText;
  const to = parseLocal(end);
  return `${startText}–${pad2(to.getHours())}:${pad2(to.getMinutes())}`;
}
