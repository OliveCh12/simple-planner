"use client";

import { TaskEditor } from "@/components/task/TaskEditor";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Task } from "@/types";

interface TaskPopoverProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function TaskPopover({ task, open, onOpenChange, children }: TaskPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3">
        <TaskEditor key={task.id} task={task} onClose={() => onOpenChange(false)} />
      </PopoverContent>
    </Popover>
  );
}
