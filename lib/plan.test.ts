import { describe, expect, it } from "vitest";
import { defaultTaskRange } from "@/lib/plan";
import { columnsFor } from "@/lib/time/scale";

const monday = { weekStartsOn: 1 as const };

describe("defaultTaskRange", () => {
  it("creates an all-day range covering a day or month unit", () => {
    const days = columnsFor("day", "2027-09-14", "2027-09-14", monday);
    expect(defaultTaskRange(days[0])).toEqual({ start: "2027-09-14", end: "2027-09-14" });

    const months = columnsFor("month", "2027-09-01", "2027-09-30", monday);
    expect(defaultTaskRange(months[0])).toEqual({ start: "2027-09-01", end: "2027-09-30" });
  });

  it("creates a timed hour range at hour scale", () => {
    const hours = columnsFor("hour", "2027-09-14", "2027-09-14", monday);
    expect(defaultTaskRange(hours[9])).toEqual({
      start: "2027-09-14T09:00",
      end: "2027-09-14T10:00",
    });
  });
});
