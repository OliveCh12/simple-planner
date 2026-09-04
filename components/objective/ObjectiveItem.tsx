"use client";

import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/react";
import { Check, GripVertical, Trash2 } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { ENERGY_LEVELS, STATUSES } from "@/lib/constants";
import { createISODate, dayFromISO, getDaysInMonthForDate } from "@/lib/date-utils";
import { useRoadmapStore } from "@/store/roadmapStore";
import type { EnergyLevel, Objective, ObjectiveStatus } from "@/types";

interface ObjectiveItemProps {
  objective: Objective;
  monthKey: string;
  roadmapId: string;
}

const STATUS_DOT: Record<ObjectiveStatus, string> = {
  pending: "bg-muted-foreground/40",
  "in-progress": "bg-primary",
  completed: "bg-emerald-500",
  cancelled: "bg-destructive/70",
  blocked: "bg-amber-500",
};

export function ObjectiveItem({ objective, monthKey, roadmapId }: ObjectiveItemProps) {
  const updateObjective = useRoadmapStore((s) => s.updateObjective);
  const deleteObjective = useRoadmapStore((s) => s.deleteObjective);
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(objective.title);
  const [notes, setNotes] = useState(objective.notes ?? objective.description ?? "");
  const didDrag = useRef(false);

  const { ref, handleRef, isDragging } = useDraggable({
    id: objective.id,
    data: { objective, roadmapId },
  });

  useEffect(() => {
    if (isDragging) didDrag.current = true;
  }, [isDragging]);

  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = getDaysInMonthForDate(year, month);
  const startDay = dayFromISO(objective.startDate);
  const endDay = dayFromISO(objective.endDate);

  const persist = (updates: Partial<Objective>) => {
    void updateObjective(monthKey, objective.id, updates);
  };

  const persistTitle = () => {
    const next = title.trim();
    if (!next || next === objective.title) {
      setTitle(objective.title);
      return;
    }
    persist({ title: next });
  };

  const persistNotes = () => {
    if (notes === (objective.notes ?? objective.description ?? "")) return;
    persist({ notes, description: notes });
  };

  const setDays = (start: number, end: number) => {
    const from = Math.max(1, Math.min(daysInMonth, start));
    const to = Math.max(from, Math.min(daysInMonth, end));
    persist({
      startDate: createISODate(year, month, from),
      endDate: createISODate(year, month, to),
      duration: to - from + 1,
      isPinned: to - from + 1 >= 28,
    });
  };

  return (
    <div
      ref={ref}
      data-objective
      className={`group/item rounded-xl border bg-background/70 transition-[background-color,border-color,box-shadow,opacity,transform] duration-150 ${
        isDragging
          ? "rotate-1 scale-[1.02] border-primary/40 bg-background opacity-90 shadow-md"
          : "hover:border-foreground/20 hover:bg-background hover:shadow-[0_1px_2px_0_rgb(0_0_0/0.06)]"
      } ${expanded ? "border-foreground/20 bg-background p-2.5 shadow-sm" : "px-2 py-1.5"} ${
        objective.status === "completed" && !expanded && !isDragging ? "opacity-70 hover:opacity-100" : ""
      }`}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          ref={handleRef}
          aria-label="Drag objective"
          data-no-pan
          className="shrink-0 cursor-grab rounded p-0.5 text-muted-foreground/35 transition-colors group-hover/item:text-muted-foreground hover:text-foreground active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          aria-label={objective.status === "completed" ? "Mark pending" : "Mark completed"}
          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${STATUS_DOT[objective.status]}`}
          onClick={(e) => {
            e.stopPropagation();
            persist({
              status: objective.status === "completed" ? "pending" : "completed",
              progress: objective.status === "completed" ? 0 : 100,
              completedAt:
                objective.status === "completed" ? undefined : new Date().toISOString(),
            });
          }}
        >
          {objective.status === "completed" && <Check className="h-2.5 w-2.5 text-white" />}
        </button>

        {expanded ? (
          <InputGroup className="h-8 min-w-0 flex-1 shadow-none">
            <InputGroupInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={persistTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  persistTitle();
                }
                if (e.key === "Escape") setExpanded(false);
              }}
              className="h-8 text-sm font-medium"
            />
          </InputGroup>
        ) : (
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left text-sm leading-snug"
            onClick={() => {
              if (didDrag.current) {
                didDrag.current = false;
                return;
              }
              setTitle(objective.title);
              setNotes(objective.notes ?? objective.description ?? "");
              setExpanded(true);
            }}
          >
            {objective.title}
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-2 space-y-2 pl-6">
          <InputGroup>
            <InputGroupTextarea
              value={notes}
              placeholder="Notes"
              rows={2}
              className="min-h-14 py-2 text-xs"
              onChange={(e) => setNotes(e.target.value)}
              onBlur={persistNotes}
            />
          </InputGroup>

          <div className="flex flex-wrap gap-1">
            {STATUSES.filter((s) => s.value !== "cancelled").map((status) => (
              <button
                key={status.value}
                type="button"
                onClick={() =>
                  persist({
                    status: status.value,
                    progress: status.value === "completed" ? 100 : objective.progress,
                    completedAt:
                      status.value === "completed" ? new Date().toISOString() : undefined,
                  })
                }
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  objective.status === status.value
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {ENERGY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => persist({ energyLevel: level.value as EnergyLevel })}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  objective.energyLevel === level.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>

          <InputGroup className="h-8">
            <InputGroupAddon>
              <InputGroupText className="text-xs">Days</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              type="number"
              min={1}
              max={daysInMonth}
              value={startDay}
              onChange={(e) => setDays(Number(e.target.value), endDay)}
              className="h-8 min-w-0 text-center"
            />
            <InputGroupText className="px-0 text-muted-foreground">–</InputGroupText>
            <InputGroupInput
              type="number"
              min={1}
              max={daysInMonth}
              value={endDay}
              onChange={(e) => setDays(startDay, Number(e.target.value))}
              className="h-8 min-w-0 text-center"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive"
                aria-label="Delete objective"
                onClick={() => void deleteObjective(monthKey, objective.id)}
              >
                <Trash2 />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      )}
    </div>
  );
}
