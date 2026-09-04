import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getDefaultSettings } from "@/lib/db";
import type { AppSettings } from "@/types";

type ToastVariant = "error" | "success";

export interface AppToast {
  message: string;
  variant: ToastVariant;
}

interface UIStore {
  settings: AppSettings;
  toast: AppToast | null;
  updateSettings: (settings: Partial<AppSettings>) => void;
  replaceSettings: (settings: AppSettings) => void;
  notify: (message: string, variant?: ToastVariant) => void;
  clearToast: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      settings: getDefaultSettings(),
      toast: null,

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      replaceSettings: (settings) =>
        set({
          settings: { ...getDefaultSettings(), ...settings },
        }),

      notify: (message, variant = "error") => set({ toast: { message, variant } }),
      clearToast: () => set({ toast: null }),
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
