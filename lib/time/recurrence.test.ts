import { describe, expect, it } from "vitest";
import { expandRecurrence, parseRRule } from "@/lib/time/recurrence";

const range = (start: string, end: string) => {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  return {
    start: new Date(sy, sm - 1, sd),
    end: new Date(ey, em - 1, ed),
  };
};

describe("parseRRule", () => {
  it("parses the subset used by the planner", () => {
    const rule = parseRRule("FREQ=WEEKLY;BYDAY=MO,WE,FR;INTERVAL=1;UNTIL=20260831");
    expect(rule.freq).toBe("WEEKLY");
    expect(rule.byDay).toEqual(["MO", "WE", "FR"]);
    expect(rule.until).toEqual(new Date(2026, 7, 32));
  });

  it("rejects a missing FREQ", () => {
    expect(() => parseRRule("INTERVAL=2")).toThrow(/FREQ/);
  });
});

describe("expandRecurrence", () => {
  it("returns the original item when there is no rule", () => {
    expect(
      expandRecurrence({ start: "2026-06-01", end: "2026-06-01" }, range("2026-06-01", "2026-07-01"))
    ).toEqual([{ start: "2026-06-01", end: "2026-06-01" }]);
  });

  it("expands daily with COUNT", () => {
    const occurrences = expandRecurrence(
      { start: "2026-06-01", end: "2026-06-01", recurrence: "FREQ=DAILY;COUNT=3" },
      range("2026-01-01", "2027-01-01")
    );
    expect(occurrences.map((item) => item.start)).toEqual(["2026-06-01", "2026-06-02", "2026-06-03"]);
  });

  it("expands weekdays with UNTIL", () => {
    const occurrences = expandRecurrence(
      {
        start: "2026-06-01T07:00",
        end: "2026-06-01T08:00",
        recurrence: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=20260605",
      },
      range("2026-06-01", "2026-07-01")
    );
    expect(occurrences.map((item) => item.start)).toEqual([
      "2026-06-01T07:00",
      "2026-06-02T07:00",
      "2026-06-03T07:00",
      "2026-06-04T07:00",
      "2026-06-05T07:00",
    ]);
    expect(occurrences[0]?.end).toBe("2026-06-01T08:00");
  });

  it("skips the week in between when INTERVAL=2", () => {
    const occurrences = expandRecurrence(
      { start: "2026-06-03", end: "2026-06-03", recurrence: "FREQ=WEEKLY;INTERVAL=2;BYDAY=WE;COUNT=3" },
      range("2026-06-01", "2026-08-01")
    );
    expect(occurrences.map((item) => item.start)).toEqual(["2026-06-03", "2026-06-17", "2026-07-01"]);
  });

  it("skips months that do not have BYMONTHDAY=31", () => {
    const occurrences = expandRecurrence(
      { start: "2026-01-31", end: "2026-01-31", recurrence: "FREQ=MONTHLY;BYMONTHDAY=31;COUNT=4" },
      range("2026-01-01", "2027-01-01")
    );
    expect(occurrences.map((item) => item.start)).toEqual([
      "2026-01-31",
      "2026-03-31",
      "2026-05-31",
      "2026-07-31",
    ]);
  });

  it("expands yearly and skips 29 Feb on common years", () => {
    const yearly = expandRecurrence(
      { start: "2024-03-01", end: "2024-03-01", recurrence: "FREQ=YEARLY;COUNT=3" },
      range("2024-01-01", "2028-01-01")
    );
    expect(yearly.map((item) => item.start)).toEqual(["2024-03-01", "2025-03-01", "2026-03-01"]);

    const leap = expandRecurrence(
      { start: "2024-02-29", end: "2024-02-29", recurrence: "FREQ=YEARLY;COUNT=2" },
      range("2024-01-01", "2029-01-01")
    );
    expect(leap.map((item) => item.start)).toEqual(["2024-02-29", "2028-02-29"]);
  });

  it("drops recurrenceExceptions", () => {
    const occurrences = expandRecurrence(
      {
        start: "2026-06-01",
        end: "2026-06-01",
        recurrence: "FREQ=DAILY;COUNT=4",
        recurrenceExceptions: ["2026-06-02"],
      },
      range("2026-06-01", "2026-07-01")
    );
    expect(occurrences.map((item) => item.start)).toEqual(["2026-06-01", "2026-06-03", "2026-06-04"]);
  });

  it("clips to the visible range", () => {
    const occurrences = expandRecurrence(
      { start: "2026-01-01", end: "2026-01-01", recurrence: "FREQ=DAILY" },
      range("2026-03-10", "2026-03-13")
    );
    expect(occurrences.map((item) => item.start)).toEqual(["2026-03-10", "2026-03-11", "2026-03-12"]);
  });

  it("keeps civil days across a DST spring-forward", () => {
    const occurrences = expandRecurrence(
      { start: "2026-03-28", end: "2026-03-28", recurrence: "FREQ=DAILY;COUNT=3" },
      range("2026-03-01", "2026-04-01")
    );
    expect(occurrences.map((item) => item.start)).toEqual(["2026-03-28", "2026-03-29", "2026-03-30"]);
  });
});
