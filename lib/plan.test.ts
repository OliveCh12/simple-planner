import { describe, expect, it } from "vitest";
import { createTask, groupTasksByMonth, tasksInColumn } from "@/lib/plan";
import { columnsFor } from "@/lib/time/scale";
import type { Task } from "@/types";

function task(id: string, start: string, end: string, createdAt = "2027-01-01T00:00:00.000Z"): Task {
  return { ...createTask({ title: id, start, end }), id, createdAt };
}

const monday = { weekStartsOn: 1 as const };

describe("tasksInColumn", () => {
  const months = columnsFor("month", "2027-01-01", "2027-12-31", monday);
  const september = months[8];
  const october = months[9];

  const wholeYear = task("year", "2027-01-01", "2027-12-31");
  const late = task("late", "2027-09-20", "2027-10-05");
  const mid = task("mid", "2027-09-14", "2027-09-16");
  const first = task("first", "2027-09-01", "2027-09-30");
  const same = task("same", "2027-09-14", "2027-09-14", "2026-12-31T00:00:00.000Z");
  const elsewhere = task("elsewhere", "2027-11-01", "2027-11-02");
  const tasks = [late, mid, elsewhere, wholeYear, first, same];

  it("splits spanning from contained and sorts each chronologically", () => {
    const result = tasksInColumn(tasks, september);
    expect(result.spanning.map((t) => t.id)).toEqual(["year", "late"]);
    expect(result.contained.map((t) => t.id)).toEqual(["first", "same", "mid"]);
  });

  it("keeps the same spanning order in adjacent columns", () => {
    const result = tasksInColumn(tasks, october);
    expect(result.spanning.map((t) => t.id)).toEqual(["year", "late"]);
    expect(result.contained).toEqual([]);
  });

  it("orders spanning tasks by start, then longest first", () => {
    const short = task("short", "2027-08-01", "2027-09-15");
    const long = task("long", "2027-08-01", "2027-12-31");
    expect(tasksInColumn([short, long], september).spanning.map((t) => t.id)).toEqual([
      "long",
      "short",
    ]);
  });

  it("treats an all-day task ending the day before as outside", () => {
    const august = task("august", "2027-08-01", "2027-08-31");
    const result = tasksInColumn([august], september);
    expect(result.spanning).toEqual([]);
    expect(result.contained).toEqual([]);
  });

  it("contains timed tasks in hour columns", () => {
    const hours = columnsFor("hour", "2027-09-14", "2027-09-14", monday);
    const meeting = task("meeting", "2027-09-14T09:30", "2027-09-14T09:45");
    const long = task("long", "2027-09-14T09:30", "2027-09-14T11:00");
    expect(tasksInColumn([meeting, long], hours[9])).toEqual({
      spanning: [long],
      contained: [meeting],
    });
    expect(tasksInColumn([meeting, long], hours[10]).spanning).toEqual([long]);
    expect(tasksInColumn([meeting, long], hours[11])).toEqual({ spanning: [], contained: [] });
  });
});

describe("groupTasksByMonth", () => {
  it("groups by start month in first-seen order", () => {
    const groups = groupTasksByMonth([
      task("a", "2027-03-05", "2027-03-06"),
      task("b", "2027-01-10", "2027-01-12"),
      task("c", "2027-03-20", "2027-03-21"),
    ]);
    expect(groups.map((group) => [group.label, group.tasks.map((t) => t.id)])).toEqual([
      ["March", ["a", "c"]],
      ["January", ["b"]],
    ]);
  });
});
