import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clampPanelWidth, PANEL_WIDTH } from "@/lib/layout/panel";
import type { EnvironmentSettings } from "@/lib/environment/types";
import type { GroupBy, SortBy, TaskFilter } from "@/lib/planning/views";
import { getDefaultSettings, normalizeSettings } from "@/lib/settings";
import type { AppSettings } from "@/types";

/** A filter set the user named, for the Plan space. */
export interface SavedView {
  id: string;
  name: string;
  filter: TaskFilter;
  groupBy: GroupBy;
  sortBy: SortBy;
}

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
  /** Calendar new captures go to when no calendar is open. */
  captureCalendarId: string | null;
  savedViews: SavedView[];
  setCaptureCalendarId: (id: string | null) => void;
  addSavedView: (view: SavedView) => void;
  removeSavedView: (id: string) => void;
  setTimelineView: (view: TimelineView) => void;
  setPanelWidth: (side: keyof PanelWidths, width: number) => void;
  setLeftPanelOpen: (open: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateEnvironment: (patch: Partial<EnvironmentSettings>) => void;
  replaceSettings: (settings: AppSettings) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      settings: getDefaultSettings(),
      timelineView: "calendar",
      panelWidths: { left: PANEL_WIDTH.left, right: PANEL_WIDTH.right },
      leftPanelOpen: true,
      captureCalendarId: null,
      savedViews: [],
      setCaptureCalendarId: (captureCalendarId) => set({ captureCalendarId }),
      addSavedView: (view) => set((state) => ({ savedViews: [...state.savedViews.filter((entry) => entry.id !== view.id), view] })),
      removeSavedView: (id) => set((state) => ({ savedViews: state.savedViews.filter((entry) => entry.id !== id) })),
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

      updateEnvironment: (patch) =>
        set((state) => ({
          settings: { ...state.settings, environment: { ...state.settings.environment, ...patch } },
        })),

      replaceSettings: (settings) =>
        set({
          settings: normalizeSettings(settings),
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
        captureCalendarId: state.captureCalendarId,
        savedViews: state.savedViews,
      }),
      // v1: the calendar became the main view; reset the stored view once.
      migrate: (persisted, version) => {
        const stored = (persisted ?? {}) as Partial<
          Pick<UIStore, "settings" | "timelineView" | "panelWidths" | "leftPanelOpen" | "captureCalendarId" | "savedViews">
        >;
        return {
          settings: normalizeSettings(stored.settings),
          timelineView: version < 1 ? "calendar" : (stored.timelineView ?? "calendar"),
          panelWidths: {
            left: stored.panelWidths?.left ?? PANEL_WIDTH.left,
            right: stored.panelWidths?.right ?? PANEL_WIDTH.right,
          },
          leftPanelOpen: stored.leftPanelOpen ?? true,
          captureCalendarId: stored.captureCalendarId ?? null,
          savedViews: stored.savedViews ?? [],
        };
      },
      merge: (persisted, current) => {
        const stored = persisted as Partial<UIStore> | undefined;
        return {
          ...current,
          ...stored,
          settings: normalizeSettings({ ...current.settings, ...stored?.settings }),
          timelineView: stored?.timelineView === "gantt" ? "gantt" : "calendar",
          panelWidths: {
            left: stored?.panelWidths?.left ?? current.panelWidths.left,
            right: stored?.panelWidths?.right ?? current.panelWidths.right,
          },
          leftPanelOpen: stored?.leftPanelOpen ?? current.leftPanelOpen,
          captureCalendarId: stored?.captureCalendarId ?? null,
          savedViews: Array.isArray(stored?.savedViews) ? stored.savedViews : [],
        };
      },
    }
  )
);
