import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getDefaultSettings } from "@/lib/db";
import type { AppSettings } from "@/types";

interface UIStore {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  replaceSettings: (settings: AppSettings) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      settings: getDefaultSettings(),

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
      partialize: (state) => ({ settings: state.settings }),
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
        };
      },
    }
  )
);
