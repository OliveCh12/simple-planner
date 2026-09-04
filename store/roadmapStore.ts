import { create } from "zustand";
import { saveRoadmap } from "@/lib/db";
import { createMonthBlock } from "@/lib/objective";
import type { Objective, Roadmap } from "@/types";

interface RoadmapStore {
  currentRoadmap: Roadmap | null;
  isLoading: boolean;
  error: string | null;

  setCurrentRoadmap: (roadmap: Roadmap | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  addObjective: (monthKey: string, objective: Objective, index?: number) => Promise<void>;
  updateObjective: (
    monthKey: string,
    objectiveId: string,
    updates: Partial<Objective>
  ) => Promise<void>;
  deleteObjective: (monthKey: string, objectiveId: string) => Promise<void>;
  moveObjective: (
    fromMonth: string,
    toMonth: string,
    objective: Objective
  ) => Promise<void>;

  reset: () => void;
}

async function persistCurrentRoadmap() {
  const roadmap = useRoadmapStore.getState().currentRoadmap;
  if (!roadmap) return;

  try {
    await saveRoadmap(roadmap);
  } catch (error) {
    console.error("Failed to save roadmap:", error);
    useRoadmapStore.getState().setError("Failed to save roadmap");
    throw error;
  }
}

function nowIso() {
  return new Date().toISOString();
}

export const useRoadmapStore = create<RoadmapStore>((set) => ({
  currentRoadmap: null,
  isLoading: false,
  error: null,

  setCurrentRoadmap: (roadmap) => set({ currentRoadmap: roadmap, error: null }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  addObjective: async (monthKey, objective, index) => {
    set((state) => {
      if (!state.currentRoadmap) return state;

      const month = state.currentRoadmap.months[monthKey];
      const updatedAt = nowIso();
      const objectives = month ? [...month.objectives] : [];
      objectives.splice(index ?? objectives.length, 0, objective);

      return {
        currentRoadmap: {
          ...state.currentRoadmap,
          months: {
            ...state.currentRoadmap.months,
            [monthKey]: month
              ? { ...month, objectives, updatedAt }
              : createMonthBlock(monthKey, objectives),
          },
          updatedAt,
        },
      };
    });

    await persistCurrentRoadmap();
  },

  updateObjective: async (monthKey, objectiveId, updates) => {
    set((state) => {
      if (!state.currentRoadmap) return state;

      const month = state.currentRoadmap.months[monthKey];
      if (!month) return state;

      const updatedAt = nowIso();

      return {
        currentRoadmap: {
          ...state.currentRoadmap,
          months: {
            ...state.currentRoadmap.months,
            [monthKey]: {
              ...month,
              objectives: month.objectives.map((obj) =>
                obj.id === objectiveId ? { ...obj, ...updates, updatedAt } : obj
              ),
              updatedAt,
            },
          },
          updatedAt,
        },
      };
    });

    await persistCurrentRoadmap();
  },

  deleteObjective: async (monthKey, objectiveId) => {
    set((state) => {
      if (!state.currentRoadmap) return state;

      const month = state.currentRoadmap.months[monthKey];
      if (!month) return state;

      const updatedAt = nowIso();

      return {
        currentRoadmap: {
          ...state.currentRoadmap,
          months: {
            ...state.currentRoadmap.months,
            [monthKey]: {
              ...month,
              objectives: month.objectives.filter((obj) => obj.id !== objectiveId),
              updatedAt,
            },
          },
          updatedAt,
        },
      };
    });

    await persistCurrentRoadmap();
  },

  moveObjective: async (fromMonth, toMonth, objective) => {
    set((state) => {
      if (!state.currentRoadmap) return state;
      if (fromMonth === toMonth) return state;

      const sourceMonth = state.currentRoadmap.months[fromMonth];
      if (!sourceMonth) return state;

      const updatedAt = nowIso();
      const targetMonth = state.currentRoadmap.months[toMonth];
      const remaining = sourceMonth.objectives.filter((obj) => obj.id !== objective.id);

      return {
        currentRoadmap: {
          ...state.currentRoadmap,
          months: {
            ...state.currentRoadmap.months,
            [fromMonth]: {
              ...sourceMonth,
              objectives: remaining,
              updatedAt,
            },
            [toMonth]: targetMonth
              ? {
                  ...targetMonth,
                  objectives: [...targetMonth.objectives, objective],
                  updatedAt,
                }
              : createMonthBlock(toMonth, [objective]),
          },
          updatedAt,
        },
      };
    });

    await persistCurrentRoadmap();
  },

  reset: () =>
    set({
      currentRoadmap: null,
      isLoading: false,
      error: null,
    }),
}));
