import { describe, expect, it } from "vitest";
import { columnLabel, taskDatesLabel, taskRangeLabel } from "@/lib/time/labels";
import { columnsFor } from "@/lib/time/scale";

const options = { weekStartsOn: 1 as const, showWeekNumbers: false };

describe("columnLabel", () => {
  it("labels each scale", () => {
    const at = (scale: Parameters<typeof columnsFor>[0]) =>
      columnLabel(columnsFor(scale, "2027-09-14", "2027-09-14", options)[0], options);

    expect(at("year")).toEqual({ title: "2027" });
    expect(at("month")).toEqual({ eyebrow: "2027", title: "September" });
    expect(at("week")).toEqual({ eyebrow: "2027", title: "13 – 19 Sep" });
    expect(at("day")).toEqual({ eyebrow: "Sep 2027", title: "Tue 14" });
    expect(at("hour")).toEqual({ eyebrow: "Tue 14 Sep", title: "00:00" });
  });

  it("shows week numbers and month-crossing weeks", () => {
    const column = columnsFor("week", "2027-09-29", "2027-09-29", options)[0];
    expect(columnLabel(column, { ...options, showWeekNumbers: true })).toEqual({
      eyebrow: "W39 · 2027",
      title: "27 Sep – 3 Oct",
    });
  });
});

describe("taskRangeLabel", () => {
  const threeDays = { start: "2027-09-14", end: "2027-09-16" };
  const oneDay = { start: "2027-09-14", end: "2027-09-14" };
  const timed = { start: "2027-09-14T09:30", end: "2027-09-14T11:00" };

  it("uses day numbers inside a month or week column", () => {
    expect(taskRangeLabel(threeDays, "month", true)).toBe("14–16");
    expect(taskRangeLabel(oneDay, "week", true)).toBe("14");
    expect(taskRangeLabel({ start: "2027-09-29", end: "2027-10-02" }, "week", true)).toBe(
      "29 Sep – 2 Oct"
    );
  });

  it("adds the month inside a year column", () => {
    expect(taskRangeLabel(threeDays, "year", true)).toBe("Sep 14–16");
    expect(taskRangeLabel({ start: "2027-09-29", end: "2027-10-02" }, "year", true)).toBe(
      "Sep 29 – Oct 2"
    );
  });

  it("shows times, or nothing, inside day and hour columns", () => {
    expect(taskRangeLabel(timed, "day", true)).toBe("09:30–11:00");
    expect(taskRangeLabel(oneDay, "day", true)).toBeNull();
  });

  it("shows the full range for spanning tasks", () => {
    expect(taskRangeLabel({ start: "2027-09-14", end: "2027-10-02" }, "month", false)).toBe(
      "Sep 14 – Oct 2"
    );
    expect(taskRangeLabel({ start: "2027-12-20", end: "2028-01-05" }, "week", false)).toBe(
      "Dec 20, 2027 – Jan 5, 2028"
    );
    expect(taskRangeLabel(timed, "hour", false)).toBe("09:30–11:00");
  });
});

describe("taskDatesLabel", () => {
  it("shows dates for all-day tasks and times for timed ones", () => {
    expect(taskDatesLabel({ start: "2027-09-14", end: "2027-09-16" })).toBe("Sep 14–16");
    expect(taskDatesLabel({ start: "2027-09-15T23:00", end: "2027-09-16T00:00" })).toBe(
      "Sep 15 · 23:00–00:00"
    );
    expect(taskDatesLabel({ start: "2027-09-14T09:00", end: "2027-09-16T18:00" })).toBe(
      "Sep 14 09:00 – Sep 16 18:00"
    );
  });
});
