import { describe, expect, it } from "vitest";
import { DEFAULT_USER_ID } from "@/data/sampleData";
import { MemoryRepository } from "@/lib/repository/memory";
import { DEMO_PLAN_ID, ensureDemoData } from "@/lib/seed";

describe("ensureDemoData", () => {
  it("upserts Olivier Chemla and a career plan", async () => {
    const repo = new MemoryRepository();
    const { planId } = await ensureDemoData(repo);

    expect(planId).toBe(DEMO_PLAN_ID);
    const olivier = await repo.people.get(DEFAULT_USER_ID);
    expect(olivier).toMatchObject({
      name: "Olivier Chemla",
      email: "olivierchemla@gmail.com",
      kind: "human",
    });
    const items = await repo.items.listByPlan(DEMO_PLAN_ID);
    expect(items.length).toBeGreaterThan(10);
    expect(items.every((item) => item.assigneeIds.includes(DEFAULT_USER_ID))).toBe(true);
  });

  it("does not duplicate the demo plan on a second run", async () => {
    const repo = new MemoryRepository();
    await ensureDemoData(repo);
    await ensureDemoData(repo);
    expect(await repo.plans.list()).toHaveLength(1);
  });
});
