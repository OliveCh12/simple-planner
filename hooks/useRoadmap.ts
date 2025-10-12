import { useEffect, useCallback } from 'react';
import { useRoadmapStore } from '@/store/roadmapStore';
import { getRoadmap, saveRoadmap, touchRoadmap } from '@/lib/db';
import type { Roadmap } from '@/types';

/**
 * Custom hook for managing a single roadmap's lifecycle.
 * Handles loading, updating, and persisting roadmap data.
 */
export function useRoadmap(roadmapId: string | null) {
  const { 
    currentRoadmap, 
    setCurrentRoadmap,
    updateRoadmap,
    isLoading,
    setIsLoading,
    setError,
    reset
  } = useRoadmapStore();

  // Load roadmap on mount or when ID changes
  useEffect(() => {
    if (!roadmapId) {
      reset();
      return;
    }

    async function loadRoadmap() {
      if (!roadmapId) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const roadmap = await getRoadmap(roadmapId);
        if (roadmap) {
          setCurrentRoadmap(roadmap);
          // Touch the roadmap to update last accessed time
          await touchRoadmap(roadmapId);
        } else {
          setError('Roadmap not found');
        }
      } catch (error) {
        console.error('Failed to load roadmap:', error);
        setError('Failed to load roadmap');
      } finally {
        setIsLoading(false);
      }
    }

    loadRoadmap();
  }, [roadmapId, setCurrentRoadmap, setIsLoading, setError, reset]);

  // Save roadmap to IndexedDB
  const save = useCallback(async (updates?: Partial<Roadmap>) => {
    if (!currentRoadmap) return;
    
    const updatedRoadmap = updates 
      ? {
          ...currentRoadmap,
          ...updates,
          updatedAt: new Date().toISOString()
        }
      : currentRoadmap;
    
    try {
      await saveRoadmap(updatedRoadmap);
      updateRoadmap(updatedRoadmap);
    } catch (error) {
      console.error('Failed to save roadmap:', error);
      setError('Failed to save roadmap');
    }
  }, [currentRoadmap, updateRoadmap, setError]);

  // Auto-save when roadmap changes (debounced in production)
  useEffect(() => {
    if (currentRoadmap && roadmapId) {
      const timeoutId = setTimeout(() => {
        saveRoadmap(currentRoadmap).catch(console.error);
      }, 1000); // Debounce auto-save by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [currentRoadmap, roadmapId]);

  return {
    roadmap: currentRoadmap,
    isLoading,
    save
  };
}
