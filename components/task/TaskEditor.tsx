"use client";

import { ItemEditor } from "@/components/item/ItemEditor";
import { usePlannerStore } from "@/store/plannerStore";
import type { Task } from "@/types";

interface TaskEditorProps {
  task: Task;
  onClose: () => void;
}

export function TaskEditor({ task, onClose }: TaskEditorProps) {
  const item = usePlannerStore((s) => s.items.find((entry) => entry.id === task.id));
  if (!item) return null;
  return <ItemEditor item={item} onClose={onClose} />;
}
