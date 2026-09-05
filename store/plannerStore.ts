import { create } from "zustand";
import { itemToTask, taskToItem } from "@/lib/domain/convert";
import { isUnconfirmedDraft } from "@/lib/domain/items";
import { updatePlanRecord } from "@/lib/domain/plans";
import { getRepository } from "@/lib/repository/create";
import type { Category, Person, Plan, PlanItem, Task } from "@/types";

interface PlannerStore {
  currentPlan: Plan | null;
  /** Every calendar, most recently opened first. For the switcher. */
  plans: Plan[];
  items: PlanItem[];
  people: Person[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  loadPlan: (id: string | null) => Promise<void>;
  refresh: () => Promise<void>;
  loadDirectory: () => Promise<void>;
  loadPlans: () => Promise<void>;
  updatePlan: (updates: Partial<Omit<Plan, "id" | "createdAt">>) => Promise<void>;
  putItem: (item: PlanItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  putPerson: (person: Person) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  putCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  reset: () => void;
}

function nowIso() {
  return new Date().toISOString();
}

function repo() {
  return getRepository();
}

function upsertById<T extends { id: string }>(list: T[], entity: T): T[] {
  return [...list.filter((entry) => entry.id !== entity.id), entity];
}

/** Keep in-memory drafts across a repository refresh. */
function withDrafts(loaded: PlanItem[], previous: PlanItem[]): PlanItem[] {
  const drafts = previous.filter((item) => item.draft);
  if (drafts.length === 0) return loaded;
  const draftIds = new Set(drafts.map((item) => item.id));
  return [...loaded.filter((item) => !draftIds.has(item.id)), ...drafts];
}

function sortPlans(plans: Plan[]): Plan[] {
  return plans.slice().sort((a, b) => (a.lastAccessedAt < b.lastAccessedAt ? 1 : -1));
}

let unsubscribe: (() => void) | undefined;
let refreshing = false;
let muteWrites = 0;

function beginWrite() {
  muteWrites += 1;
}

function endWrite() {
  muteWrites = Math.max(0, muteWrites - 1);
}

function ensureSubscribed() {
  if (unsubscribe) return;
  unsubscribe = repo().subscribe((change) => {
    if (refreshing || muteWrites > 0) return;
    const state = usePlannerStore.getState();
    if (
      change.collection === "people" ||
      change.collection === "categories" ||
      change.op === "import" ||
      change.op === "clear"
    ) {
      void state.loadDirectory();
    }
    if (change.collection === "plans" || change.op === "import" || change.op === "clear") {
      void state.loadPlans();
    }
    if (!state.currentPlan) return;
    if (
      change.collection === "items" ||
      change.collection === "plans" ||
      change.op === "import" ||
      change.op === "clear"
    ) {
      void state.refresh();
    }
  });
}

export const usePlannerStore = create<PlannerStore>((set, get) => ({
  currentPlan: null,
  plans: [],
  items: [],
  people: [],
  categories: [],
  isLoading: false,
  error: null,

  loadPlan: async (id) => {
    ensureSubscribed();
    if (!id) {
      get().reset();
      return;
    }

    set({ isLoading: true, error: null });
    beginWrite();
    try {
      const plan = await repo().plans.get(id);
      if (!plan) {
        set({ currentPlan: null, items: [], isLoading: false, error: "Plan not found" });
        return;
      }

      const lastAccessedAt = nowIso();
      const touched = { ...plan, lastAccessedAt };
      await repo().plans.put(touched);

      const [loaded, people, categories] = await Promise.all([
        repo().items.listByPlan(id),
        repo().people.list(),
        repo().categories.list(),
      ]);
      const orphans = loaded.filter(isUnconfirmedDraft);
      const items = loaded.filter((item) => !isUnconfirmedDraft(item));
      await Promise.all(orphans.map((item) => repo().items.delete(item.id)));

      set({
        currentPlan: touched,
        plans: sortPlans(upsertById(get().plans, touched)),
        items,
        people,
        categories,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to load plan:", error);
      set({ isLoading: false, error: "Failed to load plan" });
    } finally {
      endWrite();
    }
  },

  refresh: async () => {
    const current = get().currentPlan;
    if (!current) return;
    refreshing = true;
    try {
      const [plan, items, people, categories] = await Promise.all([
        repo().plans.get(current.id),
        repo().items.listByPlan(current.id),
        repo().people.list(),
        repo().categories.list(),
      ]);
      if (!plan) {
        set({ currentPlan: null, items: [], error: "Plan not found" });
        return;
      }
      set({ currentPlan: plan, items: withDrafts(items, get().items), people, categories, error: null });
    } catch (error) {
      console.error("Failed to refresh plan:", error);
    } finally {
      refreshing = false;
    }
  },

  updatePlan: async (updates) => {
    const current = get().currentPlan;
    if (!current) return;
    const next = updatePlanRecord(current, updates);
    set({ currentPlan: next, plans: sortPlans(upsertById(get().plans, next)) });
    beginWrite();
    try {
      await repo().plans.put(next);
    } catch (error) {
      console.error("Failed to save plan:", error);
      set({ error: "Failed to save plan" });
      throw error;
    } finally {
      endWrite();
    }
  },

  putItem: async (item) => {
    const current = get().currentPlan;
    if (!current) return;
    if (item.draft) {
      // Drafts live in memory only; they reach the repository once titled.
      set({ items: upsertById(get().items, item) });
      return;
    }
    const plan = updatePlanRecord(current, {});
    set({ currentPlan: plan, items: upsertById(get().items, item) });
    beginWrite();
    try {
      await repo().items.put(item);
      await repo().plans.put(plan);
    } catch (error) {
      console.error("Failed to save item:", error);
      set({ error: "Failed to save plan" });
      throw error;
    } finally {
      endWrite();
    }
  },

  deleteItem: async (id) => {
    const current = get().currentPlan;
    if (!current) return;
    if (get().items.find((item) => item.id === id)?.draft) {
      set({ items: get().items.filter((item) => item.id !== id) });
      return;
    }
    const plan = updatePlanRecord(current, {});
    set({
      currentPlan: plan,
      items: get().items.filter((item) => item.id !== id),
    });
    beginWrite();
    try {
      await repo().items.delete(id);
      await repo().plans.put(plan);
    } catch (error) {
      console.error("Failed to delete item:", error);
      set({ error: "Failed to save plan" });
      throw error;
    } finally {
      endWrite();
    }
  },

  loadDirectory: async () => {
    ensureSubscribed();
    try {
      const [people, categories] = await Promise.all([repo().people.list(), repo().categories.list()]);
      set({ people, categories });
    } catch (error) {
      console.error("Failed to load people and categories:", error);
    }
  },

  loadPlans: async () => {
    ensureSubscribed();
    try {
      set({ plans: sortPlans(await repo().plans.list()) });
    } catch (error) {
      console.error("Failed to load calendars:", error);
    }
  },

  putPerson: async (person) => {
    beginWrite();
    try {
      await repo().people.put(person);
      set({ people: upsertById(get().people, person) });
    } catch (error) {
      console.error("Failed to save person:", error);
      throw error;
    } finally {
      endWrite();
    }
  },

  deletePerson: async (id) => {
    beginWrite();
    try {
      await repo().people.delete(id);
      set({ people: get().people.filter((person) => person.id !== id) });
    } catch (error) {
      console.error("Failed to delete person:", error);
      throw error;
    } finally {
      endWrite();
    }
  },

  putCategory: async (category) => {
    beginWrite();
    try {
      await repo().categories.put(category);
      set({ categories: upsertById(get().categories, category) });
    } catch (error) {
      console.error("Failed to save category:", error);
      throw error;
    } finally {
      endWrite();
    }
  },

  deleteCategory: async (id) => {
    beginWrite();
    try {
      await repo().categories.delete(id);
      set({ categories: get().categories.filter((category) => category.id !== id) });
    } catch (error) {
      console.error("Failed to delete category:", error);
      throw error;
    } finally {
      endWrite();
    }
  },

  addTask: async (task) => {
    const { currentPlan, items, putItem } = get();
    if (!currentPlan) return;
    const existing = items.find((item) => item.id === task.id);
    await putItem(taskToItem(task, currentPlan.id, existing));
  },

  updateTask: async (taskId, updates) => {
    const { currentPlan, items, putItem } = get();
    if (!currentPlan) return;
    const existing = items.find((item) => item.id === taskId);
    if (!existing) return;
    const task = { ...itemToTask(existing), ...updates, updatedAt: nowIso() };
    await putItem(taskToItem(task, currentPlan.id, existing));
  },

  deleteTask: async (taskId) => {
    await get().deleteItem(taskId);
  },

  reset: () =>
    set({
      currentPlan: null,
      plans: [],
      items: [],
      people: [],
      categories: [],
      isLoading: false,
      error: null,
    }),
}));
