"use client";

import { AllDayBand } from "@/components/timeline/AllDayBand";
import { TimeColumn } from "@/components/timeline/TimeColumn";
import { useVirtualColumns } from "@/hooks/useVirtualColumns";
import type { PlacedTask } from "@/lib/plan";
import type { TimeColumn as TimeColumnModel } from "@/lib/time/scale";

interface TimelineViewportProps {
  boardEl: HTMLDivElement | null;
  columns: TimeColumnModel[];
  /** Day columns backing the all-day band; empty unless at hour scale. */
  days: TimeColumnModel[];
  pitch: number;
  gap: number;
  columnTasks: PlacedTask[];
  allDayTasks: PlacedTask[];
  planId: string;
  selectedKey: string | null;
  todayIndex: number;
  dayIndexOf: (date: Date) => number;
  onSelect: (index: number) => void;
}

/**
 * Owns the virtual window so scrolling re-renders the visible columns only,
 * never the board chrome around them.
 */
export function TimelineViewport({
  boardEl,
  columns,
  days,
  pitch,
  gap,
  columnTasks,
  allDayTasks,
  planId,
  selectedKey,
  todayIndex,
  dayIndexOf,
  onSelect,
}: TimelineViewportProps) {
  const { from, to } = useVirtualColumns(boardEl, columns.length, pitch);
  const now = new Date();
  const hourly = days.length > 0;
  const leading = from > 0 ? from * pitch - gap : 0;
  const trailing = to < columns.length - 1 ? (columns.length - 1 - to) * pitch - gap : 0;
  const dayFrom = hourly && columns[from] ? dayIndexOf(columns[from].start) : 0;
  const dayTo = hourly && columns[to] ? dayIndexOf(columns[to].start) : -1;
  const todayDayIndex = hourly && todayIndex >= 0 ? dayIndexOf(columns[todayIndex].start) : -1;

  return (
    <div className="flex h-full min-w-max flex-col gap-3">
      {hourly && (
        <AllDayBand
          days={days}
          from={dayFrom}
          to={dayTo}
          pitch={pitch}
          gap={gap}
          tasks={allDayTasks}
          planId={planId}
          todayIndex={todayDayIndex}
        />
      )}
      <div className="flex min-h-0 flex-1 items-stretch" style={{ gap }}>
        {leading > 0 && <div aria-hidden className="shrink-0" style={{ width: leading }} />}
        {columns.slice(from, to + 1).map((column) => (
          <TimeColumn
            key={column.key}
            column={column}
            tasks={columnTasks}
            planId={planId}
            selected={column.key === selectedKey}
            current={column.index === todayIndex}
            past={column.end <= now}
            onSelect={onSelect}
          />
        ))}
        {trailing > 0 && <div aria-hidden className="shrink-0" style={{ width: trailing }} />}
      </div>
    </div>
  );
}
