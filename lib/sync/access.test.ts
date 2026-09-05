import { describe, expect, it } from "vitest";
import { isItemReadOnly, isPlanWritable } from "@/lib/sync/access";
import type { Plan, PlanItem } from "@/types";

describe("calendar access", () => {
  it("treats a missing source as a writable local calendar", () => {
    expect(isPlanWritable({} as Plan)).toBe(true);
    expect(isPlanWritable({ source: { provider: "google", access: "readonly" } as const })).toBe(false);
  });

  it("locks only events on a read-only calendar, not planning items", () => {
    const plan = { source: { provider: "icloud" as const, access: "readonly" as const } };
    const event = { kind: "event" } as PlanItem;
    const task = { kind: "task" } as PlanItem;
    expect(isItemReadOnly(event, plan)).toBe(true);
    expect(isItemReadOnly(task, plan)).toBe(false);
  });
});
