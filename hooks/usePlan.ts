import { useEffect } from "react";
import { usePlanStore } from "@/store/planStore";
import { getPlan, touchPlan } from "@/lib/db";

export function usePlan(planId: string | null) {
  const plan = usePlanStore((s) => s.currentPlan);
  const isLoading = usePlanStore((s) => s.isLoading);
  const error = usePlanStore((s) => s.error);
  const setCurrentPlan = usePlanStore((s) => s.setCurrentPlan);
  const setIsLoading = usePlanStore((s) => s.setIsLoading);
  const setError = usePlanStore((s) => s.setError);
  const reset = usePlanStore((s) => s.reset);

  useEffect(() => {
    if (!planId) {
      reset();
      return;
    }

    const id = planId;
    let cancelled = false;

    async function loadPlan() {
      setIsLoading(true);
      setError(null);
      try {
        const loaded = await getPlan(id);
        if (cancelled) return;

        if (!loaded) {
          setCurrentPlan(null);
          setError("Plan not found");
          return;
        }

        const lastAccessedAt = new Date().toISOString();
        setCurrentPlan({ ...loaded, lastAccessedAt });
        await touchPlan(id);
      } catch (loadError) {
        console.error("Failed to load plan:", loadError);
        if (!cancelled) setError("Failed to load plan");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadPlan();

    return () => {
      cancelled = true;
    };
  }, [planId, setCurrentPlan, setIsLoading, setError, reset]);

  return {
    plan,
    isLoading,
    error,
  };
}
