"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CalendarCommit } from "@/hooks/useCalendarPointer";
import type { PlanItem } from "@/types";

export interface CalendarUiValue {
  selectedId: string | null;
  onSelect: (itemId: string, occurrenceStart?: string) => void;
  onMoveItem: (commit: CalendarCommit) => void;
  expandedIds: ReadonlySet<string>;
  onToggleExpand: (itemId: string) => void;
  showSubtasks: boolean;
  canCreate?: boolean;
  onCreateSlot?: (start: string, end?: string) => void;
  /** An unscheduled item waiting for a click on the grid. */
  placing?: PlanItem | null;
  onPlace?: (item: PlanItem | null) => void;
}

const CalendarUiContext = createContext<CalendarUiValue | null>(null);

export function CalendarUiProvider({
  value,
  children,
}: {
  value: CalendarUiValue;
  children: ReactNode;
}) {
  return <CalendarUiContext.Provider value={value}>{children}</CalendarUiContext.Provider>;
}

export function useCalendarUi(): CalendarUiValue | null {
  return useContext(CalendarUiContext);
}
