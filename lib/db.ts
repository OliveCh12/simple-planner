import Dexie, { type EntityTable } from "dexie";
import type { AppData, AppSettings, Plan } from "@/types";
import { DEFAULT_ACCENT } from "@/lib/themes";
import { migrateRoadmapToPlan, type LegacyRoadmap } from "@/lib/migrations";
import { parseAppData } from "@/lib/validation";

/** IndexedDB database name. Kept from v1 so existing data is found and migrated. */
export const DB_NAME = "RoadmapDB";

export class PlannerDB extends Dexie {
  plans!: EntityTable<Plan, "id">;
  appSettings!: EntityTable<AppSettings & { id: string }, "id">;

  constructor(name = DB_NAME) {
    super(name);

    this.version(1).stores({
      roadmaps: "id, category, createdAt, lastAccessedAt",
      appSettings: "id",
    });

    this.version(2)
      .stores({ plans: "id, createdAt, lastAccessedAt" })
      .upgrade(async (tx) => {
        const roadmaps = (await tx.table("roadmaps").toArray()) as LegacyRoadmap[];
        await tx.table("plans").bulkAdd(roadmaps.map(migrateRoadmapToPlan));
      });

    this.version(3).stores({ roadmaps: null });
  }
}

export const db = new PlannerDB();

export function getDefaultSettings(): AppSettings {
  return {
    theme: "auto",
    accent: DEFAULT_ACCENT,
    font: "ubuntu",
    defaultView: "timeline",
    firstDayOfWeek: 1,
    dateFormat: "MMM d, yyyy",
    showWeekNumbers: false,
  };
}

export async function getAllPlans(): Promise<Plan[]> {
  return db.plans.orderBy("lastAccessedAt").reverse().toArray();
}

export async function getPlan(id: string): Promise<Plan | undefined> {
  return db.plans.get(id);
}

export async function savePlan(plan: Plan): Promise<string> {
  const toSave: Plan = {
    ...plan,
    tasks: [...plan.tasks],
    updatedAt: new Date().toISOString(),
  };
  await db.plans.put(toSave);
  return toSave.id;
}

export async function deletePlan(id: string): Promise<void> {
  await db.plans.delete(id);
}

export async function touchPlan(id: string): Promise<void> {
  await db.plans.update(id, {
    lastAccessedAt: new Date().toISOString(),
  });
}

export async function exportData(settings: AppSettings = getDefaultSettings()): Promise<string> {
  const plans = await db.plans.toArray();

  const payload: AppData = {
    version: 2,
    plans,
    settings,
    lastExport: new Date().toISOString(),
  };

  return JSON.stringify(payload, null, 2);
}

export async function importData(jsonString: string): Promise<AppSettings> {
  const data = parseAppData(jsonString);

  await db.transaction("rw", db.plans, db.appSettings, async () => {
    await db.plans.clear();
    await db.plans.bulkAdd(data.plans);
    await db.appSettings.put({ ...data.settings, id: "default" });
  });

  return data.settings;
}

export async function clearAllData(): Promise<void> {
  await db.transaction("rw", db.plans, db.appSettings, async () => {
    await db.plans.clear();
    await db.appSettings.clear();
  });
}

export async function downloadBackup(settings: AppSettings): Promise<void> {
  const json = await exportData(settings);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `timeline-planner-backup-${new Date().toISOString().split("T")[0]}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
