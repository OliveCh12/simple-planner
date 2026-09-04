import Dexie, { type EntityTable } from "dexie";
import type { AppData, AppSettings, Category, HydratedPlan, Person, Plan, PlanItem } from "@/types";
import { DEFAULT_ACCENT } from "@/lib/themes";
import { itemToTask, taskToItem } from "@/lib/domain/convert";
import { migratePlansToItems, migrateRoadmapToPlan, type LegacyRoadmap, type PlanV2 } from "@/lib/migrations";
import { parseAppData } from "@/lib/validation";

/** IndexedDB database name. Kept from v1 so existing data is found and migrated. */
export const DB_NAME = "RoadmapDB";

export class PlannerDB extends Dexie {
  plans!: EntityTable<Plan, "id">;
  items!: EntityTable<PlanItem, "id">;
  people!: EntityTable<Person, "id">;
  categories!: EntityTable<Category, "id">;
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

    this.version(4)
      .stores({
        plans: "id, createdAt, lastAccessedAt",
        items: "id, planId, parentId, start, kind, executor, status, categoryId",
        people: "id",
        categories: "id",
      })
      .upgrade(async (tx) => {
        const plans = (await tx.table("plans").toArray()) as PlanV2[];
        const migrated = migratePlansToItems(plans);
        await tx.table("plans").clear();
        if (migrated.plans.length) await tx.table("plans").bulkAdd(migrated.plans);
        if (migrated.items.length) await tx.table("items").bulkAdd(migrated.items);
      });
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

function hydratePlan(plan: Plan, items: PlanItem[]): HydratedPlan {
  return {
    ...plan,
    tasks: items.filter((item) => item.kind === "task").map(itemToTask),
  };
}

export async function getAllPlans(): Promise<HydratedPlan[]> {
  const [plans, items] = await Promise.all([db.plans.toArray(), db.items.toArray()]);
  const byPlan = new Map<string, PlanItem[]>();
  for (const item of items) {
    const list = byPlan.get(item.planId);
    if (list) list.push(item);
    else byPlan.set(item.planId, [item]);
  }
  return plans
    .sort((a, b) => (a.lastAccessedAt < b.lastAccessedAt ? 1 : -1))
    .map((plan) => hydratePlan(plan, byPlan.get(plan.id) ?? []));
}

export async function getPlan(id: string): Promise<HydratedPlan | undefined> {
  const plan = await db.plans.get(id);
  if (!plan) return undefined;
  const items = await db.items.where("planId").equals(id).toArray();
  return hydratePlan(plan, items);
}

export async function savePlan(plan: HydratedPlan): Promise<string> {
  const { tasks, ...record } = plan;
  const stored: Plan = { ...record, updatedAt: new Date().toISOString() };

  await db.transaction("rw", db.plans, db.items, async () => {
    const existing = await db.items.where("planId").equals(plan.id).toArray();
    const existingById = new Map(existing.map((item) => [item.id, item]));
    const taskIds = new Set(tasks.map((task) => task.id));

    await db.plans.put(stored);

    const toPut = tasks.map((task) => taskToItem(task, plan.id, existingById.get(task.id)));
    if (toPut.length) await db.items.bulkPut(toPut);

    const stale = existing.filter((item) => item.kind === "task" && !taskIds.has(item.id));
    await Promise.all(stale.map((item) => db.items.delete(item.id)));
  });

  return stored.id;
}

export async function deletePlan(id: string): Promise<void> {
  await db.transaction("rw", db.plans, db.items, async () => {
    await db.plans.delete(id);
    await db.items.where("planId").equals(id).delete();
  });
}

export async function touchPlan(id: string): Promise<void> {
  await db.plans.update(id, {
    lastAccessedAt: new Date().toISOString(),
  });
}

export async function exportData(settings: AppSettings = getDefaultSettings()): Promise<string> {
  const [plans, items, people, categories] = await Promise.all([
    db.plans.toArray(),
    db.items.toArray(),
    db.people.toArray(),
    db.categories.toArray(),
  ]);

  const payload: AppData = {
    version: 3,
    plans,
    items,
    people,
    categories,
    settings,
    lastExport: new Date().toISOString(),
  };

  return JSON.stringify(payload, null, 2);
}

export async function importData(jsonString: string): Promise<AppSettings> {
  const data = parseAppData(jsonString);

  await db.transaction("rw", db.plans, db.items, db.people, db.categories, db.appSettings, async () => {
    await db.plans.clear();
    await db.items.clear();
    await db.people.clear();
    await db.categories.clear();
    if (data.plans.length) await db.plans.bulkAdd(data.plans);
    if (data.items.length) await db.items.bulkAdd(data.items);
    if (data.people.length) await db.people.bulkAdd(data.people);
    if (data.categories.length) await db.categories.bulkAdd(data.categories);
    await db.appSettings.put({ ...data.settings, id: "default" });
  });

  return data.settings;
}

export async function clearAllData(): Promise<void> {
  await db.transaction("rw", db.plans, db.items, db.people, db.categories, db.appSettings, async () => {
    await db.plans.clear();
    await db.items.clear();
    await db.people.clear();
    await db.categories.clear();
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
