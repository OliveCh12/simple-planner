import { getDefaultSettings } from "@/lib/db";
import { intervalOf, parseLocal } from "@/lib/time/local";
import type { AppData, AppSettings, Category, Person, Plan, PlanItem } from "@/types";
import type { CrudCollection, ItemFilter, PlannerRepository, RepositoryChange } from "@/lib/repository/types";

function matchesList<T>(value: T, filter: T | T[] | undefined): boolean {
  if (filter === undefined) return true;
  return Array.isArray(filter) ? filter.includes(value) : filter === value;
}

export function itemMatches(item: PlanItem, filter: ItemFilter): boolean {
  if (filter.planId !== undefined && item.planId !== filter.planId) return false;
  if (!matchesList(item.kind, filter.kind)) return false;
  if (!matchesList(item.executor, filter.executor)) return false;
  if (!matchesList(item.status, filter.status)) return false;
  if (filter.parentId !== undefined) {
    if (filter.parentId === null && item.parentId !== undefined) return false;
    if (filter.parentId !== null && item.parentId !== filter.parentId) return false;
  }
  if (filter.categoryId !== undefined && item.categoryId !== filter.categoryId) return false;
  if (filter.assigneeId !== undefined && !item.assigneeIds.includes(filter.assigneeId)) return false;
  if (filter.attendeeId !== undefined && !item.attendeeIds.includes(filter.attendeeId)) return false;
  if (filter.query) {
    const q = filter.query.toLowerCase();
    if (!item.title.toLowerCase().includes(q) && !item.notes.toLowerCase().includes(q)) return false;
  }
  if (filter.from !== undefined || filter.to !== undefined) {
    const range = {
      start: filter.from ? parseLocal(filter.from) : new Date(-8640000000000000),
      end: filter.to ? parseLocal(filter.to) : new Date(8640000000000000),
    };
    const interval = intervalOf(item);
    if (interval.end <= range.start || interval.start >= range.end) return false;
  }
  return true;
}

function crudMap<T extends { id: string }>(
  store: Map<string, T>,
  notify: (change: RepositoryChange) => void,
  collection: RepositoryChange["collection"]
): CrudCollection<T> {
  return {
    async list() {
      return [...store.values()];
    },
    async get(id) {
      return store.get(id);
    },
    async put(entity) {
      store.set(entity.id, entity);
      notify({ collection, op: "put", ids: [entity.id] });
    },
    async delete(id) {
      store.delete(id);
      notify({ collection, op: "delete", ids: [id] });
    },
  };
}

export class MemoryRepository implements PlannerRepository {
  private planRecords = new Map<string, Plan>();
  private itemRecords = new Map<string, PlanItem>();
  private peopleMap = new Map<string, Person>();
  private categoriesMap = new Map<string, Category>();
  private currentSettings: AppSettings | undefined;
  private listeners = new Set<(change: RepositoryChange) => void>();

  people: CrudCollection<Person>;
  categories: CrudCollection<Category>;

  constructor() {
    this.people = crudMap(this.peopleMap, (change) => this.notify(change), "people");
    this.categories = crudMap(this.categoriesMap, (change) => this.notify(change), "categories");
  }

  private notify(change: RepositoryChange) {
    for (const listener of this.listeners) listener(change);
  }

  plans = {
    list: async () => [...this.planRecords.values()],
    get: async (id: string) => this.planRecords.get(id),
    put: async (plan: Plan) => {
      this.planRecords.set(plan.id, plan);
      this.notify({ collection: "plans", op: "put", ids: [plan.id] });
    },
    delete: async (id: string) => {
      this.planRecords.delete(id);
      const orphanIds: string[] = [];
      for (const [itemId, item] of this.itemRecords) {
        if (item.planId === id) {
          this.itemRecords.delete(itemId);
          orphanIds.push(itemId);
        }
      }
      this.notify({ collection: "plans", op: "delete", ids: [id] });
      if (orphanIds.length) this.notify({ collection: "items", op: "delete", ids: orphanIds });
    },
  };

  items = {
    listByPlan: async (planId: string) => [...this.itemRecords.values()].filter((item) => item.planId === planId),
    query: async (filter: ItemFilter) => [...this.itemRecords.values()].filter((item) => itemMatches(item, filter)),
    get: async (id: string) => this.itemRecords.get(id),
    put: async (item: PlanItem) => {
      this.itemRecords.set(item.id, item);
      this.notify({ collection: "items", op: "put", ids: [item.id] });
    },
    putMany: async (items: PlanItem[]) => {
      for (const item of items) this.itemRecords.set(item.id, item);
      this.notify({ collection: "items", op: "put", ids: items.map((item) => item.id) });
    },
    delete: async (id: string) => {
      this.itemRecords.delete(id);
      this.notify({ collection: "items", op: "delete", ids: [id] });
    },
  };

  settings = {
    get: async () => this.currentSettings,
    put: async (settings: AppSettings) => {
      this.currentSettings = settings;
      this.notify({ collection: "settings", op: "put" });
    },
  };

  async exportAll(): Promise<AppData> {
    return {
      version: 3,
      plans: await this.plans.list(),
      items: [...this.itemRecords.values()],
      people: await this.people.list(),
      categories: await this.categories.list(),
      settings: this.currentSettings ?? getDefaultSettings(),
    };
  }

  async importAll(data: AppData): Promise<void> {
    this.planRecords.clear();
    this.itemRecords.clear();
    this.peopleMap.clear();
    this.categoriesMap.clear();
    for (const plan of data.plans) this.planRecords.set(plan.id, plan);
    for (const item of data.items) this.itemRecords.set(item.id, item);
    for (const person of data.people) this.peopleMap.set(person.id, person);
    for (const category of data.categories) this.categoriesMap.set(category.id, category);
    this.currentSettings = data.settings;
    this.notify({ collection: "plans", op: "import", ids: data.plans.map((plan) => plan.id) });
  }

  async clear(): Promise<void> {
    this.planRecords.clear();
    this.itemRecords.clear();
    this.peopleMap.clear();
    this.categoriesMap.clear();
    this.currentSettings = undefined;
    this.notify({ collection: "plans", op: "clear" });
  }

  subscribe(listener: (change: RepositoryChange) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
