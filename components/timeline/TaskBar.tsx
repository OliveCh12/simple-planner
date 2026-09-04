"use client";

import { memo, useState } from "react";
import { TaskPopover } from "@/components/timeline/TaskPopover";
import { cn } from "@/lib/utils";
import type { LaneItem } from "@/lib/lanes";
import type { Task } from "@/types";

interface TaskBarProps {
  item: LaneItem;
  task: Task;
  top: number;
  height: number;
  variant: "allDay" | "timed";
  fromX: number;
}

export const TaskBar = memo(function TaskBar({
  item,
  task,
  top,
  height,
  variant,
  fromX,
}: TaskBarProps) {
  const [open, setOpen] = useState(false);
  const completed = task.status === "completed";
  const boxWidth = Math.max(item.width, item.labelWidth);
  const milestone = item.kind === "milestone";
  const labelFits = item.labelWidth <= item.width;
  const stuck = Math.max(0, Math.min(Math.max(0, boxWidth - 8), fromX - item.x + 4));

  return (
    <TaskPopover task={task} open={open} onOpenChange={setOpen}>
      <button
        type="button"
        data-task-bar={task.id}
        style={{ left: item.x, top, width: boxWidth, height }}
        className={cn(
          "absolute cursor-pointer bg-transparent text-left text-sm leading-tight",
          labelFits ? "overflow-hidden" : "overflow-visible",
          completed && "opacity-60"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute left-0",
            milestone ? "top-1/2 rounded-full -translate-y-1/2" : "inset-y-0 rounded-md",
            variant === "allDay" && "border border-primary/70 bg-primary/20",
            variant === "timed" && "bg-primary"
          )}
          style={{ width: item.width, height: milestone ? item.width : undefined }}
        />
        <span
          className={cn(
            "relative z-[1] flex h-full items-center px-1.5",
            labelFits && "truncate",
            variant === "timed" && labelFits ? "text-primary-foreground" : "text-foreground"
          )}
          style={{
            width: labelFits ? item.width : item.labelWidth,
            transform: stuck > 0 ? `translateX(${stuck}px)` : undefined,
          }}
        >
          {task.title}
        </span>
      </button>
    </TaskPopover>
  );
});
