"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { columnLabel } from "@/lib/time/labels";
import { xOf, type TimeLayout } from "@/lib/time/layout";
import type { TimeColumn } from "@/lib/time/scale";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";

interface TimelineHeaderProps {
  layout: TimeLayout;
  units: TimeColumn[];
  majorUnits: TimeColumn[];
  now: Date;
  nowX: number;
  todayKey: string | null;
  onSelectUnit: (index: number) => void;
}

export function TimelineHeader({
  layout,
  units,
  majorUnits,
  now,
  nowX,
  todayKey,
  onSelectUnit,
}: TimelineHeaderProps) {
  const weekStartsOn = useUIStore((s) => s.settings.firstDayOfWeek);
  const showWeekNumbers = useUIStore((s) => s.settings.showWeekNumbers);
  const options = { weekStartsOn, showWeekNumbers };
  const twoLevel = majorUnits.length > 0;
  const nowOnCanvas = nowX >= 0 && nowX <= layout.totalWidth;

  return (
    <div className="relative shrink-0 border-b border-border/50" style={{ height: twoLevel ? 52 : 36 }}>
      {twoLevel &&
        majorUnits.map((unit) => {
          const left = Math.max(0, xOf(layout, unit.start));
          const right = Math.min(layout.totalWidth, xOf(layout, unit.end));
          const width = Math.max(0, right - left);
          if (width <= 0) return null;
          const label = columnLabel(unit, options);
          return (
            <div
              key={unit.key}
              className="absolute top-0 overflow-hidden px-1.5 pt-1 text-[11px] font-medium text-muted-foreground"
              style={{ left, width }}
            >
              <span className="sticky left-1 inline-block max-w-full truncate">
                {unit.scale === "month" ? `${label.title} ${label.eyebrow ?? ""}`.trim() : label.title}
              </span>
            </div>
          );
        })}

      {units.map((unit) => {
        const left = xOf(layout, unit.start);
        const width = xOf(layout, unit.end) - left;
        const label = columnLabel(unit, options);
        const current = unit.key === todayKey;
        return (
          <button
            key={unit.key}
            type="button"
            onClick={() => onSelectUnit(unit.index)}
            className={cn(
              "absolute truncate px-1.5 text-left text-xs font-medium leading-tight",
              twoLevel ? "top-6" : "top-1.5",
              current ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            style={{ left, width }}
          >
            <span className="inline-flex items-center gap-1">
              {current && unit.scale === "day" ? (
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  {format(unit.start, "d")}
                </span>
              ) : (
                label.title
              )}
              {current && <Badge className="h-4 px-1.5 text-[10px]">Now</Badge>}
            </span>
            {showWeekNumbers && unit.scale === "week" && label.eyebrow && (
              <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                {label.eyebrow}
              </span>
            )}
          </button>
        );
      })}

      {nowOnCanvas && (layout.scale === "day" || layout.scale === "hour") && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 bg-background px-0.5 text-[10px] font-medium tabular-nums text-primary"
          style={{ left: nowX, top: twoLevel ? 20 : 2 }}
        >
          {format(now, "HH:mm")}
        </div>
      )}
    </div>
  );
}
