"use client";

import { useDroppable } from "@dnd-kit/react";
import { ObjectiveItem } from "@/components/objective/ObjectiveItem";
import { AddObjectiveItem } from "@/components/objective/AddObjectiveItem";
import {
  formatMonthName,
  isMonthPast,
  getCurrentMonthKey,
} from "@/lib/date-utils";
import { createObjective } from "@/lib/objective";
import { useRoadmapStore } from "@/store/roadmapStore";
import type { Roadmap } from "@/types";

interface MonthColumnProps {
  monthKey: string;
  roadmap: Roadmap;
  selected: boolean;
  onSelect: () => void;
}

export function MonthColumn({
  monthKey,
  roadmap,
  selected,
  onSelect,
}: MonthColumnProps) {
  const addObjective = useRoadmapStore((s) => s.addObjective);
  const [year, month] = monthKey.split("-").map(Number);
  const monthData = roadmap.months[monthKey];
  const current = monthKey === getCurrentMonthKey();
  const past = isMonthPast(year, month);
  const { ref, isDropTarget } = useDroppable({ id: monthKey });

  return (
    <section
      ref={ref}
      data-month-key={monthKey}
      className={`flex shrink-0 flex-col self-stretch rounded-2xl border bg-card/90 backdrop-blur-sm transition-colors ${
        current ? "border-primary/50" : "border-border/70"
      } ${selected ? "border-secondary" : "border-secondary"} ${
        isDropTarget ? "border-primary bg-primary/5" : ""
      } ${past && !selected ? "opacity-70 hover:opacity-100" : ""}`}
    >
      <header
        className="flex cursor-pointer items-start justify-between gap-2 px-4 pb-3 pt-4"
        onClick={onSelect}
      >
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {year}
          </p>
          <h3 className="text-[17px] font-semibold leading-tight tracking-tight">
            {formatMonthName(month)}
          </h3>
        </div>
        {current && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            Now
          </span>
        )}
      </header>

      <div className="month-scroll min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2.5 py-0.5">
        {monthData?.objectives.map((objective) => (
          <ObjectiveItem
            key={objective.id}
            objective={objective}
            monthKey={monthKey}
            roadmapId={roadmap.id}
          />
        ))}
      </div>

      <div className="px-2 pb-2 pt-1">
        <AddObjectiveItem
          onCreate={(title) => {
            void addObjective(monthKey, createObjective({ title, monthKey }));
          }}
        />
      </div>
    </section>
  );
}
