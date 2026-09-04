"use client";

import { xOf, type TimeLayout } from "@/lib/time/layout";
import type { TimeColumn } from "@/lib/time/scale";
import { cn } from "@/lib/utils";

interface TimelineGridProps {
  layout: TimeLayout;
  units: TimeColumn[];
  majorUnits: TimeColumn[];
}

export function TimelineGrid({ layout, units, majorUnits }: TimelineGridProps) {
  const majorKeys = new Set(majorUnits.map((unit) => xOf(layout, unit.start)));

  return (
    <div className="pointer-events-none absolute inset-0">
      {units.map((unit) => {
        const left = xOf(layout, unit.start);
        const major = majorKeys.has(left);
        return (
          <div
            key={unit.key}
            className={cn("absolute top-0 bottom-0 w-px", major ? "bg-border" : "bg-border/50")}
            style={{ left }}
          />
        );
      })}
    </div>
  );
}
