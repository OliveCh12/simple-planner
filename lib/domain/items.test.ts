import { describe, expect, it } from "vitest";
import { addSubtask, completeItem, createItem, DomainError, moveItem, setExecutor } from "@/lib/domain/items";

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
