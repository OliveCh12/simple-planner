import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { taskToItem } from "@/lib/domain/convert";
import { createPlanRecord } from "@/lib/domain/plans";
import { createTask } from "@/lib/plan";
import { exportJson, importJson } from "@/lib/repository/backup";
import { getRepository } from "@/lib/repository/create";
import { loadHydratedPlan } from "@/lib/repository/hydrate";
import { DB_NAME, PlannerDB } from "@/lib/repository/indexeddb";
import { getDefaultSettings } from "@/lib/settings";
import type { HydratedPlan, Plan } from "@/types";

const now = "2026-01-15T12:00:00.000Z";

function samplePlan(): Plan {
  return createPlanRecord({
    id: "plan-1",
    title: "Career",
    start: "2026-01-01",
    end: "2026-12-31",
  });
}

function sampleHydrated(): HydratedPlan {
  return { ...samplePlan(), tasks: [] };
}

async function saveHydrated(plan: HydratedPlan) {
  const { tasks, ...record } = plan;
  const repository = getRepository();
  await repository.plans.put({ ...record, updatedAt: new Date().toISOString() });
  if (tasks.length) {
    await repository.items.putMany(tasks.map((task) => taskToItem(task, record.id)));
  }
}

afterEach(async () => {
  await getRepository().clear();
});

describe("repository persistence", () => {
  it("persists a copy and does not mutate the input object", async () => {
    const plan = samplePlan();
    const originalUpdatedAt = plan.updatedAt;
    const stored = { ...plan, updatedAt: new Date().toISOString() };

    await getRepository().plans.put(stored);

    expect(plan.updatedAt).toBe(originalUpdatedAt);
    const loaded = await loadHydratedPlan(plan.id, getRepository());
    expect(loaded?.title).toBe("Career");
    expect(loaded?.updatedAt).not.toBe(originalUpdatedAt);
  });
});

describe("importJson", () => {
  it("rejects invalid JSON and does not wipe existing data", async () => {
    await saveHydrated(sampleHydrated());

    await expect(importJson("{not-json")).rejects.toThrow(/not valid JSON/);
    await expect(loadHydratedPlan("plan-1", getRepository())).resolves.toMatchObject({ title: "Career" });
  });

  it("rejects an unexpected payload shape", async () => {
    await expect(importJson(JSON.stringify({ version: 99, plans: [] }))).rejects.toThrow(
      /unexpected data shape|Invalid backup/
    );
  });

  it("replaces plans from a valid v2 backup", async () => {
    await saveHydrated(sampleHydrated());

    const incoming: HydratedPlan = {
      ...sampleHydrated(),
      id: "plan-2",
      title: "Health",
      tasks: [createTask({ title: "Run", start: "2026-03-01", end: "2026-03-05" })],
    };

    const settings = await importJson(
      JSON.stringify({
        version: 2,
        plans: [incoming],
        settings: getDefaultSettings(),
      })
    );

    expect(settings.theme).toBe("auto");
    expect(settings.font).toBe("ubuntu");
    await expect(loadHydratedPlan("plan-1", getRepository())).resolves.toBeUndefined();
    await expect(loadHydratedPlan("plan-2", getRepository())).resolves.toMatchObject({ title: "Health" });
  });

  it("migrates a v1 backup into plans", async () => {
    await importJson(
      JSON.stringify({
        version: 1,
        roadmaps: [
          {
            id: "roadmap-1",
            title: "Legacy",
            startYear: 2025,
            endYear: 2025,
            months: {
              "2025-03": {
                id: "m",
                year: 2025,
                month: 3,
                objectives: [
                  {
                    id: "o",
                    title: "Old objective",
                    description: "desc",
                    startDate: "2025-03-10",
                    endDate: "2025-04-02",
                    duration: 24,
                    energyLevel: "low",
                    priority: "low",
                    status: "in-progress",
                    tags: [],
                    progress: 40,
                    isPinned: false,
                    createdAt: now,
                    updatedAt: now,
                  },
                ],
                createdAt: now,
                updatedAt: now,
              },
            },
            createdAt: now,
            updatedAt: now,
            lastAccessedAt: now,
          },
        ],
        settings: getDefaultSettings(),
      })
    );

    const plan = await loadHydratedPlan("roadmap-1", getRepository());
    expect(plan).toMatchObject({ title: "Legacy", start: "2025-01-01", end: "2025-12-31" });
    expect(plan?.tasks).toEqual([
      expect.objectContaining({
        id: "o",
        title: "Old objective",
        notes: "desc",
        start: "2025-03-10",
        end: "2025-04-02",
        status: "in-progress",
        energy: "low",
      }),
    ]);
  });

  it("rejects tasks with malformed dates", async () => {
    await expect(
      importJson(
        JSON.stringify({
          version: 2,
          plans: [
            {
              ...sampleHydrated(),
              tasks: [createTask({ title: "Bad", start: "2026-13-01", end: "2026-13-02" })],
            },
          ],
          settings: getDefaultSettings(),
        })
      )
    ).rejects.toThrow(/unexpected data shape/);
  });
});

