"use client";

import { useMemo } from "react";
import { startOfYear } from "date-fns";
import { CalendarDay } from "@/components/calendar/CalendarDay";
import { CalendarMonth } from "@/components/calendar/CalendarMonth";
import { CalendarWeek } from "@/components/calendar/CalendarWeek";
import { CalendarYear } from "@/components/calendar/CalendarYear";
import { isCalendarActive, occurrencesInRange, visibleCalendarRange } from "@/lib/calendar";
import type { Category, PlanItem, TimeScale } from "@/types";

interface CalendarBoardProps {
  items: PlanItem[];
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
}

export function CalendarBoard({
  items,
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
}: CalendarBoardProps) {
  const range = useMemo(
    () => visibleCalendarRange(scale === "hour" ? "day" : scale, focus, weekStartsOn),
    [scale, focus, weekStartsOn]
  );
  const occurrences = useMemo(() => {
    const visible = occurrencesInRange(items, range, categories);
    return showCompleted ? visible : visible.filter((occurrence) => isCalendarActive(occurrence.status));
  }, [items, range, categories, showCompleted]);

  if (scale === "year") {
    return (
      <CalendarYear
        year={startOfYear(focus)}
        weekStartsOn={weekStartsOn}
        occurrences={occurrences}
        onFocusMonth={onFocusMonth}
      />
    );
  }
  if (scale === "month") {
    return (
      <CalendarMonth
        focus={focus}
        weekStartsOn={weekStartsOn}
        occurrences={occurrences}
        selectedDay={selectedDay}
        onSelectDay={(day) => onSelectDay(day)}
        highlightId={highlightId}
      />
    );
  }
  if (scale === "week") {
    return (
      <CalendarWeek
        focus={focus}
        weekStartsOn={weekStartsOn}
        occurrences={occurrences}
        selectedDay={selectedDay}
        onSelectDay={onSelectDay}
        highlightId={highlightId}
      />
    );
  }
  return (
    <CalendarDay
      focus={focus}
      occurrences={occurrences}
      selectedHour={selectedHour}
      onSelectHour={(hour) => onSelectDay(focus, hour)}
      highlightId={highlightId}
    />
  );
}
