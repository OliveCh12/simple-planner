import { create } from "zustand";
import { itemToTask, taskToItem } from "@/lib/domain/convert";
import { isScheduled, isUnconfirmedDraft } from "@/lib/domain/items";
import { updatePlanRecord } from "@/lib/domain/plans";
import { getRepository } from "@/lib/repository/create";
import { useHistoryStore } from "@/store/historyStore";
import type { Category, Person, Plan, PlanItem, Task } from "@/types";

interface PlannerStore {
  currentPlan: Plan | null;
  /** `plan`: items of the open calendar. `all`: every item, for the Plan space. */
  scope: "plan" | "all";
  /** Every calendar, most recently opened first. For the switcher. */
  plans: Plan[];
  items: PlanItem[];
  people: Person[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  loadPlan: (id: string | null) => Promise<void>;
  /** Load every calendar's items at once. */
  loadAll: () => Promise<void>;
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

let suppressHistory = 0;

/** Run a replay (undo/redo) without recording it again. */
export async function withoutHistory<T>(run: () => Promise<T>): Promise<T> {
  suppressHistory += 1;
  try {
    return await run();
  } finally {
    suppressHistory -= 1;
  }
}

function recordHistory(label: string, undo: () => Promise<void>, redo: () => Promise<void>): void {
  if (suppressHistory > 0) return;
  useHistoryStore.getState().push({ label, undo, redo });
}

/** Short human label for an edit, from what actually changed. */
export function describeChange(previous: PlanItem, next: PlanItem): string {
  if (previous.start !== next.start || previous.end !== next.end) return `Move “${next.title || "item"}”`;
  if (previous.title !== next.title) return "Rename";
  if (previous.status !== next.status) return next.status === "completed" ? `Complete “${next.title}”` : "Change status";
  if (previous.parentId !== next.parentId) return "Change parent";
  if (previous.categoryId !== next.categoryId) return "Change category";
  if (previous.notes !== next.notes) return "Edit notes";
  if (previous.recurrence !== next.recurrence) return "Change repeat";
  if ((previous.recurrenceExceptions?.length ?? 0) !== (next.recurrenceExceptions?.length ?? 0)) {
    return `Skip an occurrence of “${next.title}”`;
  }
  return `Edit “${next.title || "item"}”`;
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
    if (!state.currentPlan && state.scope !== "all") return;
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
  scope: "plan",
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
    if (get().currentPlan?.id !== id) useHistoryStore.getState().clear();
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
        scope: "plan",
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

  loadAll: async () => {
    ensureSubscribed();
    set({ isLoading: true, error: null });
    if (get().scope !== "all") useHistoryStore.getState().clear();
    try {
      const [plans, loaded, people, categories] = await Promise.all([
        repo().plans.list(),
        repo().items.query({}),
        repo().people.list(),
        repo().categories.list(),
      ]);
      set({
        currentPlan: null,
        scope: "all",
        plans: sortPlans(plans),
        items: loaded.filter((item) => !isUnconfirmedDraft(item)),
        people,
        categories,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to load items:", error);
      set({ isLoading: false, error: "Failed to load items" });
    }
  },

  refresh: async () => {
    if (get().scope === "all") {
      refreshing = true;
      try {
        const [plans, items, people, categories] = await Promise.all([
          repo().plans.list(),
          repo().items.query({}),
          repo().people.list(),
          repo().categories.list(),
        ]);
        set({ plans: sortPlans(plans), items: withDrafts(items, get().items), people, categories, error: null });
      } catch (error) {
        console.error("Failed to refresh items:", error);
      } finally {
        refreshing = false;
      }
      return;
    }
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
    const owner = current?.id === item.planId ? current : get().plans.find((plan) => plan.id === item.planId);
    if (!current && get().scope !== "all") return;
    if (item.draft) {
      // Drafts live in memory only; they reach the repository once titled.
      set({ items: upsertById(get().items, item) });
      return;
    }
    const previous = get().items.find((entry) => entry.id === item.id);
    const plan = owner ? updatePlanRecord(owner, {}) : undefined;
    set({
      currentPlan: plan && current?.id === plan.id ? plan : current,
      plans: plan ? sortPlans(upsertById(get().plans, plan)) : get().plans,
      items: upsertById(get().items, item),
    });
    beginWrite();
    try {
      await repo().items.put(item);
      if (plan) await repo().plans.put(plan);
    } catch (error) {
      console.error("Failed to save item:", error);
      set({ error: "Failed to save plan" });
      throw error;
    } finally {
      endWrite();
    }
    const { putItem, deleteItem } = get();
    if (previous && !previous.draft) {
      recordHistory(
        describeChange(previous, item),
        () => withoutHistory(() => putItem(previous)),
        () => withoutHistory(() => putItem(item))
      );
    } else {
      recordHistory(
        `Create “${item.title || "item"}”`,
        () => withoutHistory(() => deleteItem(item.id)),
        () => withoutHistory(() => putItem(item))
      );
    }
  },

  deleteItem: async (id) => {
    const current = get().currentPlan;
    if (!current && get().scope !== "all") return;
    const existing = get().items.find((item) => item.id === id);
    if (existing?.draft) {
      set({ items: get().items.filter((item) => item.id !== id) });
      return;
    }
    const owner = existing
      ? current?.id === existing.planId
        ? current
        : get().plans.find((plan) => plan.id === existing.planId)
      : current;
    const plan = owner ? updatePlanRecord(owner, {}) : undefined;
    set({
      currentPlan: plan && current?.id === plan.id ? plan : current,
      plans: plan ? sortPlans(upsertById(get().plans, plan)) : get().plans,
      items: get().items.filter((item) => item.id !== id),
    });
    beginWrite();
    try {
      await repo().items.delete(id);
      if (plan) await repo().plans.put(plan);
    } catch (error) {
      console.error("Failed to delete item:", error);
      set({ error: "Failed to save plan" });
      throw error;
    } finally {
      endWrite();
    }
    if (existing) {
      const { putItem, deleteItem } = get();
      recordHistory(
        `Delete “${existing.title || "item"}”`,
        () => withoutHistory(() => putItem(existing)),
        () => withoutHistory(() => deleteItem(existing.id))
      );
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
    if (!existing || !isScheduled(existing)) return;
    const task = { ...itemToTask(existing), ...updates, updatedAt: nowIso() };
    await putItem(taskToItem(task, currentPlan.id, existing));
  },

  deleteTask: async (taskId) => {
    await get().deleteItem(taskId);
  },

  reset: () =>
    set({
      currentPlan: null,
      scope: "plan",
      plans: [],
      items: [],
      people: [],
      categories: [],
      isLoading: false,
      error: null,
    }),
}));
