import { describe, expect, it } from "vitest";
import {
  MAX_SCROLL_WIDTH,
  NOMINAL_MS,
  PX_PER_UNIT,
  instantAt,
  layoutFor,
  parentScale,
  xOf,
} from "@/lib/time/layout";

const monday = { weekStartsOn: 1 as const };

describe("parentScale", () => {
  it("maps each scale to the header's major tick level", () => {
    expect(parentScale("year")).toBeNull();
    expect(parentScale("month")).toBe("year");
    expect(parentScale("week")).toBe("month");
    expect(parentScale("day")).toBe("month");
    expect(parentScale("hour")).toBe("day");
  });
});

describe("layoutFor", () => {
  it("covers a calendar year of months with proportional widths", () => {
    const layout = layoutFor("month", "2027-01-01", "2027-12-31", monday);
    expect(layout.units).toHaveLength(12);
    expect(layout.majorUnits).toHaveLength(1);
    expect(layout.majorUnits[0].start).toEqual(new Date(2027, 0, 1));

    const january = layout.units[0];
    const february = layout.units[1];
    const janWidth = xOf(layout, january.end) - xOf(layout, january.start);
    const febWidth = xOf(layout, february.end) - xOf(layout, february.start);
    expect(febWidth).toBeLessThan(janWidth);
    expect(febWidth / janWidth).toBeCloseTo(28 / 31, 5);
    expect(xOf(layout, layout.origin)).toBe(0);
    expect(xOf(layout, layout.end)).toBeCloseTo(layout.totalWidth, 5);
  });

  it("places week-scale major ticks on month boundaries, including a straddling week", () => {
    const layout = layoutFor("week", "2027-09-14", "2027-10-10", monday);
    expect(layout.units[0].start).toEqual(new Date(2027, 8, 13));
    expect(layout.majorUnits.map((unit) => unit.start)).toEqual([
      new Date(2027, 8, 1),
      new Date(2027, 9, 1),
    ]);
  });

  it("uses days as major ticks at hour scale", () => {
    const layout = layoutFor("hour", "2027-09-14", "2027-09-15", monday);
    expect(layout.units).toHaveLength(48);
    expect(layout.majorUnits).toHaveLength(2);
    expect(layout.majorUnits[1].start).toEqual(new Date(2027, 8, 15));
  });

  it("returns an empty layout for invalid dates", () => {
    const layout = layoutFor("day", "nope", "2027-10-31", monday);
    expect(layout.units).toEqual([]);
    expect(layout.totalWidth).toBe(0);
    expect(instantAt(layout, 0)).toBeNull();
  });
});

describe("xOf / instantAt", () => {
  const layout = layoutFor("month", "2027-01-01", "2027-12-31", monday);

  it("maps an instant to elapsed time and back", () => {
    const instant = new Date(2027, 8, 16);
    const x = xOf(layout, instant);
    const expected =
      (instant.getTime() - layout.origin.getTime()) *
      (PX_PER_UNIT.month / NOMINAL_MS.month);
    expect(x).toBeCloseTo(expected, 5);
    expect(instantAt(layout, x)?.getTime()).toBeCloseTo(instant.getTime(), -3);
  });

  it("does not clamp xOf so bars can start off-canvas", () => {
    expect(xOf(layout, new Date(2026, 6, 1))).toBeLessThan(0);
    expect(xOf(layout, new Date(2028, 5, 1))).toBeGreaterThan(layout.totalWidth);
  });

  it("clamps instantAt to the canvas", () => {
    expect(instantAt(layout, -100)).toEqual(layout.origin);
    expect(instantAt(layout, layout.totalWidth + 50)?.getTime()).toBeCloseTo(
      layout.end.getTime(),
      -3
    );
  });
});

describe("DST", () => {
  it("makes a spring-forward day shorter than a 24-hour day", () => {
    const layout = layoutFor("day", "2027-03-27", "2027-03-29", monday);
    const before = layout.units[0];
    const spring = layout.units[1];
    const beforeWidth = xOf(layout, before.end) - xOf(layout, before.start);
    const springWidth = xOf(layout, spring.end) - xOf(layout, spring.start);
    expect(before.start).toEqual(new Date(2027, 2, 27));
    expect(spring.start).toEqual(new Date(2027, 2, 28));
    expect(springWidth / beforeWidth).toBeCloseTo(23 / 24, 5);
  });

  it("makes a fall-back day longer than a 24-hour day", () => {
    const layout = layoutFor("day", "2027-10-30", "2027-11-01", monday);
    const fall = layout.units[1];
    const after = layout.units[2];
    const fallWidth = xOf(layout, fall.end) - xOf(layout, fall.start);
    const afterWidth = xOf(layout, after.end) - xOf(layout, after.start);
    expect(fall.start).toEqual(new Date(2027, 9, 31));
    expect(fallWidth / afterWidth).toBeCloseTo(25 / 24, 5);
  });

  it("skips the missing hour and keeps 25 ticks on the repeated hour's day", () => {
    const spring = layoutFor("hour", "2027-03-28", "2027-03-28", monday);
    const fall = layoutFor("hour", "2027-10-31", "2027-10-31", monday);
    expect(spring.units).toHaveLength(23);
    expect(fall.units).toHaveLength(25);
    expect(spring.totalWidth / fall.totalWidth).toBeCloseTo(23 / 25, 5);
  });
});

describe("scroll width cap", () => {
  it("shrinks pxPerMs so a long hour-scale plan stays under the cap", () => {
    const layout = layoutFor("hour", "2020-01-01", "2039-12-31", monday);
    expect(layout.totalWidth).toBeCloseTo(MAX_SCROLL_WIDTH, 0);
    expect(layout.pxPerUnit).toBeLessThan(PX_PER_UNIT.hour);
    expect(xOf(layout, layout.end)).toBeCloseTo(MAX_SCROLL_WIDTH, 0);
  });

  it("leaves a one-year hour plan uncapped", () => {
    const layout = layoutFor("hour", "2027-01-01", "2027-12-31", monday);
    expect(layout.totalWidth).toBeLessThan(MAX_SCROLL_WIDTH);
    expect(layout.pxPerUnit).toBeCloseTo(PX_PER_UNIT.hour, 5);
  });
});
