"use client";

import { TaskDetailsPanel } from "@/components/item/TaskDetailsPanel";
import { usePlannerStore } from "@/store/plannerStore";
import type { Task } from "@/types";

interface TaskPopoverProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function TaskPopover({ task, open, onOpenChange, children }: TaskPopoverProps) {
  const item = usePlannerStore((s) => s.items.find((entry) => entry.id === task.id));
  if (!item) return children;
  return (
    <TaskDetailsPanel key={item.id} item={item} open={open} onOpenChange={onOpenChange}>
      {children}
    </TaskDetailsPanel>
  );
}
