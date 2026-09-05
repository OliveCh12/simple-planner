import { describe, expect, it } from "vitest";
import {
  CLUSTER_PX,
  LABEL_CHAR_PX,
  LABEL_PAD_PX,
  MILESTONE_PX,
  estimateLabelWidth,
  groupByObjective,
  laneTasksFromItems,
  layoutLanes,
  type LaneItem,
  type LaneTask,
} from "@/lib/lanes";
import { intervalOf, isAllDay } from "@/lib/time/local";
import type { PlanItem } from "@/types";

const DAY_MS = 86_400_000;
const origin = new Date(2027, 0, 1).getTime();
/** 10 px per day from 1 Jan 2027. */
const xOf = (date: Date) => ((date.getTime() - origin) / DAY_MS) * 10;

function task(id: string, start: string, end: string, title = id): LaneTask {
  return { id, title, interval: intervalOf({ start, end }), allDay: isAllDay(start) };
}

function byId(items: LaneItem[], id: string): LaneItem {
  const item = items.find((entry) => entry.id === id);
  if (!item) throw new Error(`missing ${id}`);
  return item;
}

describe("estimateLabelWidth", () => {
  it("pads a per-character estimate", () => {
    expect(estimateLabelWidth("")).toBe(LABEL_PAD_PX);
    expect(estimateLabelWidth("abc")).toBe(Math.ceil(3 * LABEL_CHAR_PX) + LABEL_PAD_PX);
  });
});

