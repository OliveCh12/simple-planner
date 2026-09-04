import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { getDefaultSettings, PlannerDB } from "@/lib/db";
import { createItem } from "@/lib/domain/items";
import { createPlanRecord } from "@/lib/domain/plans";
import { IndexedDbRepository } from "@/lib/repository/indexeddb";
import { MemoryRepository } from "@/lib/repository/memory";
import type { PlannerRepository } from "@/lib/repository/types";
import { NotConfiguredError } from "@/lib/repository/types";
import { RemoteRepository } from "@/lib/repository/remote";
import type { Plan, PlanItem } from "@/types";

function samplePlan(id = "plan-1"): Plan {
  return createPlanRecord({
    id,
    title: "Career",
    start: "2026-01-01",
    end: "2026-12-31",
  });
}

function sampleItem(planId = "plan-1"): PlanItem {
  return createItem({
    id: "item-1",
    planId,
    title: "Run",
    start: "2026-03-01",
    end: "2026-03-05",
  });
}

function contract(name: string, setup: () => Promise<{ repo: PlannerRepository; teardown: () => Promise<void> }>) {
  describe(name, () => {
    let repo: PlannerRepository;
    let teardown: () => Promise<void>;

    afterEach(async () => {
      await teardown();
    });

    async function boot() {
      const ctx = await setup();
      repo = ctx.repo;
      teardown = ctx.teardown;
    }

    it("round-trips a plan and its items", async () => {
      await boot();
      const plan = samplePlan();
      const item = sampleItem();
      await repo.plans.put(plan);
      await repo.items.put(item);

      await expect(repo.plans.get(plan.id)).resolves.toMatchObject({ title: "Career" });
      await expect(repo.items.listByPlan(plan.id)).resolves.toEqual([expect.objectContaining({ title: "Run" })]);
    });

    it("queries by executor, range and text", async () => {
      await boot();
      await repo.plans.put(samplePlan());
      await repo.items.putMany([
        createItem({ id: "a", planId: "plan-1", title: "Human", start: "2026-03-01", executor: "human" }),
        createItem({
          id: "b",
          planId: "plan-1",
          title: "Draft blog",
          notes: "for the agent",
          start: "2026-04-01",
          executor: "ai",
        }),
      ]);

      const ai = await repo.items.query({ planId: "plan-1", executor: "ai" });
      expect(ai.map((item) => item.id)).toEqual(["b"]);

      const march = await repo.items.query({ from: "2026-03-01", to: "2026-04-01" });
      expect(march.map((item) => item.id)).toEqual(["a"]);

      const search = await repo.items.query({ query: "blog" });
      expect(search.map((item) => item.id)).toEqual(["b"]);
    });

    it("cascades item delete when a plan is removed", async () => {
      await boot();
      await repo.plans.put(samplePlan());
      await repo.items.put(sampleItem());
      await repo.plans.delete("plan-1");
      await expect(repo.items.get("item-1")).resolves.toBeUndefined();
    });

    it("notifies subscribers after a write", async () => {
      await boot();
      const seen: string[] = [];
      const stop = repo.subscribe((change) => seen.push(change.collection));
      await repo.plans.put(samplePlan());
      expect(seen).toContain("plans");
      stop();
    });

    it("exports and reimports version 3", async () => {
      await boot();
      await repo.plans.put(samplePlan());
      await repo.items.put(sampleItem());
      await repo.people.put({ id: "p1", name: "Ada", kind: "human" });
      await repo.categories.put({ id: "c1", name: "Health", color: "#0f0" });
      await repo.settings.put(getDefaultSettings());

      const exported = await repo.exportAll();
      expect(exported.version).toBe(3);
      expect(exported.plans[0]).not.toHaveProperty("tasks");
      expect(exported.items).toHaveLength(1);

      await repo.clear();
      await expect(repo.plans.list()).resolves.toEqual([]);

      await repo.importAll(exported);
      await expect(repo.plans.get("plan-1")).resolves.toMatchObject({ title: "Career" });
      await expect(repo.people.get("p1")).resolves.toMatchObject({ name: "Ada" });
    });
  });
}

contract("MemoryRepository", async () => {
  const repo = new MemoryRepository();
  return { repo, teardown: async () => repo.clear() };
});

contract("IndexedDbRepository", async () => {
  const name = `repo-contract-${crypto.randomUUID()}`;
  const database = new PlannerDB(name);
  await database.open();
  const repo = new IndexedDbRepository(database);
  return {
    repo,
    teardown: async () => {
      database.close();
      await Dexie.delete(name);
    },
  };
});

describe("RemoteRepository", () => {
  it("throws NotConfiguredError", async () => {
    const repo = new RemoteRepository();
    await expect(repo.plans.list()).rejects.toBeInstanceOf(NotConfiguredError);
  });
});
