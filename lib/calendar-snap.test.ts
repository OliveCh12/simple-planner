import { describe, expect, it } from "vitest";
import { resizeTimed, shiftToDay, snapMinutes } from "@/lib/calendar-snap";

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
