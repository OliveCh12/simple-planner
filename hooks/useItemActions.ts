import { useCallback } from "react";
import { toast } from "sonner";
import { taskToItem } from "@/lib/domain/convert";
import { useHistoryStore } from "@/store/historyStore";
import { usePlannerStore } from "@/store/plannerStore";
import type { PlanItem, Task } from "@/types";

/** Deletes an item and offers an undo from the toast. */
export function useDeleteItem() {
  const deleteItem = usePlannerStore((s) => s.deleteItem);
  const undo = useHistoryStore((s) => s.undo);

  return useCallback(
    async (item: PlanItem) => {
      await deleteItem(item.id);

      toast("Item deleted", {
        description: item.title,
        action: {
          label: "Undo",
          onClick: () => {
            void undo();
          },
        },
      });
    },
    [deleteItem, undo]
  );
}

/** Deletes a task-shaped view and restores the underlying item on undo. */
export function useDeleteTask() {
  const deleteItem = usePlannerStore((s) => s.deleteItem);
  const putItem = usePlannerStore((s) => s.putItem);
  const undo = useHistoryStore((s) => s.undo);
  const planId = usePlannerStore((s) => s.currentPlan?.id);
  const items = usePlannerStore((s) => s.items);

  return useCallback(
    async (task: Task) => {
      const existing = items.find((item) => item.id === task.id);
      const snapshot = existing ?? (planId ? taskToItem(task, planId) : null);
      await deleteItem(task.id);

      toast("Task deleted", {
        description: task.title,
        action: {
          label: "Undo",
          onClick: () => {
            if (existing) void undo();
            else if (snapshot) void putItem(snapshot);
          },
        },
      });
    },
    [deleteItem, items, planId, putItem, undo]
  );
}
