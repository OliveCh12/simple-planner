"use client";

import { useMemo, useRef } from "react";
import { startOfYear } from "date-fns";
import { CalendarDay } from "@/components/calendar/CalendarDay";
import { CalendarMonth } from "@/components/calendar/CalendarMonth";
import { CalendarWeek } from "@/components/calendar/CalendarWeek";
import { CalendarYear } from "@/components/calendar/CalendarYear";
import { ObjectiveStrip } from "@/components/calendar/ObjectiveStrip";
import { useSwapMotion } from "@/hooks/useSwapMotion";
import {
  isCalendarActive,
  objectivesInRange,
  occurrencesInRange,
  visibleCalendarRange,
} from "@/lib/calendar";
import type { Category, PlanItem, TimeScale } from "@/types";

interface CalendarBoardProps {
  /** Entries that occupy the grid. Objectives are passed separately. */
  items: PlanItem[];
  /** Objectives to consider for the strip; filtered to the visible range here. */
  objectives?: PlanItem[];
  categories: Category[];
  scale: TimeScale;
  focus: Date;
  weekStartsOn: 0 | 1;
  selectedDay: Date;
  selectedHour?: number;
  onSelectDay: (day: Date, hour?: number) => void;
  onFocusMonth: (date: Date) => void;
  highlightId?: string | null;
  showCompleted?: boolean;
  showObjectives?: boolean;
}

export function CalendarBoard({
  items,
  objectives: objectiveSource = [],
  categories,
  scale,
  focus,
  weekStartsOn,
  selectedDay,
  selectedHour,
  onSelectDay,
  onFocusMonth,
  highlightId,
  showCompleted = false,
  showObjectives = true,
}: CalendarBoardProps) {
  const range = useMemo(
    () => visibleCalendarRange(scale === "hour" ? "day" : scale, focus, weekStartsOn),
    [scale, focus, weekStartsOn]
  );
  const objectives = useMemo(() => {
    const active = objectivesInRange(objectiveSource, range);
    return showCompleted ? active : active.filter((objective) => isCalendarActive(objective.status));
  }, [objectiveSource, range, showCompleted]);
  const occurrences = useMemo(() => {
    const dated = items.filter((item) => item.kind !== "objective");
    const visible = occurrencesInRange(dated, range, categories);
    return showCompleted ? visible : visible.filter((occurrence) => isCalendarActive(occurrence.status));
  }, [items, range, categories, showCompleted]);

  const strip = showObjectives ? (
    <ObjectiveStrip objectives={objectives} categories={categories} highlightId={highlightId} />
  ) : null;

  // A new period slides in from the side it came from; a new zoom breathes in.
  const rootRef = useRef<HTMLDivElement>(null);
  useSwapMotion(rootRef, `${scale}:${range.start.getTime()}`, (previous, next) => {
    const [previousScale, previousStart] = previous.split(":");
    const [nextScale, nextStart] = next.split(":");
    if (previousScale !== nextScale) return "zoom";
    return Number(nextStart) > Number(previousStart) ? "next" : "previous";
  });

  let view;
  if (scale === "year") {
    view = (
      <CalendarYear
        year={startOfYear(focus)}
        weekStartsOn={weekStartsOn}
        occurrences={occurrences}
        onFocusMonth={onFocusMonth}
      />
    );
  } else if (scale === "month") {
    view = (
      <CalendarMonth
        focus={focus}
        weekStartsOn={weekStartsOn}
        occurrences={occurrences}
        selectedDay={selectedDay}
        onSelectDay={(day) => onSelectDay(day)}
        highlightId={highlightId}
      />
    );
  } else if (scale === "week") {
    view = (
      <CalendarWeek
        focus={focus}
        weekStartsOn={weekStartsOn}
        occurrences={occurrences}
        selectedDay={selectedDay}
        onSelectDay={onSelectDay}
        highlightId={highlightId}
      />
    );
  } else {
    view = (
      <CalendarDay
        focus={focus}
        occurrences={occurrences}
        selectedHour={selectedHour}
        onSelectHour={(hour) => onSelectDay(focus, hour)}
        highlightId={highlightId}
      />
    );
  }

  return (
    <div ref={rootRef} className="flex min-h-0 flex-1 flex-col">
      {strip}
      {view}
    </div>
  );
}
