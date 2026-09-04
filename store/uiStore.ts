import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getDefaultSettings } from "@/lib/db";
import type { AppSettings } from "@/types";

export type TimelineView = "gantt" | "calendar";

interface UIStore {
  settings: AppSettings;
  timelineView: TimelineView;
  setTimelineView: (view: TimelineView) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  replaceSettings: (settings: AppSettings) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      settings: getDefaultSettings(),
      timelineView: "gantt",
      setTimelineView: (timelineView) => set({ timelineView }),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      replaceSettings: (settings) =>
        set({
          settings: { ...getDefaultSettings(), ...settings },
        }),
    }),
    {
      name: "planner-ui-storage",
      partialize: (state) => ({ settings: state.settings, timelineView: state.timelineView }),
      merge: (persisted, current) => {
        const stored = persisted as Partial<UIStore> | undefined;
        return {
          ...current,
          ...stored,
          settings: {
            ...getDefaultSettings(),
            ...current.settings,
            ...stored?.settings,
          },
          timelineView: stored?.timelineView === "calendar" ? "calendar" : "gantt",
        };
      },
    }
  )
);
