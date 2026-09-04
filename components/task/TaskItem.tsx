"use client";

import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/react";
import { Check, GripVertical, Trash2, X } from "lucide-react";
import { DateRangeChip, EnergyChip, StatusChip } from "@/components/task/TaskProperties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeleteTask } from "@/hooks/useTaskActions";
import { getStatusOption } from "@/lib/constants";
import { taskRangeLabel } from "@/lib/time/labels";
import { intervalOf } from "@/lib/time/local";
import type { TimeColumn } from "@/lib/time/scale";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/store/planStore";
import type { Task, TaskStatus, TimeScale } from "@/types";

export interface TaskDragData {
  taskId: string;
  planId: string;
  /** Scale and index of the column the drag started from. */
  scale: TimeScale;
  index: number;
}

interface TaskItemProps {
  task: Task;
  column: TimeColumn;
  planId: string;
  /** Whether the task fits entirely inside `column`. */
  contained: boolean;
}

export function TaskItem({ task, column, planId, contained }: TaskItemProps) {
  const updateTask = usePlanStore((s) => s.updateTask);
  const deleteTask = useDeleteTask();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const didDrag = useRef(false);
  const closeRef = useRef<(save?: boolean) => void>(() => {});

  const instanceId = `${column.key}/${task.id}`;
  const { ref, handleRef, isDragging } = useDraggable({
    id: instanceId,
    data: { taskId: task.id, planId, scale: column.scale, index: column.index } satisfies TaskDragData,
  });

  useEffect(() => {
    if (isDragging) didDrag.current = true;
  }, [isDragging]);

  const interval = intervalOf(task);
  const startsBefore = interval.start < column.start;
  const endsAfter = interval.end > column.end;
  const fillsColumn = interval.start <= column.start && interval.end >= column.end;
  const now = new Date();
  const activeNow = interval.start <= now && now < interval.end;
  const rangeLabel = contained && fillsColumn ? null : taskRangeLabel(task, column.scale, contained);
  const completed = task.status === "completed";
  const status = getStatusOption(task.status);

  const persist = (updates: Partial<Task>) => {
    void updateTask(task.id, updates);
  };

  const commitTitle = (value: string) => {
    const next = value.trim();
    if (!next) {
      setTitle(task.title);
      return;
    }
    if (next !== task.title) persist({ title: next });
  };

  const commitNotes = (value: string) => {
    if (value !== task.notes) persist({ notes: value });
  };

  const open = () => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    setTitle(task.title);
    setNotes(task.notes);
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
      if (target.closest(`[data-task-instance="${CSS.escape(instanceId)}"]`)) return;
      if (target.closest("[data-radix-popper-content-wrapper]")) return;
      closeRef.current();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded, instanceId]);

  const setStatus = (next: TaskStatus) => {
    persist({
      status: next,
      completedAt: next === "completed" ? new Date().toISOString() : undefined,
    });
  };

  return (
    <div
      ref={ref}
      data-task-instance={instanceId}
      className={cn(
        "group/item rounded-lg border border-transparent transition-[background-color,border-color,box-shadow,opacity] duration-150",
        expanded ? "border-border bg-background shadow-sm" : "hover:bg-muted/60",
        !contained && "bg-primary/5",
        !contained && startsBefore && "rounded-l-none border-l-2 border-l-primary/40",
        !contained && endsAfter && "rounded-r-none border-r-2 border-r-primary/40",
        isDragging && "border-primary/40 bg-background opacity-90 shadow-md",
        completed && !expanded && "opacity-60 hover:opacity-100"
      )}
    >
      <div className={cn("flex gap-1.5 px-1.5", expanded ? "items-start py-2" : "items-center py-1.5")}>
        <button
          type="button"
          ref={handleRef}
          aria-label="Drag task"
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
              {task.status === "in-progress" && (
                <span className="size-1.5 rounded-full bg-current" />
              )}
              {task.status === "blocked" && <span className="h-0.5 w-1.5 rounded-full bg-current" />}
              {task.status === "cancelled" && <X className="size-2.5" strokeWidth={2.5} />}
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
                    aria-label="Delete task"
                    className="-mr-1 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => void deleteTask(task)}
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
              <StatusChip value={task.status} onChange={setStatus} />
              <EnergyChip value={task.energy} onChange={(energy) => persist({ energy })} />
              <DateRangeChip
                start={task.start}
                end={task.end}
                column={column}
                onChange={(start, end) => persist({ start, end })}
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
              {task.title}
            </button>
            {rangeLabel && (
              <span
                className={cn(
                  "shrink-0 text-[11px] tabular-nums",
                  activeNow && !completed ? "font-medium text-primary" : "text-muted-foreground/70"
                )}
              >
                {rangeLabel}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
