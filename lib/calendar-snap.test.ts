import { describe, expect, it } from "vitest";
import {
  nowLineOffset,
  resizeTimed,
  shiftToDay,
  slotFromClick,
  slotFromDrag,
  snapMinutes,
  HOUR_PX,
} from "@/lib/calendar-snap";

describe("snapMinutes", () => {
  it("snaps to 15-minute steps", () => {
    expect(snapMinutes(7)).toBe(0);
    expect(snapMinutes(8)).toBe(15);
    expect(snapMinutes(22)).toBe(15);
    expect(snapMinutes(1439)).toBe(24 * 60 - 15);
  });
});

describe("shiftToDay", () => {
  it("moves a timed block to another day keeping duration", () => {
    const next = shiftToDay("2026-09-05T13:00", "2026-09-05T15:00", new Date(2026, 8, 7), 14 * 60);
    expect(next).toEqual({ start: "2026-09-07T14:00", end: "2026-09-07T16:00" });
  });

  it("drops time when moving to all day", () => {
    const next = shiftToDay("2026-09-05T13:00", "2026-09-05T15:00", new Date(2026, 8, 6));
    expect(next.start).toBe("2026-09-06");
  });
});

describe("resizeTimed", () => {
  it("keeps a 15-minute minimum", () => {
    const next = resizeTimed("2026-09-05T13:00", "2026-09-05T14:00", "end", new Date(2026, 8, 5), 13 * 60);
    expect(next.end).toBe("2026-09-05T13:15");
  });
});

describe("nowLineOffset", () => {
  it("aligns to the hour grid without snapping", () => {
    const now = new Date(2026, 8, 5, 10, 7);
    expect(nowLineOffset(now)).toBeCloseTo((10 * 60 + 7) / 60 * HOUR_PX);
  });
});

describe("slotFromClick", () => {
  it("opens a 60-minute timed draft", () => {
    expect(slotFromClick({ zone: "timed", day: new Date(2026, 8, 5), minutes: 13 * 60 + 7 })).toEqual({
      start: "2026-09-05T13:00",
      end: "2026-09-05T14:00",
    });
  });

  it("opens an all-day draft on that day", () => {
    expect(slotFromClick({ zone: "allDay", day: new Date(2026, 8, 5), minutes: 0 })).toEqual({
      start: "2026-09-05",
      end: "2026-09-05",
    });
  });
});

describe("slotFromDrag", () => {
  it("fills a timed range with a 15-minute minimum", () => {
    const from = { zone: "timed" as const, day: new Date(2026, 8, 5), minutes: 10 * 60 };
    const to = { zone: "timed" as const, day: new Date(2026, 8, 5), minutes: 10 * 60 };
    expect(slotFromDrag(from, to)).toEqual({ start: "2026-09-05T10:00", end: "2026-09-05T10:15" });
  });

  it("spans all-day days", () => {
    const from = { zone: "allDay" as const, day: new Date(2026, 8, 7), minutes: 0 };
    const to = { zone: "allDay" as const, day: new Date(2026, 8, 5), minutes: 0 };
    expect(slotFromDrag(from, to)).toEqual({ start: "2026-09-05", end: "2026-09-07" });
  });
});
