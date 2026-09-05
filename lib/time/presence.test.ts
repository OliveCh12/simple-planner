import { describe, expect, it } from "vitest";
import {
  containsNow,
  isElapsedDay,
  isElapsedMonth,
  isElapsedOccurrence,
} from "@/lib/time/presence";

const now = new Date(2026, 8, 5, 14, 30);

describe("containsNow", () => {
  it("is true only when now sits in the half-open range", () => {
    expect(containsNow({ start: new Date(2026, 8, 1), end: new Date(2026, 9, 1) }, now)).toBe(true);
    expect(containsNow({ start: new Date(2026, 7, 1), end: new Date(2026, 8, 1) }, now)).toBe(false);
    expect(containsNow({ start: new Date(2026, 9, 1), end: new Date(2026, 10, 1) }, now)).toBe(false);
  });
});

describe("elapsed time", () => {
  it("marks days and months before now", () => {
    expect(isElapsedDay(new Date(2026, 8, 4), now)).toBe(true);
    expect(isElapsedDay(new Date(2026, 8, 5), now)).toBe(false);
    expect(isElapsedMonth(new Date(2026, 7, 1), now)).toBe(true);
    expect(isElapsedMonth(new Date(2026, 8, 1), now)).toBe(false);
  });

  it("treats an occurrence as elapsed only after it ends", () => {
    expect(isElapsedOccurrence({ start: "2026-09-05T09:00", end: "2026-09-05T10:00" }, now)).toBe(true);
    expect(isElapsedOccurrence({ start: "2026-09-05T14:00", end: "2026-09-05T15:00" }, now)).toBe(false);
    expect(isElapsedOccurrence({ start: "2026-09-05" }, now)).toBe(false);
    expect(isElapsedOccurrence({ start: "2026-09-04" }, now)).toBe(true);
  });
});
