import { useCallback } from "react";
import { toast } from "sonner";
import { DomainError } from "@/lib/domain/items";
import { usePlannerStore } from "@/store/plannerStore";
import type { PlanItem } from "@/types";

export function useSaveItem() {
  const putItem = usePlannerStore((s) => s.putItem);

  return useCallback(
    async (next: PlanItem) => {
      try {
        await putItem(next);
      } catch (error) {
        toast.error(error instanceof DomainError ? error.message : "Failed to save item.");
      }
    },
    [putItem]
  );
}
