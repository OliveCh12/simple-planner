"use client";

import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/react";
import { Check, GripVertical, Trash2, X } from "lucide-react";
import { DaysChip, EnergyChip, StatusChip } from "@/components/objective/ObjectiveProperties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeleteObjective } from "@/hooks/useObjectiveActions";
import { getStatusOption } from "@/lib/constants";
import {
  createISODate,
  dayFromISO,
  getDaysInMonthForDate,
  getTodayInMonth,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { useRoadmapStore } from "@/store/roadmapStore";
import type { Objective, ObjectiveStatus } from "@/types";

interface ObjectiveItemProps {
  objective: Objective;
  monthKey: string;
  roadmapId: string;
}

function notesOf(objective: Objective) {
  return objective.notes ?? objective.description ?? "";
}

export function ObjectiveItem({ objective, monthKey, roadmapId }: ObjectiveItemProps) {
  const updateObjective = useRoadmapStore((s) => s.updateObjective);
  const deleteObjective = useDeleteObjective();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(objective.title);
  const [notes, setNotes] = useState(() => notesOf(objective));
  const didDrag = useRef(false);
  const closeRef = useRef<(save?: boolean) => void>(() => {});

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
  const wholeMonth = startDay === 1 && endDay === daysInMonth;
  const today = getTodayInMonth(monthKey);
  const activeToday = today !== null && startDay <= today && today <= endDay;
  const completed = objective.status === "completed";
  const status = getStatusOption(objective.status);

  const persist = (updates: Partial<Objective>) => {
    void updateObjective(monthKey, objective.id, updates);
  };

  const commitTitle = (value: string) => {
    const next = value.trim();
    if (!next) {
      setTitle(objective.title);
      return;
    }
    if (next !== objective.title) persist({ title: next });
  };

  const commitNotes = (value: string) => {
    if (value !== notesOf(objective)) persist({ notes: value, description: value });
  };

  const open = () => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    setTitle(objective.title);
    setNotes(notesOf(objective));
    setExpanded(true);
  };

  const close = (save = true) => {
    if (save) {
      commitTitle(title);
      commitNotes(notes);
    }
    setExpanded(false);
  };

  useEffect(() => {
    closeRef.current = close;
  });

  useEffect(() => {
    if (!expanded) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(`[data-objective-id="${objective.id}"]`)) return;
      if (target.closest("[data-radix-popper-content-wrapper]")) return;
      closeRef.current();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded, objective.id]);

  const setStatus = (next: ObjectiveStatus) => {
    persist({
      status: next,
      progress: next === "completed" ? 100 : next === "pending" ? 0 : objective.progress,
      completedAt: next === "completed" ? new Date().toISOString() : undefined,
    });
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
      data-objective-id={objective.id}
      className={cn(
        "group/item rounded-lg border border-transparent transition-[background-color,border-color,box-shadow,opacity] duration-150",
        expanded ? "border-border bg-background shadow-sm" : "hover:bg-muted/60",
        isDragging && "border-primary/40 bg-background opacity-90 shadow-md",
        completed && !expanded && "opacity-60 hover:opacity-100"
      )}
    >
      <div className={cn("flex gap-1.5 px-1.5", expanded ? "items-start py-2" : "items-center py-1.5")}>
        <button
          type="button"
          ref={handleRef}
          aria-label="Drag objective"
          className={cn(
            "shrink-0 cursor-grab rounded p-0.5 text-muted-foreground/60 opacity-0 transition-opacity group-hover/item:opacity-100 hover:text-foreground focus-visible:opacity-100 active:cursor-grabbing",
            (expanded || isDragging) && "opacity-100"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="size-3.5" />
        </button>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={completed ? "Mark as pending" : "Mark as completed"}
              aria-pressed={completed}
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border-[1.5px] border-current transition-colors",
                status.className,
                completed ? "border-emerald-500 bg-emerald-500 text-white" : "hover:text-foreground",
                expanded && "mt-[5px]"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setStatus(completed ? "pending" : "completed");
              }}
            >
              {completed && <Check className="size-2.5" strokeWidth={3} />}
              {objective.status === "in-progress" && (
                <span className="size-1.5 rounded-full bg-current" />
              )}
              {objective.status === "blocked" && (
                <span className="h-0.5 w-1.5 rounded-full bg-current" />
              )}
              {objective.status === "cancelled" && <X className="size-2.5" strokeWidth={2.5} />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {completed ? "Mark as pending" : "Mark as completed"}
          </TooltipContent>
        </Tooltip>

        {expanded ? (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                value={title}
                aria-label="Title"
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => commitTitle(title)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    close();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    close(false);
                  }
                }}
                className="-ml-1 h-7 flex-1 rounded-sm border-0 bg-transparent px-1 text-sm font-medium shadow-none focus-visible:bg-muted/60 focus-visible:ring-0 dark:bg-transparent"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Delete objective"
                    className="-mr-1 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => void deleteObjective(monthKey, objective)}
                  >
                    <Trash2 />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              value={notes}
              placeholder="Add notes…"
              aria-label="Notes"
              rows={1}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => commitNotes(notes)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  close(false);
                }
              }}
              className="-mx-1 mt-0.5 min-h-0 w-[calc(100%+0.5rem)] resize-none rounded-sm border-0 bg-transparent px-1 py-1 text-xs text-muted-foreground shadow-none focus-visible:bg-muted/60 focus-visible:ring-0 md:text-xs dark:bg-transparent"
            />
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <StatusChip value={objective.status} onChange={setStatus} />
              <EnergyChip
                value={objective.energyLevel}
                onChange={(energyLevel) => persist({ energyLevel })}
              />
              <DaysChip
                start={startDay}
                end={endDay}
                daysInMonth={daysInMonth}
                onChange={setDays}
              />
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              className={cn(
                "min-w-0 flex-1 truncate text-left text-sm leading-snug",
                completed && "text-muted-foreground line-through decoration-muted-foreground/50"
              )}
              onClick={open}
            >
              {objective.title}
            </button>
            {!wholeMonth && (
              <span
                className={cn(
                  "shrink-0 text-[11px] tabular-nums",
                  activeToday && !completed
                    ? "font-medium text-primary"
                    : "text-muted-foreground/70"
                )}
              >
                {startDay === endDay ? startDay : `${startDay}–${endDay}`}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
