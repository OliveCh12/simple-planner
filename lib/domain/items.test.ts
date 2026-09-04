import { describe, expect, it } from "vitest";
import {
  addSubtask,
  applyStatus,
  completeItem,
  createItem,
  DomainError,
  excludeOccurrence,
  moveItem,
  setExecutor,
  setKind,
  setParent,
  splitOccurrence,
} from "@/lib/domain/items";
import { expandRecurrence } from "@/lib/time/recurrence";

describe("createItem", () => {
  it("defaults a human task", () => {
    const item = createItem({
      planId: "plan-1",
      title: "  Run  ",
      start: "2026-06-01",
      end: "2026-06-02",
    });
    expect(item).toMatchObject({
      planId: "plan-1",
      kind: "task",
      title: "Run",
      notes: "",
      start: "2026-06-01",
      end: "2026-06-02",
      status: "pending",
      energy: "medium",
      executor: "human",
      assigneeIds: [],
      attendeeIds: [],
    });
  });

  it("rejects an event with a parent", () => {
    expect(() =>
      createItem({
        planId: "plan-1",
        title: "Jazz",
        start: "2026-06-01T20:00",
        kind: "event",
        parentId: "obj-1",
      })
    ).toThrow(DomainError);
  });

  it("rejects an inverted range", () => {
    expect(() =>
      createItem({
        planId: "plan-1",
        title: "Backwards",
        start: "2026-06-10",
        end: "2026-06-01",
      })
    ).toThrow(/end must not be before start/);
  });
});

describe("item commands", () => {
  const task = createItem({
    planId: "plan-1",
    title: "Draft",
    start: "2026-06-01",
    end: "2026-06-03",
  });

  it("completes, moves and sets the executor", () => {
    expect(completeItem(task).status).toBe("completed");
    expect(completeItem(task).completedAt).toBeTruthy();
    expect(applyStatus(completeItem(task), "pending")).toMatchObject({
      status: "pending",
    });
    expect(moveItem(task, "2026-07-01", "2026-07-03")).toMatchObject({
      start: "2026-07-01",
      end: "2026-07-03",
    });
    expect(setExecutor(task, "ai").executor).toBe("ai");
  });

  it("adds a subtask under a task and refuses an event parent", () => {
    const child = addSubtask(task, { title: "Outline", start: "2026-06-01" });
    expect(child.parentId).toBe(task.id);
    expect(child.kind).toBe("task");

    const event = createItem({
      planId: "plan-1",
      title: "Show",
      start: "2026-06-01T20:00",
      kind: "event",
    });
    expect(() => addSubtask(event, { title: "Nope", start: "2026-06-01" })).toThrow(/cannot have children/);
  });
});

describe("setParent / setKind", () => {
  const objective = createItem({
    planId: "plan-1",
    title: "Body",
    start: "2026-06-01",
    kind: "objective",
  });
  const task = createItem({
    planId: "plan-1",
    title: "Gym",
    start: "2026-06-01",
  });
  const child = addSubtask(task, { title: "Warm-up", start: "2026-06-01" });

  it("nests a task under an objective and rejects a cycle", () => {
    const nested = setParent(task, objective.id, [objective, task, child]);
    expect(nested.parentId).toBe(objective.id);
    expect(() => setParent(objective, child.id, [objective, nested, child])).toThrow(/descendant/);
  });

  it("rejects turning a parent into an event", () => {
    expect(() => setKind(task, "event", [task, child])).toThrow(/cannot have children/);
  });
});

describe("splitOccurrence", () => {
  const gym = createItem({
    planId: "plan-1",
    title: "Gym",
    start: "2026-06-01T07:00",
    end: "2026-06-01T08:00",
    recurrence: "FREQ=DAILY;COUNT=5",
  });

  it("excludes the occurrence from the series and copies it as a standalone item", () => {
    const { series, detached } = splitOccurrence(gym, "2026-06-03T07:00");
    expect(series.recurrenceExceptions).toEqual(["2026-06-03T07:00"]);
    expect(detached.recurrence).toBeUndefined();
    expect(detached.start).toBe("2026-06-03T07:00");
    expect(detached.end).toBe("2026-06-03T08:00");
    expect(detached.title).toBe("Gym");
    const starts = expandRecurrence(series, {
      start: new Date(2026, 5, 1),
      end: new Date(2026, 5, 10),
    }).map((occurrence) => occurrence.start);
    expect(starts).not.toContain("2026-06-03T07:00");
    expect(starts).toContain("2026-06-01T07:00");
  });

  it("refuses to split a non-recurring item", () => {
    expect(() => excludeOccurrence(createItem({
      planId: "plan-1",
      title: "Once",
      start: "2026-06-01",
    }), "2026-06-01")).toThrow(/not recurring/);
  });
});
