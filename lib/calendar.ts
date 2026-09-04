import type { Interval } from "@/lib/time/local";

export interface PackedSpan {
  id: string;
  lane: number;
  /** 0–1 within the range. */
  startFrac: number;
  /** 0–1 within the range, exclusive. */
  endFrac: number;
}

export interface PackedRange {
  spans: PackedSpan[];
  laneCount: number;
}

const MIN_FRAC = 0.02;

/**
 * Packs intervals that intersect `[range.start, range.end)` into lanes,
 * with positions as fractions of the range. Used by the calendar views.
 */
export function packInRange(
  items: { id: string; interval: Interval }[],
  range: Interval
): PackedRange {
  const spanMs = range.end.getTime() - range.start.getTime();
  if (spanMs <= 0) return { spans: [], laneCount: 0 };

  const clipped: PackedSpan[] = [];
  for (const item of items) {
    const start = Math.max(item.interval.start.getTime(), range.start.getTime());
    const end = Math.min(item.interval.end.getTime(), range.end.getTime());
    if (end <= start) continue;
    const startFrac = (start - range.start.getTime()) / spanMs;
    const endFrac = Math.max(startFrac + MIN_FRAC, (end - range.start.getTime()) / spanMs);
    clipped.push({
      id: item.id,
      lane: 0,
      startFrac,
      endFrac: Math.min(1, endFrac),
    });
  }

  clipped.sort((a, b) => {
    const byStart = a.startFrac - b.startFrac;
    if (byStart !== 0) return byStart;
    const byDur = b.endFrac - b.startFrac - (a.endFrac - a.startFrac);
    if (byDur !== 0) return byDur;
    return a.id.localeCompare(b.id);
  });

  const laneEnds: number[] = [];
  for (const span of clipped) {
    let lane = laneEnds.findIndex((end) => end <= span.startFrac + 1e-9);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(span.endFrac);
    } else {
      laneEnds[lane] = span.endFrac;
    }
    span.lane = lane;
  }

  return { spans: clipped, laneCount: laneEnds.length };
}
