import { describe, expect, it } from "vitest";
import { planningContext } from "@/lib/planning/context";
import type { PlanItem } from "@/types";

function item(overrides: Partial<PlanItem> & Pick<PlanItem, "id" | "kind">): PlanItem {
  return {
    planId: "plan",
    title: overrides.id,
    notes: "",
    start: "2026-09-01",
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

const items: PlanItem[] = [
  item({ id: "obj", kind: "objective", start: "2026-01-01", end: "2026-12-31", status: "in-progress" }),
  item({ id: "trip", kind: "event", parentId: "obj", start: "2026-10-17", end: "2026-10-24" }),
  item({ id: "book", kind: "task", parentId: "trip", start: "2026-10-05" }),
  item({ id: "later", kind: "task", parentId: "obj", start: "2026-11-01", end: "2026-11-10" }),
  item({ id: "jazz", kind: "event", start: "2026-10-20T20:00" }),
];

const octoberWeek = { start: new Date(2026, 9, 12), end: new Date(2026, 9, 19) };

describe("planningContext", () => {
  it("keeps year view at goals and their explicit events, not a task dump", () => {
    const context = planningContext(items, { start: new Date(2026, 0, 1), end: new Date(2027, 0, 1) }, "year");
    expect(context.objectives).toHaveLength(1);
    expect(context.objectives[0].events.map((entry) => entry.id)).toEqual(["trip"]);
    expect(context.objectives[0].tasks).toEqual([]);
    expect(context.prep).toEqual([]);
    expect(context.toSchedule).toEqual([]);
  });

  it("lists prep for linked events and work still to schedule, ignoring standalone events", () => {
    const context = planningContext(items, octoberWeek, "week");
    expect(context.prep.map((entry) => entry.event.id)).toEqual(["trip"]);
    expect(context.prep[0].tasks.map((task) => task.id)).toEqual(["book"]);
    expect(context.objectives[0].toSchedule.map((task) => task.id)).toEqual(["later"]);
    expect(context.objectives[0].events.map((entry) => entry.id)).toEqual(["trip"]);
  });
});
