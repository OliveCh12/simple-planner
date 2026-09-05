import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getDefaultSettings } from "@/lib/settings";
import type { AppSettings } from "@/types";

/** `gantt` is the roadmap view; the stored value is kept for compatibility. */
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
      timelineView: "calendar",
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
      version: 1,
      partialize: (state) => ({ settings: state.settings, timelineView: state.timelineView }),
      // v1: the calendar became the main view; reset the stored view once.
      migrate: (persisted, version) => {
        const stored = (persisted ?? {}) as Partial<Pick<UIStore, "settings" | "timelineView">>;
        return {
          settings: { ...getDefaultSettings(), ...stored.settings },
          timelineView: version < 1 ? "calendar" : (stored.timelineView ?? "calendar"),
        };
      },
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
          timelineView: stored?.timelineView === "gantt" ? "gantt" : "calendar",
        };
      },
    }
  )
);
