import { useCallback } from "react";
import { toast } from "sonner";
import { useRoadmapStore } from "@/store/roadmapStore";
import type { Objective } from "@/types";

/** Deletes an objective and offers an undo from the toast. */
export function useDeleteObjective() {
  const deleteObjective = useRoadmapStore((s) => s.deleteObjective);
  const addObjective = useRoadmapStore((s) => s.addObjective);

  return useCallback(
    async (monthKey: string, objective: Objective) => {
      const objectives =
        useRoadmapStore.getState().currentRoadmap?.months[monthKey]?.objectives ?? [];
      const index = objectives.findIndex((item) => item.id === objective.id);

      await deleteObjective(monthKey, objective.id);

      toast("Objective deleted", {
        description: objective.title,
        action: {
          label: "Undo",
          onClick: () => {
            void addObjective(monthKey, objective, index < 0 ? undefined : index);
          },
        },
      });
    },
    [addObjective, deleteObjective]
  );
}
