import { useCallback } from "react";
import { toast } from "sonner";
import { DomainError } from "@/lib/domain/items";
import { usePlannerStore } from "@/store/plannerStore";
import type { PlanItem } from "@/types";

export function useSaveItem() {
  const putItem = usePlannerStore((s) => s.putItem);

  return useCallback(async (next: PlanItem): Promise<boolean> => {
    try {
      await putItem(next);
      return true;
    } catch (error) {
      toast.error(error instanceof DomainError ? error.message : "Failed to save item.");
      return false;
    }
  }, [putItem]);
}
