import { describe, expect, it } from "vitest";
import {
  contains,
  formatLocal,
  intersects,
  intervalOf,
  isAllDay,
  isValidLocal,
  parseLocal,
  shiftTask,
} from "@/lib/time/local";

describe("parseLocal / formatLocal", () => {
  it("round-trips all-day and timed values in local time", () => {
    expect(formatLocal(parseLocal("2027-09-14"), true)).toBe("2027-09-14");
    expect(formatLocal(parseLocal("2027-09-14T09:30"), false)).toBe("2027-09-14T09:30");
    expect(parseLocal("2027-09-14").getDate()).toBe(14);
    expect(parseLocal("2027-09-14T09:30").getHours()).toBe(9);
  });

  it("rejects malformed or impossible values", () => {
    expect(isValidLocal("2027-09-14")).toBe(true);
    expect(isValidLocal("2027-09-14T23:59")).toBe(true);
    expect(isValidLocal("2027-02-30")).toBe(false);
    expect(isValidLocal("2027-9-4")).toBe(false);
    expect(isValidLocal("2027-09-14T24:00")).toBe(false);
    expect(isValidLocal("2027-09-14T00:00:00.000Z")).toBe(false);
    expect(isValidLocal(42)).toBe(false);
  });

  it("tells all-day from timed", () => {
    expect(isAllDay("2027-09-14")).toBe(true);
    expect(isAllDay("2027-09-14T09:30")).toBe(false);
  });
});

describe("intervalOf", () => {
  it("makes all-day ends exclusive at the next midnight", () => {
    const { start, end } = intervalOf({ start: "2027-09-14", end: "2027-09-16" });
    expect(start).toEqual(new Date(2027, 8, 14));
    expect(end).toEqual(new Date(2027, 8, 17));
  });

  it("keeps timed ends as-is", () => {
    const { end } = intervalOf({ start: "2027-09-14T09:00", end: "2027-09-14T10:30" });
    expect(end).toEqual(new Date(2027, 8, 14, 10, 30));
  });

  it("never yields an empty interval", () => {
    const { start, end } = intervalOf({ start: "2027-09-14T09:00", end: "2027-09-14T09:00" });
    expect(end > start).toBe(true);
  });
});

describe("intersects / contains", () => {
  const september = { start: new Date(2027, 8, 1), end: new Date(2027, 9, 1) };

  it("uses half-open semantics", () => {
    expect(intersects(intervalOf({ start: "2027-08-20", end: "2027-08-31" }), september)).toBe(false);
    expect(intersects(intervalOf({ start: "2027-08-20", end: "2027-09-01" }), september)).toBe(true);
    expect(intersects(intervalOf({ start: "2027-10-01", end: "2027-10-02" }), september)).toBe(false);
  });

  it("contains a task that fits, not one that overflows", () => {
    expect(contains(september, intervalOf({ start: "2027-09-01", end: "2027-09-30" }))).toBe(true);
    expect(contains(september, intervalOf({ start: "2027-09-01", end: "2027-10-01" }))).toBe(false);
  });
});

describe("shiftTask", () => {
  it("moves by whole units and keeps the duration", () => {
    expect(shiftTask({ start: "2027-09-14", end: "2027-09-16" }, "month", 1)).toEqual({
      start: "2027-10-14",
      end: "2027-10-16",
    });
    expect(shiftTask({ start: "2027-09-14", end: "2027-09-16" }, "week", -2)).toEqual({
      start: "2027-08-31",
      end: "2027-09-02",
    });
  });

  it("clamps month ends like date-fns add()", () => {
    expect(shiftTask({ start: "2027-01-31", end: "2027-01-31" }, "month", 1)).toEqual({
      start: "2027-02-28",
      end: "2027-02-28",
    });
  });

  it("keeps times when shifting timed tasks", () => {
    expect(shiftTask({ start: "2027-09-14T09:30", end: "2027-09-14T11:00" }, "hour", 3)).toEqual({
      start: "2027-09-14T12:30",
      end: "2027-09-14T14:00",
    });
    expect(shiftTask({ start: "2027-09-14T09:30", end: "2027-09-14T11:00" }, "day", 1)).toEqual({
      start: "2027-09-15T09:30",
      end: "2027-09-15T11:00",
    });
  });

  it("returns the same object for a zero delta", () => {
    const task = { start: "2027-09-14", end: "2027-09-16" };
    expect(shiftTask(task, "day", 0)).toBe(task);
  });
});
