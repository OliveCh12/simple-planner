import { describe, expect, it } from "vitest";
import {
  columnIndexContaining,
  columnsFor,
  defaultScaleFor,
  instantAtX,
  nearestColumnIndex,
  xOfInstant,
  zoomIn,
  zoomOut,
} from "@/lib/time/scale";

const monday = { weekStartsOn: 1 as const };
const sunday = { weekStartsOn: 0 as const };

describe("columnsFor", () => {
  it("covers a year with 12 month columns", () => {
    const columns = columnsFor("month", "2027-01-01", "2027-12-31", monday);
    expect(columns).toHaveLength(12);
    expect(columns[0].key).toBe("month:2027-01-01T00");
    expect(columns[11].start).toEqual(new Date(2027, 11, 1));
    expect(columns[11].end).toEqual(new Date(2028, 0, 1));
  });

  it("snaps to whole units around a free date range", () => {
    const columns = columnsFor("week", "2027-09-14", "2027-09-30", monday);
    expect(columns[0].start).toEqual(new Date(2027, 8, 13));
    expect(columns.at(-1)?.end).toEqual(new Date(2027, 9, 4));
    expect(columns).toHaveLength(3);
  });

  it("honours the first day of the week", () => {
    const columns = columnsFor("week", "2027-09-14", "2027-09-14", sunday);
    expect(columns[0].start).toEqual(new Date(2027, 8, 12));
  });

  it("produces 24 hour columns per day and 31 day columns for October", () => {
    expect(columnsFor("hour", "2027-10-01", "2027-10-01", monday)).toHaveLength(24);
    expect(columnsFor("day", "2027-10-01", "2027-10-31", monday)).toHaveLength(31);
  });

  it("returns nothing for invalid dates", () => {
    expect(columnsFor("day", "nope", "2027-10-31", monday)).toEqual([]);
  });
});

describe("column lookup", () => {
  const columns = columnsFor("month", "2027-01-01", "2027-12-31", monday);

  it("finds the containing column, or -1 outside the range", () => {
    expect(columnIndexContaining(columns, new Date(2027, 8, 14))).toBe(8);
    expect(columnIndexContaining(columns, new Date(2027, 0, 1))).toBe(0);
    expect(columnIndexContaining(columns, new Date(2026, 11, 31))).toBe(-1);
    expect(columnIndexContaining(columns, new Date(2028, 0, 1))).toBe(-1);
  });

  it("clamps to the edges when asked for the nearest column", () => {
    expect(nearestColumnIndex(columns, new Date(2026, 11, 31))).toBe(0);
    expect(nearestColumnIndex(columns, new Date(2028, 5, 1))).toBe(11);
  });
});

describe("xOfInstant / instantAtX", () => {
  const columns = columnsFor("month", "2027-01-01", "2027-12-31", monday);

  it("maps an instant to a fractional column offset and back", () => {
    const instant = new Date(2027, 8, 16); // mid-September
    const x = xOfInstant(columns, instant, 300);
    expect(x).toBeCloseTo((8 + 15 / 30) * 300, 5);
    expect(instantAtX(columns, x, 300)?.getTime()).toBeCloseTo(instant.getTime(), -3);
  });

  it("clamps beyond the last column", () => {
    expect(xOfInstant(columns, new Date(2030, 0, 1), 300)).toBe(12 * 300);
    expect(instantAtX(columns, 99999, 300)).toEqual(columns[11].end);
  });
});

describe("defaultScaleFor", () => {
  it("picks a scale from the plan duration", () => {
    expect(defaultScaleFor("2027-09-14", "2027-09-14")).toBe("hour");
    expect(defaultScaleFor("2027-09-14", "2027-09-27")).toBe("day");
    expect(defaultScaleFor("2027-10-01", "2027-10-31")).toBe("day");
    expect(defaultScaleFor("2027-09-01", "2027-12-31")).toBe("week");
    expect(defaultScaleFor("2027-01-01", "2027-12-31")).toBe("month");
    expect(defaultScaleFor("2026-01-01", "2030-12-31")).toBe("year");
  });
});

describe("zoom ladder", () => {
  it("steps through the scales and stops at the ends", () => {
    expect(zoomIn("month")).toBe("week");
    expect(zoomOut("month")).toBe("year");
    expect(zoomIn("hour")).toBeNull();
    expect(zoomOut("year")).toBeNull();
  });
});
