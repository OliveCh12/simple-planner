"use client";

import { useState } from "react";
import { TaskPopover } from "@/components/timeline/TaskPopover";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface CalendarChipProps {
  task: Task;
  className?: string;
  time?: string;
}

export function CalendarChip({ task, className, time }: CalendarChipProps) {
  const [open, setOpen] = useState(false);
  const completed = task.status === "completed";

  return (
    <TaskPopover task={task} open={open} onOpenChange={setOpen}>
      <button
        type="button"
        title={task.title}
        className={cn(
          "flex w-full min-w-0 items-center gap-1 truncate rounded-md border border-primary/40 bg-primary/15 px-1.5 py-0.5 text-left text-xs leading-tight",
          completed && "opacity-60",
          className
        )}
      >
        {time && <span className="shrink-0 tabular-nums text-muted-foreground">{time}</span>}
        <span className="min-w-0 truncate">{task.title}</span>
      </button>
    </TaskPopover>
  );
}
