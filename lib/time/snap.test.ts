import { describe, expect, it } from "vitest";
import { layoutFor } from "@/lib/time/layout";
import { pxPerSnap, resizeTask, shiftBySnap, snapInstant, snapUnit } from "@/lib/time/snap";

const monday = { weekStartsOn: 1 as const };

describe("snapUnit", () => {
  it("uses 15-minute steps for timed hour-scale tasks and days for all-day", () => {
    expect(snapUnit("hour", false)).toBe("minutes");
    expect(snapUnit("hour", true)).toBe("day");
    expect(snapUnit("day", false)).toBe("day");
    expect(snapUnit("month", true)).toBe("month");
  });
});

describe("snapInstant", () => {
  it("rounds timed hour-scale instants to 15 minutes", () => {
    const at = (h: number, m: number) => new Date(2027, 8, 14, h, m);
    expect(snapInstant(at(9, 7), "hour", false, monday)).toEqual(at(9, 0));
    expect(snapInstant(at(9, 8), "hour", false, monday)).toEqual(at(9, 15));
    expect(snapInstant(at(9, 52), "hour", false, monday)).toEqual(at(9, 45));
    expect(snapInstant(at(9, 53), "hour", false, monday)).toEqual(at(10, 0));
  });

  it("snaps all-day hour-scale instants to the day", () => {
    expect(snapInstant(new Date(2027, 8, 14, 15, 40), "hour", true, monday)).toEqual(
      new Date(2027, 8, 14)
    );
  });
});

describe("shiftBySnap", () => {
  it("moves a timed task by 15 minutes at hour scale", () => {
    const task = { start: "2027-09-14T09:00", end: "2027-09-14T10:00" };
    expect(shiftBySnap(task, "hour", 2)).toEqual({
      start: "2027-09-14T09:30",
      end: "2027-09-14T10:30",
    });
  });

  it("moves an all-day task by days at hour scale", () => {
    const task = { start: "2027-09-14", end: "2027-09-16" };
    expect(shiftBySnap(task, "hour", 1)).toEqual({
      start: "2027-09-15",
      end: "2027-09-17",
    });
  });

  it("keeps duration when shifting by months", () => {
    const task = { start: "2027-01-31", end: "2027-01-31" };
    expect(shiftBySnap(task, "month", 1)).toEqual({
      start: "2027-02-28",
      end: "2027-02-28",
    });
  });
});

describe("resizeTask", () => {
  it("updates one edge and keeps the range ordered", () => {
    const task = { start: "2027-09-14", end: "2027-09-16" };
    expect(resizeTask(task, "start", new Date(2027, 8, 13))).toEqual({
      start: "2027-09-13",
      end: "2027-09-16",
    });
    expect(resizeTask(task, "end", new Date(2027, 8, 10))).toEqual({
      start: "2027-09-10",
      end: "2027-09-10",
    });
  });
});

describe("pxPerSnap", () => {
  it("is a quarter of an hour at hour scale", () => {
    const layout = layoutFor("hour", "2027-09-14", "2027-09-14", monday);
    expect(pxPerSnap(layout, "hour", false)).toBeCloseTo(layout.pxPerUnit / 4, 5);
  });
});
