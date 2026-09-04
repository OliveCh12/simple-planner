import type { TimeScale } from "@/types";
import { formatLocalDate } from "@/lib/time/local";
import { columnsFor, type ScaleOptions, type TimeColumn } from "@/lib/time/scale";

/** Pixel width of a nominal unit. Real units scale with their elapsed duration. */
export const PX_PER_UNIT: Record<TimeScale, number> = {
  year: 96,
  month: 72,
  week: 56,
  day: 48,
  hour: 56,
};

/** Hard cap on canvas `scrollWidth` so hour scale on long plans stays usable. */
export const MAX_SCROLL_WIDTH = 8_000_000;

const DAY_MS = 86_400_000;
const TROPICAL_YEAR_MS = 365.2425 * DAY_MS;

export const NOMINAL_MS: Record<TimeScale, number> = {
  year: TROPICAL_YEAR_MS,
  month: TROPICAL_YEAR_MS / 12,
  week: 7 * DAY_MS,
  day: DAY_MS,
  hour: 3_600_000,
};

export function parentScale(scale: TimeScale): TimeScale | null {
  switch (scale) {
    case "year":
      return null;
    case "month":
      return "year";
    case "week":
      return "month";
    case "day":
      return "month";
    case "hour":
      return "day";
  }
}

export interface TimeLayout {
  scale: TimeScale;
  origin: Date;
  /** Exclusive. */
  end: Date;
  pxPerMs: number;
  /** `PX_PER_UNIT[scale]`, reduced when the canvas would exceed `MAX_SCROLL_WIDTH`. */
  pxPerUnit: number;
  totalWidth: number;
  units: TimeColumn[];
  majorUnits: TimeColumn[];
}

export function layoutFor(
  scale: TimeScale,
  planStart: string,
  planEnd: string,
  options: ScaleOptions
): TimeLayout {
  const units = columnsFor(scale, planStart, planEnd, options);
  if (units.length === 0) {
    return {
      scale,
      origin: new Date(NaN),
      end: new Date(NaN),
      pxPerMs: 0,
      pxPerUnit: PX_PER_UNIT[scale],
      totalWidth: 0,
      units,
      majorUnits: [],
    };
  }

  const origin = units[0].start;
  const end = units[units.length - 1].end;
  const elapsed = end.getTime() - origin.getTime();
  let pxPerMs = PX_PER_UNIT[scale] / NOMINAL_MS[scale];
  let totalWidth = elapsed * pxPerMs;
  if (totalWidth > MAX_SCROLL_WIDTH) {
    pxPerMs *= MAX_SCROLL_WIDTH / totalWidth;
    totalWidth = MAX_SCROLL_WIDTH;
  }

  const parent = parentScale(scale);
  const lastMs = Math.max(origin.getTime(), end.getTime() - 1);
  const majorUnits = parent
    ? columnsFor(parent, formatLocalDate(origin), formatLocalDate(new Date(lastMs)), options)
    : [];

  return {
    scale,
    origin,
    end,
    pxPerMs,
    pxPerUnit: pxPerMs * NOMINAL_MS[scale],
    totalWidth,
    units,
    majorUnits,
  };
}

/** Linear offset of `instant` from `layout.origin`. Not clamped: bars may start off-canvas. */
export function xOf(layout: TimeLayout, instant: Date): number {
  return (instant.getTime() - layout.origin.getTime()) * layout.pxPerMs;
}

/** Instant at canvas `x`, clamped to `[origin, end]`. */
export function instantAt(layout: TimeLayout, x: number): Date | null {
  if (!Number.isFinite(layout.origin.getTime()) || layout.pxPerMs === 0) return null;
  const clamped = Math.min(layout.totalWidth, Math.max(0, x));
  return new Date(layout.origin.getTime() + clamped / layout.pxPerMs);
}
