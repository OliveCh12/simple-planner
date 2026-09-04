import { create } from "zustand";
import { savePlan } from "@/lib/db";
import type { HydratedPlan, Task } from "@/types";

interface PlanStore {
  currentPlan: HydratedPlan | null;
  isLoading: boolean;
  error: string | null;

  setCurrentPlan: (plan: HydratedPlan | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  updatePlan: (updates: Partial<Omit<HydratedPlan, "id" | "tasks">>) => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  reset: () => void;
}

async function persistCurrentPlan() {
  const plan = usePlanStore.getState().currentPlan;
  if (!plan) return;

  try {
    await savePlan(plan);
  } catch (error) {
    console.error("Failed to save plan:", error);
    usePlanStore.getState().setError("Failed to save plan");
    throw error;
  }
}

function nowIso() {
  return new Date().toISOString();
}

export const usePlanStore = create<PlanStore>((set) => ({
  currentPlan: null,
  isLoading: false,
  error: null,

  setCurrentPlan: (plan) => set({ currentPlan: plan, error: null }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  updatePlan: async (updates) => {
    set((state) => {
      if (!state.currentPlan) return state;
      return { currentPlan: { ...state.currentPlan, ...updates, updatedAt: nowIso() } };
    });
    await persistCurrentPlan();
  },

  addTask: async (task) => {
    set((state) => {
      if (!state.currentPlan) return state;
      const tasks = state.currentPlan.tasks.filter((item) => item.id !== task.id);
      return { currentPlan: { ...state.currentPlan, tasks: [...tasks, task], updatedAt: nowIso() } };
    });
    await persistCurrentPlan();
  },

  updateTask: async (taskId, updates) => {
    set((state) => {
      if (!state.currentPlan) return state;
      const updatedAt = nowIso();
      return {
        currentPlan: {
          ...state.currentPlan,
          tasks: state.currentPlan.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updates, updatedAt } : task
          ),
          updatedAt,
        },
      };
    });
    await persistCurrentPlan();
  },

  deleteTask: async (taskId) => {
    set((state) => {
      if (!state.currentPlan) return state;
      return {
        currentPlan: {
          ...state.currentPlan,
          tasks: state.currentPlan.tasks.filter((task) => task.id !== taskId),
          updatedAt: nowIso(),
        },
      };
    });
    await persistCurrentPlan();
  },

  reset: () =>
    set({
      currentPlan: null,
      isLoading: false,
      error: null,
    }),
}));
