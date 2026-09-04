import { useEffect } from "react";
import { useRoadmapStore } from "@/store/roadmapStore";
import { getRoadmap, touchRoadmap } from "@/lib/db";

export function useRoadmap(roadmapId: string | null) {
  const roadmap = useRoadmapStore((s) => s.currentRoadmap);
  const isLoading = useRoadmapStore((s) => s.isLoading);
  const error = useRoadmapStore((s) => s.error);
  const setCurrentRoadmap = useRoadmapStore((s) => s.setCurrentRoadmap);
  const setIsLoading = useRoadmapStore((s) => s.setIsLoading);
  const setError = useRoadmapStore((s) => s.setError);
  const reset = useRoadmapStore((s) => s.reset);

  useEffect(() => {
    if (!roadmapId) {
      reset();
      return;
    }

    const id = roadmapId;
    let cancelled = false;

    async function loadRoadmap() {
      setIsLoading(true);
      setError(null);
      try {
        const loaded = await getRoadmap(id);
        if (cancelled) return;

        if (!loaded) {
          setCurrentRoadmap(null);
          setError("Roadmap not found");
          return;
        }

        const lastAccessedAt = new Date().toISOString();
        setCurrentRoadmap({ ...loaded, lastAccessedAt });
        await touchRoadmap(id);
      } catch (loadError) {
        console.error("Failed to load roadmap:", loadError);
        if (!cancelled) setError("Failed to load roadmap");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadRoadmap();

    return () => {
      cancelled = true;
    };
  }, [roadmapId, setCurrentRoadmap, setIsLoading, setError, reset]);

  return {
    roadmap,
    isLoading,
    error,
  };
}
