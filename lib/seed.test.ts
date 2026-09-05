import { describe, expect, it } from "vitest";
import { AGENT_ID, DEFAULT_USER_ID } from "@/data/sampleData";
import { MemoryRepository } from "@/lib/repository/memory";
import { DEMO_EVENT_ID, DEMO_PLAN_ID, ensureDemoData } from "@/lib/seed";

describe("ensureDemoData", () => {
  it("seeds Olivier's plan with objectives, an event, recurrence and an AI task", async () => {
    const repo = new MemoryRepository();
    const { planId } = await ensureDemoData(repo);
    const plan = await repo.plans.get(planId);
    const items = await repo.items.listByPlan(DEMO_PLAN_ID);

    expect(plan).toMatchObject({ id: DEMO_PLAN_ID, title: "Olivier's plan" });
    expect(await repo.people.get(DEFAULT_USER_ID)).toMatchObject({
      email: "olivierchemla@gmail.com",
    });

    const byId = new Map(items.map((item) => [item.id, item]));
    expect(byId.get("obj-summer")).toMatchObject({ kind: "objective", categoryId: "cat-health" });
    expect(byId.get("task-gym")).toMatchObject({
      parentId: "obj-summer",
      recurrence: expect.stringContaining("BYDAY=MO,WE,FR"),
    });
    expect(byId.get(DEMO_EVENT_ID)).toMatchObject({
      kind: "event",
      location: { name: "Duc des Lombards" },
    });
    expect(byId.get("task-ai-launch")).toMatchObject({
      executor: "ai",
      assigneeIds: [AGENT_ID],
    });
    expect(byId.get("task-ai-launch")?.agentBrief).toMatch(/launch note/);
    expect(byId.get("task-visa")?.end).toBeUndefined();
    expect(byId.get("task-item-page")?.parentId).toBe("task-planner-v3");
    expect(byId.get("task-calendar-pass")?.parentId).toBe("task-planner-v3");
    expect(byId.get("task-sidebar")?.parentId).toBe("task-calendar-pass");
    expect(byId.get("event-family-lunch")).toMatchObject({
      kind: "event",
      categoryId: "cat-family",
    });
    expect(byId.get("event-ardeche")).toMatchObject({
      kind: "event",
      parentId: "obj-ardeche",
    });
    expect(byId.get("task-cottage")?.parentId).toBe("event-ardeche");
    expect(await repo.categories.get("cat-finance")).toMatchObject({ color: "#0d9488" });
    expect(byId.get("event-offsite")).toMatchObject({
      kind: "event",
      parentId: "obj-product",
      attendeeIds: [DEFAULT_USER_ID, "person-maya"],
    });
    expect(byId.get("event-offsite")?.end).toBeDefined();
    expect(byId.get("task-offsite-slides")?.parentId).toBe("event-offsite");
    expect(byId.get("event-weekly-review")?.recurrence).toContain("BYDAY=FR");
    expect(byId.get("task-planner-v3")?.notes).toContain("- [x] Item page");
    expect(byId.get("task-planner-v3")?.images?.[0]?.src.startsWith("data:image/svg+xml")).toBe(true);
    expect(byId.get("task-book-notes")?.parentId).toBe("obj-learn");
  });

  it("does not duplicate the demo plan on a second run", async () => {
    const repo = new MemoryRepository();
    await ensureDemoData(repo);
    await ensureDemoData(repo);
    expect(await repo.plans.list()).toHaveLength(1);
  });

  it("upgrades a career-only demo plan", async () => {
    const repo = new MemoryRepository();
    await ensureDemoData(repo);
    await repo.items.delete(DEMO_EVENT_ID);
    await ensureDemoData(repo);
    const items = await repo.items.listByPlan(DEMO_PLAN_ID);
    expect(items.some((item) => item.id === DEMO_EVENT_ID)).toBe(true);
  });
});
