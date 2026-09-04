import { describe, expect, it } from "vitest";
import {
  occupiesMonthDay,
  occurrencesInRange,
  packInRange,
  periodLabel,
  timedLabel,
} from "@/lib/calendar";
import { intervalOf } from "@/lib/time/local";
import type { PlanItem } from "@/types";

const range = intervalOf({ start: "2027-09-13", end: "2027-09-19" }); // Mon–Sun week

function item(id: string, start: string, end: string) {
  return { id, interval: intervalOf({ start, end }) };
}

describe("packInRange", () => {
  it("puts disjoint tasks on one lane", () => {
    const { spans, laneCount } = packInRange(
      [item("a", "2027-09-13", "2027-09-14"), item("b", "2027-09-16", "2027-09-17")],
      range
    );
    expect(laneCount).toBe(1);
    expect(spans.map((span) => [span.id, span.lane])).toEqual([
      ["a", 0],
      ["b", 0],
    ]);
  });

  it("splits overlapping tasks onto separate lanes", () => {
    const { spans, laneCount } = packInRange(
      [item("a", "2027-09-13", "2027-09-16"), item("b", "2027-09-14", "2027-09-18")],
      range
    );
    expect(laneCount).toBe(2);
    expect(spans.find((span) => span.id === "a")?.lane).toBe(0);
    expect(spans.find((span) => span.id === "b")?.lane).toBe(1);
  });

  it("clips to the range and skips tasks outside it", () => {
    const { spans } = packInRange(
      [item("inside", "2027-09-10", "2027-09-20"), item("out", "2027-08-01", "2027-08-05")],
      range
    );
    expect(spans).toHaveLength(1);
    expect(spans[0].id).toBe("inside");
    expect(spans[0].startFrac).toBe(0);
    expect(spans[0].endFrac).toBe(1);
  });
});

function planItem(overrides: Partial<PlanItem> & Pick<PlanItem, "id" | "title" | "start" | "kind">): PlanItem {
  return {
    planId: "plan",
    notes: "",
    status: "pending",
    energy: "medium",
    executor: "human",
    assigneeIds: [],
    attendeeIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("occurrencesInRange", () => {
  const september = { start: new Date(2026, 8, 1), end: new Date(2026, 9, 1) };

  it("includes events and objectives, not only tasks", () => {
    const items = [
      planItem({ id: "jazz", title: "Jazz night", kind: "event", start: "2026-09-20T20:00", end: "2026-09-20T23:00" }),
      planItem({ id: "ship", title: "Ship a product", kind: "objective", start: "2026-01-01", end: "2026-12-31" }),
      planItem({ id: "visa", title: "Visa appointment", kind: "task", start: "2026-10-03T09:30" }),
    ];
    const occs = occurrencesInRange(items, september);
    expect(occs.map((entry) => entry.itemId).sort()).toEqual(["jazz", "ship"]);
    expect(occs.find((entry) => entry.itemId === "jazz")?.end).toBe("2026-09-20T23:00");
    expect(occs.find((entry) => entry.itemId === "visa")).toBeUndefined();
  });

  it("keeps a missing end absent", () => {
    const items = [planItem({ id: "visa", title: "Visa", kind: "task", start: "2026-10-03T09:30" })];
    const occs = occurrencesInRange(items, { start: new Date(2026, 9, 1), end: new Date(2026, 10, 1) });
    expect(occs).toHaveLength(1);
    expect(occs[0].end).toBeUndefined();
    expect(timedLabel(occs[0])).toBe("09:30");
  });

  it("expands recurrences that fall in the range", () => {
    const items = [
      planItem({
        id: "gym",
        title: "Gym",
        kind: "task",
        start: "2026-06-01T07:00",
        end: "2026-06-01T08:00",
        recurrence: "FREQ=WEEKLY;BYDAY=MO;UNTIL=20260831",
      }),
    ];
    const occs = occurrencesInRange(items, { start: new Date(2026, 7, 1), end: new Date(2026, 8, 1) });
    expect(occs.length).toBeGreaterThan(0);
    expect(occs.every((entry) => entry.start.startsWith("2026-08"))).toBe(true);
  });
});

describe("occupiesMonthDay", () => {
  it("places tasks on their start day only", () => {
    const task = {
      id: "clean",
      itemId: "clean",
      title: "Clean",
      kind: "task" as const,
      status: "pending" as const,
      start: "2026-09-06",
      end: "2026-09-07",
      allDay: true,
    };
    expect(occupiesMonthDay(task, new Date(2026, 8, 6))).toBe(true);
    expect(occupiesMonthDay(task, new Date(2026, 8, 7))).toBe(false);
  });

  it("places events on every occupied day", () => {
    const event = {
      id: "conf",
      itemId: "conf",
      title: "Conference",
      kind: "event" as const,
      status: "pending" as const,
      start: "2026-09-20",
      end: "2026-09-21",
      allDay: true,
    };
    expect(occupiesMonthDay(event, new Date(2026, 8, 20))).toBe(true);
    expect(occupiesMonthDay(event, new Date(2026, 8, 21))).toBe(true);
    expect(occupiesMonthDay(event, new Date(2026, 8, 22))).toBe(false);
  });
});

describe("periodLabel", () => {
  it("names month, week span, and day", () => {
    expect(periodLabel("month", new Date(2026, 8, 4), 1)).toBe("September 2026");
    expect(periodLabel("week", new Date(2026, 8, 30), 1)).toBe("28 Sep – 4 Oct 2026");
    expect(periodLabel("day", new Date(2026, 9, 3), 1)).toBe("Saturday 3 October 2026");
  });
});