describe("importJson font default", () => {
  it("defaults font when the backup omits it", async () => {
    const settings = await importJson(
      JSON.stringify({
        version: 2,
        plans: [],
        settings: {
          theme: "dark",
          defaultView: "timeline",
          firstDayOfWeek: 1,
          dateFormat: "MMM d, yyyy",
          showWeekNumbers: false,
        },
      })
    );

    expect(settings.font).toBe("ubuntu");
    expect(settings.accent).toBe("green");
    expect(settings.theme).toBe("dark");
  });
});

describe("exportJson", () => {
  it("serializes plans, items and the provided settings as version 3", async () => {
    await saveHydrated({
      ...sampleHydrated(),
      tasks: [createTask({ title: "Run", start: "2026-03-01", end: "2026-03-05" })],
    });
    const json = await exportJson({ ...getDefaultSettings(), theme: "dark" });
    const parsed = JSON.parse(json) as {
      version: number;
      settings: { theme: string };
      plans: Array<{ tasks?: unknown }>;
      items: Array<{ title: string; kind: string; executor: string }>;
    };

    expect(parsed.version).toBe(3);
    expect(parsed.settings.theme).toBe("dark");
    expect(parsed.plans).toHaveLength(1);
    expect(parsed.plans[0]).not.toHaveProperty("tasks");
    expect(parsed.items).toEqual([
      expect.objectContaining({ title: "Run", kind: "task", executor: "human" }),
    ]);
  });
});

describe("clear", () => {
  it("empties plans", async () => {
    await saveHydrated(sampleHydrated());
    await getRepository().clear();
    await expect(loadHydratedPlan("plan-1", getRepository())).resolves.toBeUndefined();
  });
});

describe("IndexedDB upgrade from version 1", () => {
  const legacyName = `${DB_NAME}-upgrade-test`;

  beforeEach(async () => {
    await Dexie.delete(legacyName);
  });

  it("copies roadmaps into plans and drops the roadmaps table", async () => {
    const legacy = new Dexie(legacyName);
    legacy.version(1).stores({
      roadmaps: "id, category, createdAt, lastAccessedAt",
      appSettings: "id",
    });
    await legacy.table("roadmaps").add({
      id: "roadmap-1",
      title: "Legacy",
      startYear: 2025,
      endYear: 2026,
      months: {
        "2025-01": {
          id: "m",
          year: 2025,
          month: 1,
          objectives: [
            {
              id: "o",
              title: "Migrated",
              description: "",
              startDate: "2025-01-05",
              endDate: "2025-01-06",
              duration: 2,
              energyLevel: "medium",
              priority: "medium",
              status: "pending",
              tags: [],
              progress: 0,
              isPinned: false,
              createdAt: now,
              updatedAt: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
      },
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    });
    await legacy.table("appSettings").put({ ...getDefaultSettings(), id: "default" });
    legacy.close();

    const upgraded = new PlannerDB(legacyName);
    await upgraded.open();

    const plans = await upgraded.plans.toArray();
    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({ id: "roadmap-1", start: "2025-01-01", end: "2026-12-31" });
    expect(plans[0]).not.toHaveProperty("tasks");
    const items = await upgraded.items.toArray();
    expect(items).toEqual([
      expect.objectContaining({
        id: "o",
        planId: "roadmap-1",
        kind: "task",
        title: "Migrated",
        start: "2025-01-05",
        executor: "human",
        assigneeIds: [],
        attendeeIds: [],
      }),
    ]);
    expect(upgraded.tables.map((table) => table.name).sort()).toEqual([
      "appSettings",
      "categories",
      "items",
      "people",
      "plans",
    ]);
    expect(await upgraded.appSettings.get("default")).toMatchObject({ theme: "auto" });
    upgraded.close();
  });
});

describe("IndexedDB upgrade from version 3", () => {
  const legacyName = `${DB_NAME}-upgrade-v3-test`;

  beforeEach(async () => {
    await Dexie.delete(legacyName);
  });

  it("moves plan.tasks into the items table", async () => {
    const legacy = new Dexie(legacyName);
    legacy.version(1).stores({
      roadmaps: "id, category, createdAt, lastAccessedAt",
      appSettings: "id",
    });
    legacy.version(2).stores({ plans: "id, createdAt, lastAccessedAt" });
    legacy.version(3).stores({ roadmaps: null });
    await legacy.open();
    await legacy.table("plans").add({
      id: "plan-1",
      title: "Career",
      start: "2026-01-01",
      end: "2026-12-31",
      tasks: [createTask({ title: "Run", start: "2026-03-01", end: "2026-03-05" })],
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    });
    legacy.close();

    const upgraded = new PlannerDB(legacyName);
    await upgraded.open();
    const stored = await upgraded.plans.get("plan-1");
    expect(stored).not.toHaveProperty("tasks");
    const items = await upgraded.items.toArray();
    expect(items).toEqual([
      expect.objectContaining({ title: "Run", planId: "plan-1", kind: "task", executor: "human" }),
    ]);
    upgraded.close();
  });
});
