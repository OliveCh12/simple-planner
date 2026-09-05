import Dexie, { type EntityTable } from "dexie";
import type { AppData, AppSettings, Category, Person, Plan, PlanItem } from "@/types";
import { migratePlansToItems, migrateRoadmapToPlan, type LegacyRoadmap, type PlanV2 } from "@/lib/migrations";
import { itemMatches } from "@/lib/repository/filter";
import type { CrudCollection, ItemFilter, PlannerRepository, RepositoryChange } from "@/lib/repository/types";
import { DB_NAME, getDefaultSettings, normalizeSettings } from "@/lib/settings";

export { DB_NAME };

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

export class IndexedDbRepository implements PlannerRepository {
  private listeners = new Set<(change: RepositoryChange) => void>();
  people: CrudCollection<Person>;
  categories: CrudCollection<Category>;

  constructor(private database: PlannerDB = db) {
    this.people = {
      list: () => this.database.people.toArray(),
      get: (id) => this.database.people.get(id),
      put: async (entity) => {
        await this.database.people.put(entity);
        this.notify({ collection: "people", op: "put", ids: [entity.id] });
      },
      delete: async (id) => {
        await this.database.people.delete(id);
        this.notify({ collection: "people", op: "delete", ids: [id] });
      },
    };
    this.categories = {
      list: () => this.database.categories.toArray(),
      get: (id) => this.database.categories.get(id),
      put: async (entity) => {
        await this.database.categories.put(entity);
        this.notify({ collection: "categories", op: "put", ids: [entity.id] });
      },
      delete: async (id) => {
        await this.database.categories.delete(id);
        this.notify({ collection: "categories", op: "delete", ids: [id] });
      },
    };
  }

  private notify(change: RepositoryChange) {
    for (const listener of this.listeners) listener(change);
  }

  plans = {
    list: () => this.database.plans.toArray(),
    get: (id: string) => this.database.plans.get(id),
    put: async (plan: Plan) => {
      await this.database.plans.put(plan);
      this.notify({ collection: "plans", op: "put", ids: [plan.id] });
    },
    delete: async (id: string) => {
      const orphans = await this.database.items.where("planId").equals(id).primaryKeys();
      await this.database.transaction("rw", this.database.plans, this.database.items, async () => {
        await this.database.plans.delete(id);
        await this.database.items.where("planId").equals(id).delete();
      });
      this.notify({ collection: "plans", op: "delete", ids: [id] });
      if (orphans.length) this.notify({ collection: "items", op: "delete", ids: orphans.map(String) });
    },
  };

  items = {
    listByPlan: (planId: string) => this.database.items.where("planId").equals(planId).toArray(),
    query: async (filter: ItemFilter) => {
      const source = filter.planId
        ? await this.database.items.where("planId").equals(filter.planId).toArray()
        : await this.database.items.toArray();
      return source.filter((item) => itemMatches(item, filter));
    },
    get: (id: string) => this.database.items.get(id),
    put: async (item: PlanItem) => {
      await this.database.items.put(item);
      this.notify({ collection: "items", op: "put", ids: [item.id] });
    },
    putMany: async (items: PlanItem[]) => {
      if (items.length === 0) return;
      await this.database.items.bulkPut(items);
      this.notify({ collection: "items", op: "put", ids: items.map((item) => item.id) });
    },
    delete: async (id: string) => {
      await this.database.items.delete(id);
      this.notify({ collection: "items", op: "delete", ids: [id] });
    },
  };

  settings = {
    get: async () => {
      const row = await this.database.appSettings.get("default");
      if (!row) return undefined;
      const stored: Partial<AppSettings> & { id?: string } = { ...row };
      delete stored.id;
      return normalizeSettings(stored);
    },
    put: async (settings: AppSettings) => {
      await this.database.appSettings.put({ ...settings, id: "default" });
      this.notify({ collection: "settings", op: "put" });
    },
  };

  async exportAll(): Promise<AppData> {
    const [plans, items, people, categories, settings] = await Promise.all([
      this.plans.list(),
      this.database.items.toArray(),
      this.people.list(),
      this.categories.list(),
      this.settings.get(),
    ]);
    return {
      version: 3,
      plans,
      items,
      people,
      categories,
      settings: settings ?? getDefaultSettings(),
    };
  }

  async importAll(data: AppData): Promise<void> {
    await this.database.transaction(
      "rw",
      this.database.plans,
      this.database.items,
      this.database.people,
      this.database.categories,
      this.database.appSettings,
      async () => {
        await this.database.plans.clear();
        await this.database.items.clear();
        await this.database.people.clear();
        await this.database.categories.clear();
        if (data.plans.length) await this.database.plans.bulkAdd(data.plans);
        if (data.items.length) await this.database.items.bulkAdd(data.items);
        if (data.people.length) await this.database.people.bulkAdd(data.people);
        if (data.categories.length) await this.database.categories.bulkAdd(data.categories);
        await this.database.appSettings.put({ ...data.settings, id: "default" });
      }
    );
    this.notify({ collection: "plans", op: "import", ids: data.plans.map((plan) => plan.id) });
  }

  async clear(): Promise<void> {
    await this.database.transaction(
      "rw",
      this.database.plans,
      this.database.items,
      this.database.people,
      this.database.categories,
      this.database.appSettings,
      async () => {
        await this.database.plans.clear();
        await this.database.items.clear();
        await this.database.people.clear();
        await this.database.categories.clear();
        await this.database.appSettings.clear();
      }
    );
    this.notify({ collection: "plans", op: "clear" });
  }

  subscribe(listener: (change: RepositoryChange) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
