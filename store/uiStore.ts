import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clampPanelWidth, PANEL_WIDTH } from "@/lib/layout/panel";
import { getDefaultSettings } from "@/lib/settings";
import type { AppSettings } from "@/types";

/** `gantt` is the roadmap view; the stored value is kept for compatibility. */
export type TimelineView = "gantt" | "calendar";

export interface PanelWidths {
  left: number;
  right: number;
}

interface UIStore {
  settings: AppSettings;
  timelineView: TimelineView;
  panelWidths: PanelWidths;
  leftPanelOpen: boolean;
  setTimelineView: (view: TimelineView) => void;
  setPanelWidth: (side: keyof PanelWidths, width: number) => void;
  setLeftPanelOpen: (open: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  replaceSettings: (settings: AppSettings) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      settings: getDefaultSettings(),
      timelineView: "calendar",
      panelWidths: { left: PANEL_WIDTH.left, right: PANEL_WIDTH.right },
      leftPanelOpen: true,
      setTimelineView: (timelineView) => set({ timelineView }),
      setPanelWidth: (side, width) =>
        set((state) => ({
          panelWidths: { ...state.panelWidths, [side]: clampPanelWidth(width) },
        })),
      setLeftPanelOpen: (leftPanelOpen) => set({ leftPanelOpen }),

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
      version: 3,
      partialize: (state) => ({
        settings: state.settings,
        timelineView: state.timelineView,
        panelWidths: state.panelWidths,
        leftPanelOpen: state.leftPanelOpen,
      }),
      // v1: the calendar became the main view; reset the stored view once.
      migrate: (persisted, version) => {
        const stored = (persisted ?? {}) as Partial<
          Pick<UIStore, "settings" | "timelineView" | "panelWidths" | "leftPanelOpen">
        >;
        return {
          settings: { ...getDefaultSettings(), ...stored.settings },
          timelineView: version < 1 ? "calendar" : (stored.timelineView ?? "calendar"),
          panelWidths: {
            left: stored.panelWidths?.left ?? PANEL_WIDTH.left,
            right: stored.panelWidths?.right ?? PANEL_WIDTH.right,
          },
          leftPanelOpen: stored.leftPanelOpen ?? true,
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
          panelWidths: {
            left: stored?.panelWidths?.left ?? current.panelWidths.left,
            right: stored?.panelWidths?.right ?? current.panelWidths.right,
          },
          leftPanelOpen: stored?.leftPanelOpen ?? current.leftPanelOpen,
        };
      },
    }
  )
);