describe("layoutLanes", () => {
  it("puts disjoint tasks on one lane", () => {
    const { allDay } = layoutLanes(
      [task("a", "2027-01-01", "2027-01-10"), task("b", "2027-01-20", "2027-01-30")],
      xOf
    );
    expect(allDay.laneCount).toBe(1);
    expect(allDay.items.map((item) => [item.id, item.lane])).toEqual([
      ["a", 0],
      ["b", 0],
    ]);
  });

  it("splits overlapping tasks onto separate lanes", () => {
    const { allDay } = layoutLanes(
      [task("a", "2027-01-01", "2027-01-20"), task("b", "2027-01-10", "2027-01-30")],
      xOf
    );
    expect(allDay.laneCount).toBe(2);
    expect(byId(allDay.items, "a").lane).toBe(0);
    expect(byId(allDay.items, "b").lane).toBe(1);
  });

  it("places the longer task first when two share a start", () => {
    const { allDay } = layoutLanes(
      [task("short", "2027-01-01", "2027-01-10"), task("long", "2027-01-01", "2027-01-30")],
      xOf
    );
    expect(byId(allDay.items, "long").lane).toBe(0);
    expect(byId(allDay.items, "short").lane).toBe(1);
  });

  it("draws a timed instant as a milestone", () => {
    const { timed } = layoutLanes([task("pin", "2027-01-05T09:00", "2027-01-05T09:00")], xOf);
    const pin = byId(timed.items, "pin");
    expect(pin.kind).toBe("milestone");
    expect(pin.width).toBe(MILESTONE_PX);
    expect(pin.x).toBeCloseTo(xOf(new Date(2027, 0, 5, 9)) - MILESTONE_PX / 2, 5);
  });

  it("keeps a one-day all-day task as a bar, not a milestone", () => {
    const { allDay } = layoutLanes([task("day", "2027-01-05", "2027-01-05")], xOf);
    expect(allDay.items[0].kind).toBe("bar");
    expect(allDay.items[0].width).toBe(10);
  });

  it("pushes the next bar to another lane when a label overflows", () => {
    const long = "A".repeat(40);
    const { allDay } = layoutLanes(
      [task("a", "2027-01-01", "2027-01-02", long), task("b", "2027-01-05", "2027-01-15")],
      xOf
    );
    expect(estimateLabelWidth(long)).toBeGreaterThan(40);
    expect(byId(allDay.items, "a").lane).toBe(0);
    expect(byId(allDay.items, "b").lane).toBe(1);
    expect(byId(allDay.items, "a").occupiedUntil).toBeGreaterThan(byId(allDay.items, "b").x);
  });

  it("clusters tiny nearby bars and leaves a wide neighbour as its own bar", () => {
    const { allDay } = layoutLanes(
      [
        task("a", "2027-01-01", "2027-01-01"),
        task("b", "2027-01-02", "2027-01-02"),
        task("c", "2027-01-03", "2027-01-03"),
        task("wide", "2027-01-01", "2027-01-20"),
        task("later", "2027-01-10", "2027-01-10"),
      ],
      xOf
    );

    const cluster = allDay.items.find((item) => item.kind === "cluster");
    expect(cluster?.memberIds).toEqual(["a", "b", "c"]);
    expect(cluster?.width).toBeGreaterThanOrEqual(CLUSTER_PX);
    expect(byId(allDay.items, "wide").kind).toBe("bar");
    expect(byId(allDay.items, "wide").lane).not.toBe(cluster?.lane);
    expect(byId(allDay.items, "later").kind).toBe("bar");
    expect(byId(allDay.items, "later").width).toBe(10);
  });

  it("keeps all-day and timed tasks on separate stacks", () => {
    const layout = layoutLanes(
      [task("day", "2027-01-01", "2027-01-10"), task("meet", "2027-01-01T09:00", "2027-01-10T11:00")],
      xOf
    );
    expect(layout.allDay.laneCount).toBe(1);
    expect(layout.timed.laneCount).toBe(1);
    expect(layout.allDay.items[0].id).toBe("day");
    expect(layout.timed.items[0].id).toBe("meet");
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

describe("laneTasksFromItems", () => {
  it("expands recurrences only inside the visible window", () => {
    const gym = planItem({
      id: "gym",
      title: "Gym",
      kind: "task",
      start: "2026-06-01T07:00",
      end: "2026-06-01T08:00",
      recurrence: "FREQ=WEEKLY;BYDAY=MO;UNTIL=20260831",
    });
    const range = { start: new Date(2026, 7, 3), end: new Date(2026, 7, 10) };
    const tasks = laneTasksFromItems([gym], range);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.length).toBeLessThan(8);
    expect(tasks.every((entry) => entry.interval.start >= range.start && entry.interval.start < range.end)).toBe(
      true
    );
    expect(tasks.every((entry) => entry.recurring)).toBe(true);
  });

  it("keeps a missing end as a timed milestone", () => {
    const visa = planItem({
      id: "visa",
      title: "Visa",
      kind: "task",
      start: "2026-10-03T09:30",
    });
    const tasks = laneTasksFromItems([visa], {
      start: new Date(2026, 9, 1),
      end: new Date(2026, 10, 1),
    });
    const { timed } = layoutLanes(tasks, xOf);
    expect(timed.items[0]?.kind).toBe("milestone");
  });
});

describe("groupByObjective", () => {
  it("groups descendants under the root objective and leaves the rest unsorted", () => {
    const items = [
      planItem({
        id: "obj",
        title: "Ship",
        kind: "objective",
        start: "2026-01-01",
        end: "2026-12-31",
        status: "in-progress",
      }),
      planItem({
        id: "child",
        title: "Build",
        kind: "task",
        start: "2026-09-01",
        end: "2026-09-10",
        parentId: "obj",
        status: "completed",
      }),
      planItem({
        id: "nested",
        title: "Page",
        kind: "task",
        start: "2026-09-01",
        end: "2026-09-05",
        parentId: "child",
      }),
      planItem({ id: "jazz", title: "Jazz", kind: "event", start: "2026-09-20T20:00", end: "2026-09-20T23:00" }),
    ];
    const tasks = laneTasksFromItems(items, {
      start: new Date(2026, 0, 1),
      end: new Date(2027, 0, 1),
    });
    const groups = groupByObjective(items, tasks);
    expect(groups.map((group) => group.id)).toEqual(["obj", "unsorted"]);
    expect(groups[0].title).toBe("Ship");
    expect(groups[0].done).toBe(1);
    expect(groups[0].total).toBe(3);
    expect(groups[1].title).toBe("No objective");
    expect(groups[1].tasks.map((entry) => entry.itemId)).toEqual(["jazz"]);
  });
});
