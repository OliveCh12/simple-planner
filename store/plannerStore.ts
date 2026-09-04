import { create } from "zustand";
import { itemToTask, taskToItem } from "@/lib/domain/convert";
import { updatePlanRecord } from "@/lib/domain/plans";
import { getRepository } from "@/lib/repository/create";
import type { Category, Person, Plan, PlanItem, Task } from "@/types";

interface PlannerStore {
  currentPlan: Plan | null;
  items: PlanItem[];
  people: Person[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  loadPlan: (id: string | null) => Promise<void>;
  refresh: () => Promise<void>;
  updatePlan: (updates: Partial<Omit<Plan, "id" | "createdAt">>) => Promise<void>;
  putItem: (item: PlanItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
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

function upsertItem(items: PlanItem[], item: PlanItem): PlanItem[] {
  return [...items.filter((entry) => entry.id !== item.id), item];
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
    if (!state.currentPlan) return;
    if (
      change.collection === "items" ||
      change.collection === "plans" ||
      change.collection === "people" ||
      change.collection === "categories" ||
      change.op === "import" ||
      change.op === "clear"
    ) {
      void state.refresh();
    }
  });
}

export const usePlannerStore = create<PlannerStore>((set, get) => ({
  currentPlan: null,
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

      const [items, people, categories] = await Promise.all([
        repo().items.listByPlan(id),
        repo().people.list(),
        repo().categories.list(),
      ]);

      set({
        currentPlan: touched,
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
      set({ currentPlan: plan, items, people, categories, error: null });
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
    set({ currentPlan: next });
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
    const plan = updatePlanRecord(current, {});
    set({ currentPlan: plan, items: upsertItem(get().items, item) });
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
      items: [],
      people: [],
      categories: [],
      isLoading: false,
      error: null,
    }),
}));
