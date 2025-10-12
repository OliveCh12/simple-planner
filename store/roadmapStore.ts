import { create } from 'zustand';
import type { Roadmap, MonthBlock, Objective } from '@/types';

interface RoadmapStore {
  // Current state
  currentRoadmap: Roadmap | null;
  selectedMonthKey: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentRoadmap: (roadmap: Roadmap | null) => void;
  updateRoadmap: (roadmap: Roadmap) => void;
  setSelectedMonth: (monthKey: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Month operations
  addMonth: (monthKey: string, month: MonthBlock) => void;
  updateMonth: (monthKey: string, updates: Partial<MonthBlock>) => void;
  
  // Objective operations
  addObjective: (monthKey: string, objective: Objective) => void;
  updateObjective: (monthKey: string, objectiveId: string, updates: Partial<Objective>) => void;
  deleteObjective: (monthKey: string, objectiveId: string) => void;
  
  // Reset
  reset: () => void;
}

export const useRoadmapStore = create<RoadmapStore>((set) => ({
  currentRoadmap: null,
  selectedMonthKey: null,
  isLoading: false,
  error: null,
  
  setCurrentRoadmap: (roadmap) => set({ currentRoadmap: roadmap, error: null }),
  
  updateRoadmap: (roadmap) => set({ currentRoadmap: roadmap }),
  
  setSelectedMonth: (monthKey) => set({ selectedMonthKey: monthKey }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  addMonth: (monthKey, month) => set((state) => {
    if (!state.currentRoadmap) return state;
    
    return {
      currentRoadmap: {
        ...state.currentRoadmap,
        months: {
          ...state.currentRoadmap.months,
          [monthKey]: month
        },
        updatedAt: new Date().toISOString()
      }
    };
  }),
  
  updateMonth: (monthKey, updates) => set((state) => {
    if (!state.currentRoadmap) return state;
    
    const month = state.currentRoadmap.months[monthKey];
    if (!month) return state;
    
    return {
      currentRoadmap: {
        ...state.currentRoadmap,
        months: {
          ...state.currentRoadmap.months,
          [monthKey]: {
            ...month,
            ...updates,
            updatedAt: new Date().toISOString()
          }
        },
        updatedAt: new Date().toISOString()
      }
    };
  }),
  
  addObjective: (monthKey, objective) => set((state) => {
    if (!state.currentRoadmap) return state;
    
    const month = state.currentRoadmap.months[monthKey];
    if (!month) return state;
    
    return {
      currentRoadmap: {
        ...state.currentRoadmap,
        months: {
          ...state.currentRoadmap.months,
          [monthKey]: {
            ...month,
            objectives: [...month.objectives, objective],
            updatedAt: new Date().toISOString()
          }
        },
        updatedAt: new Date().toISOString()
      }
    };
  }),
  
  updateObjective: (monthKey, objectiveId, updates) => set((state) => {
    if (!state.currentRoadmap) return state;
    
    const month = state.currentRoadmap.months[monthKey];
    if (!month) return state;
    
    return {
      currentRoadmap: {
        ...state.currentRoadmap,
        months: {
          ...state.currentRoadmap.months,
          [monthKey]: {
            ...month,
            objectives: month.objectives.map(obj =>
              obj.id === objectiveId
                ? { ...obj, ...updates, updatedAt: new Date().toISOString() }
                : obj
            ),
            updatedAt: new Date().toISOString()
          }
        },
        updatedAt: new Date().toISOString()
      }
    };
  }),
  
  deleteObjective: (monthKey, objectiveId) => set((state) => {
    if (!state.currentRoadmap) return state;
    
    const month = state.currentRoadmap.months[monthKey];
    if (!month) return state;
    
    return {
      currentRoadmap: {
        ...state.currentRoadmap,
        months: {
          ...state.currentRoadmap.months,
          [monthKey]: {
            ...month,
            objectives: month.objectives.filter(obj => obj.id !== objectiveId),
            updatedAt: new Date().toISOString()
          }
        },
        updatedAt: new Date().toISOString()
      }
    };
  }),
  
  reset: () => set({
    currentRoadmap: null,
    selectedMonthKey: null,
    isLoading: false,
    error: null
  })
}));
