import { useEffect, useMemo } from "react";
import { hydratePlan } from "@/lib/domain/convert";
import { usePlannerStore } from "@/store/plannerStore";

export function usePlan(planId: string | null) {
  const currentPlan = usePlannerStore((s) => s.currentPlan);
  const items = usePlannerStore((s) => s.items);
  const isLoading = usePlannerStore((s) => s.isLoading);
  const error = usePlannerStore((s) => s.error);
  const loadPlan = usePlannerStore((s) => s.loadPlan);

  useEffect(() => {
    void loadPlan(planId);
  }, [planId, loadPlan]);

  const plan = useMemo(
    () => (currentPlan && currentPlan.id === planId ? hydratePlan(currentPlan, items) : null),
    [currentPlan, items, planId]
  );

  return {
    plan,
    isLoading,
    error,
  };
}
