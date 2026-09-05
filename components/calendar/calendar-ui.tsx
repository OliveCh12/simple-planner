"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CalendarCommit } from "@/hooks/useCalendarPointer";

export interface CalendarUiValue {
  selectedId: string | null;
  onSelect: (itemId: string, occurrenceStart?: string) => void;
  onMoveItem: (commit: CalendarCommit) => void;
  expandedIds: ReadonlySet<string>;
  onToggleExpand: (itemId: string) => void;
  showSubtasks: boolean;
  canCreate?: boolean;
  onCreateSlot?: (start: string, end?: string) => void;
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
