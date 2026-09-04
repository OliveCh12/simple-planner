import { useCallback } from "react";
import { toast } from "sonner";
import { usePlanStore } from "@/store/planStore";
import type { Task } from "@/types";

/** Deletes a task and offers an undo from the toast. */
export function useDeleteTask() {
  const deleteTask = usePlanStore((s) => s.deleteTask);
  const addTask = usePlanStore((s) => s.addTask);

  return useCallback(
    async (task: Task) => {
      await deleteTask(task.id);

      toast("Task deleted", {
        description: task.title,
        action: {
          label: "Undo",
          onClick: () => {
            void addTask(task);
          },
        },
      });
    },
    [addTask, deleteTask]
  );
}
