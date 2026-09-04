import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DB_NAME,
  PlannerDB,
  clearAllData,
  db,
  exportData,
  getDefaultSettings,
  getPlan,
  importData,
  savePlan,
} from "@/lib/db";
import { createTask } from "@/lib/plan";
import type { Plan } from "@/types";

const now = "2026-01-15T12:00:00.000Z";

function samplePlan(): Plan {
  return {
    id: "plan-1",
    title: "Career",
    start: "2026-01-01",
    end: "2026-12-31",
    tasks: [],
    createdAt: now,
    updatedAt: now,
    lastAccessedAt: now,
  };
}

afterEach(async () => {
  await db.plans.clear();
  await db.appSettings.clear();
});

describe("savePlan / getPlan", () => {
  it("persists a copy and does not mutate the input object", async () => {
    const plan = samplePlan();
    const originalUpdatedAt = plan.updatedAt;

    await savePlan(plan);

    expect(plan.updatedAt).toBe(originalUpdatedAt);

    const loaded = await getPlan(plan.id);
    expect(loaded?.title).toBe("Career");
    expect(loaded?.updatedAt).not.toBe(originalUpdatedAt);
  });
});

describe("importData", () => {
  it("rejects invalid JSON and does not wipe existing data", async () => {
    await savePlan(samplePlan());

    await expect(importData("{not-json")).rejects.toThrow(/not valid JSON/);
    await expect(getPlan("plan-1")).resolves.toMatchObject({ title: "Career" });
  });

  it("rejects an unexpected payload shape", async () => {
    await expect(importData(JSON.stringify({ version: 99, plans: [] }))).rejects.toThrow(
      /unexpected data shape|Invalid backup/
    );
  });

  it("replaces plans from a valid v2 backup", async () => {
    await savePlan(samplePlan());

    const incoming: Plan = {
      ...samplePlan(),
      id: "plan-2",
      title: "Health",
      tasks: [createTask({ title: "Run", start: "2026-03-01", end: "2026-03-05" })],
    };

    const settings = await importData(
      JSON.stringify({
        version: 2,
        plans: [incoming],
        settings: getDefaultSettings(),
      })
    );

    expect(settings.theme).toBe("auto");
    expect(settings.font).toBe("ubuntu");
    await expect(getPlan("plan-1")).resolves.toBeUndefined();
    await expect(getPlan("plan-2")).resolves.toMatchObject({ title: "Health" });
  });

  it("migrates a v1 backup into plans", async () => {
    await importData(
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

    const plan = await getPlan("roadmap-1");
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
      importData(
        JSON.stringify({
          version: 2,
          plans: [
            {
              ...samplePlan(),
              tasks: [createTask({ title: "Bad", start: "2026-13-01", end: "2026-13-02" })],
            },
          ],
          settings: getDefaultSettings(),
        })
      )
    ).rejects.toThrow(/unexpected data shape/);
  });
});

describe("importData font default", () => {
  it("defaults font when the backup omits it", async () => {
    const settings = await importData(
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

describe("exportData", () => {
  it("serializes plans and the provided settings as version 2", async () => {
    await savePlan(samplePlan());
    const json = await exportData({ ...getDefaultSettings(), theme: "dark" });
    const parsed = JSON.parse(json) as { version: number; settings: { theme: string }; plans: Plan[] };

    expect(parsed.version).toBe(2);
    expect(parsed.settings.theme).toBe("dark");
    expect(parsed.plans).toHaveLength(1);
  });
});

describe("clearAllData", () => {
  it("empties plans", async () => {
    await savePlan(samplePlan());
    await clearAllData();
    await expect(getPlan("plan-1")).resolves.toBeUndefined();
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
    expect(plans[0].tasks[0]).toMatchObject({ id: "o", title: "Migrated", start: "2025-01-05" });
    expect(upgraded.tables.map((table) => table.name).sort()).toEqual(["appSettings", "plans"]);
    expect(await upgraded.appSettings.get("default")).toMatchObject({ theme: "auto" });
    upgraded.close();
  });
});
