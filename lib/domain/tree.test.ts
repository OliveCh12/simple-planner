import { describe, expect, it } from "vitest";
import {
  ancestorIds,
  calendarEntries,
  childNoun,
  childProgress,
  childrenOf,
  foldableChildren,
  hasFoldableChildren,
  indexById,
  isSubtask,
  nestedChildren,
  withExpandedChildren,
  withoutSubtasks,
} from "@/lib/domain/tree";
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
  item({ id: "obj", kind: "objective" }),
  item({ id: "task-a", kind: "task", parentId: "obj", status: "completed" }),
  item({ id: "task-b", kind: "task", parentId: "obj" }),
  item({ id: "sub-1", kind: "task", parentId: "task-b", status: "completed", start: "2026-09-03" }),
  item({ id: "sub-2", kind: "task", parentId: "task-b", start: "2026-09-02" }),
  item({ id: "sub-2-1", kind: "task", parentId: "sub-2" }),
  item({ id: "loose", kind: "task" }),
  item({ id: "jazz", kind: "event" }),
];

describe("isSubtask", () => {
  const byId = indexById(items);

  it("is true for tasks nested under a task, at any depth", () => {
    expect(isSubtask(byId.get("sub-1")!, byId)).toBe(true);
    expect(isSubtask(byId.get("sub-2-1")!, byId)).toBe(true);
  });

  it("is false for tasks under an objective, root tasks, objectives and events", () => {
    expect(isSubtask(byId.get("task-a")!, byId)).toBe(false);
    expect(isSubtask(byId.get("loose")!, byId)).toBe(false);
    expect(isSubtask(byId.get("obj")!, byId)).toBe(false);
    expect(isSubtask(byId.get("jazz")!, byId)).toBe(false);
  });
});

describe("withoutSubtasks", () => {
  it("keeps parents and drops every subtask", () => {
    expect(withoutSubtasks(items).map((entry) => entry.id)).toEqual([
      "obj",
      "task-a",
      "task-b",
      "loose",
      "jazz",
    ]);
  });
});

describe("withExpandedChildren", () => {
  it("reveals only the direct children of expanded parents", () => {
    expect(withExpandedChildren(items, ["task-b"]).map((entry) => entry.id)).toEqual([
      "obj",
      "task-a",
      "task-b",
      "sub-1",
      "sub-2",
      "loose",
      "jazz",
    ]);
  });

  it("needs a second expand for nested subtasks", () => {
    expect(
      withExpandedChildren(items, ["task-b", "sub-2"]).map((entry) => entry.id)
    ).toEqual(["obj", "task-a", "task-b", "sub-1", "sub-2", "sub-2-1", "loose", "jazz"]);
  });
});

describe("foldableChildren", () => {
  it("is the subtasks a chevron would reveal, not tasks under an objective", () => {
    expect(hasFoldableChildren("task-b", items)).toBe(true);
    expect(hasFoldableChildren("obj", items)).toBe(false);
    expect(foldableChildren("task-b", items).map((entry) => entry.id)).toEqual(["sub-2", "sub-1"]);
  });
});

describe("calendarEntries", () => {
  it("drops objectives and all-day subtasks, keeps a timed subtask on the grid", () => {
    const timed = item({ id: "sub-timed", kind: "task", parentId: "task-b", start: "2026-09-02T14:00" });
    expect(calendarEntries([...items, timed]).map((entry) => entry.id)).toEqual([
      "task-a",
      "task-b",
      "loose",
      "jazz",
      "sub-timed",
    ]);
  });

  it("keeps long-running tasks off the grid", () => {
    const long = item({ id: "long", kind: "task", parentId: "obj", start: "2026-09-01", end: "2026-09-30" });
    expect(calendarEntries([...items, long]).map((entry) => entry.id)).not.toContain("long");
  });
});

describe("nestedChildren", () => {
  it("keeps all-day work inside the parent card", () => {
    expect(nestedChildren("task-b", items).map((entry) => entry.id)).toEqual(["sub-2", "sub-1"]);
  });
});

describe("ancestorIds", () => {
  it("walks toward the root", () => {
    const byId = indexById(items);
    expect(ancestorIds(byId.get("sub-2-1")!, byId)).toEqual(["sub-2", "task-b", "obj"]);
  });
});

describe("childProgress", () => {
  it("counts direct children only, done = completed or cancelled", () => {
    expect(childProgress("obj", items)).toEqual({ done: 1, total: 2 });
    expect(childProgress("task-b", items)).toEqual({ done: 1, total: 2 });
    expect(childProgress("loose", items)).toEqual({ done: 0, total: 0 });
  });
});

describe("childrenOf", () => {
  it("sorts by start then creation", () => {
    expect(childrenOf("task-b", items).map((entry) => entry.id)).toEqual(["sub-2", "sub-1"]);
  });
});

describe("childNoun", () => {
  it("names children after the parent kind", () => {
    expect(childNoun("objective")).toBe("tasks");
    expect(childNoun("objective", 1)).toBe("task");
    expect(childNoun("task")).toBe("subtasks");
    expect(childNoun("task", 1)).toBe("subtask");
    expect(childNoun("event")).toBe("prep tasks");
  });
});
