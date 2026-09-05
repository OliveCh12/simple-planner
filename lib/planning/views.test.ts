import { describe, expect, it } from "vitest";
import { indexById } from "@/lib/domain/tree";
import {
  dueState,
  filterItems,
  groupItems,
  isInbox,
  isToSchedule,
  planCounts,
  planTree,
  sortItems,
} from "@/lib/planning/views";
import type { PlanItem } from "@/types";

function item(overrides: Partial<PlanItem> & Pick<PlanItem, "id">): PlanItem {
  return {
    planId: "plan",
    kind: "task",
    title: overrides.id,
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

const today = new Date(2026, 8, 5);

const items: PlanItem[] = [
  item({ id: "goal", kind: "objective", title: "Better home", start: "2026-01-01", end: "2026-12-31" }),
  item({ id: "cabin", kind: "project", title: "Build the cabin", parentId: "goal", due: "2026-09-30" }),
  item({ id: "wood", title: "Buy wood", parentId: "cabin", due: "2026-09-04" }),
  item({ id: "tools", title: "Choose tools", parentId: "cabin" }),
  item({ id: "ground", title: "Prepare the ground", parentId: "cabin", start: "2026-09-07" }),
  item({ id: "sub", title: "Measure the plot", parentId: "ground" }),
  item({ id: "plumber", title: "Call the plumber" }),
  item({ id: "done", title: "Old chore", status: "completed" }),
  item({ id: "tagged", title: "Read the article", categoryId: "cat-learning" }),
  item({ id: "solo", kind: "project", title: "Trip prep", planId: "plan-2" }),
];

describe("inbox and schedule", () => {
  it("puts bare captures in the inbox and clarified work in to-schedule", () => {
    const byId = indexById(items);
    expect(items.filter(isInbox).map((entry) => entry.id)).toEqual(["plumber", "tagged"]);
    expect(items.filter((entry) => isToSchedule(entry, byId)).map((entry) => entry.id)).toEqual(["wood", "tools"]);
  });

  it("does not schedule subtasks on their own, nor scheduled or finished work", () => {
    const byId = indexById(items);
    expect(isToSchedule(byId.get("sub")!, byId)).toBe(false);
    expect(isToSchedule(byId.get("ground")!, byId)).toBe(false);
    expect(isToSchedule(byId.get("done")!, byId)).toBe(false);
  });

  it("counts for the navigation", () => {
    expect(planCounts(items)).toEqual({ inbox: 2, schedule: 2, projects: 3, tasks: 6 });
  });
});

describe("filterItems", () => {
  it("scopes to a project subtree, a calendar, a deadline window and text", () => {
    const within = filterItems(items, { withinIds: ["cabin"] }, today).map((entry) => entry.id);
    expect(within).toEqual(["cabin", "wood", "tools", "ground", "sub"]);
    expect(filterItems(items, { planIds: ["plan-2"] }, today).map((entry) => entry.id)).toEqual(["solo"]);
    expect(filterItems(items, { due: "overdue" }, today).map((entry) => entry.id)).toEqual(["wood"]);
    expect(filterItems(items, { due: "month" }, today).map((entry) => entry.id)).toEqual(["cabin", "wood"]);
    expect(filterItems(items, { query: "plumb" }, today).map((entry) => entry.id)).toEqual(["plumber"]);
    expect(filterItems(items, { schedule: "unscheduled", kinds: ["task"] }, today).map((entry) => entry.id)).toEqual([
      "wood",
      "tools",
      "sub",
      "plumber",
      "tagged",
    ]);
  });

  it("hides finished work unless asked", () => {
    expect(filterItems(items, { query: "chore" }, today)).toEqual([]);
    expect(filterItems(items, { query: "chore", showDone: true }, today).map((entry) => entry.id)).toEqual(["done"]);
  });
});

describe("sorting and grouping", () => {
  it("sorts deadlines first, then dated work, then the rest", () => {
    const tasks = items.filter((entry) => entry.kind === "task" && entry.status === "pending");
    expect(sortItems(tasks, "time").map((entry) => entry.id)).toEqual(["wood", "ground", "tools", "sub", "plumber", "tagged"]);
  });

  it("groups by project with a bucket for loose tasks", () => {
    const tasks = items.filter((entry) => entry.kind === "task");
    const groups = groupItems(tasks, "project", { all: items, plans: [], categories: [], today });
    expect(groups.map((group) => [group.label, group.items.length])).toEqual([
      ["Build the cabin", 4],
      ["No project", 3],
    ]);
  });

  it("groups by deadline state", () => {
    const groups = groupItems(items, "due", { all: items, plans: [], categories: [], today });
    expect(groups.map((group) => group.id)).toEqual(["overdue", "later", "none"]);
  });
});

describe("planTree", () => {
  it("roots goals and loose projects, nesting projects, tasks and subtasks", () => {
    const tree = planTree(items);
    expect(tree.map((node) => node.item.id)).toEqual(["goal", "solo"]);
    const cabin = tree[0].children[0];
    expect(cabin.item.id).toBe("cabin");
    expect(cabin.children.map((node) => node.item.id)).toEqual(["wood", "ground", "tools"]);
    expect(cabin.children[1].children.map((node) => node.item.id)).toEqual(["sub"]);
    expect(cabin.progress).toEqual({ done: 0, total: 3 });
  });
});

describe("dueState", () => {
  it("reads a deadline against today", () => {
    expect(dueState("2026-09-04", today)).toBe("overdue");
    expect(dueState("2026-09-05", today)).toBe("today");
    expect(dueState("2026-09-10", today)).toBe("soon");
    expect(dueState("2026-10-10", today)).toBe("later");
    expect(dueState(undefined, today)).toBeUndefined();
  });
});
