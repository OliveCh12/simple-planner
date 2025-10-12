import { useCallback } from 'react';
import { useRoadmapStore } from '@/store/roadmapStore';
import { v4 as uuidv4 } from 'uuid';
import type { Objective, EnergyLevel, Priority, ObjectiveStatus } from '@/types';
import { shouldPinObjective } from '@/lib/date-utils';

/**
 * Custom hook for managing objectives within a roadmap.
 */
export function useObjectives(monthKey: string) {
  const { 
    currentRoadmap,
    addObjective: addObjectiveToStore,
    updateObjective: updateObjectiveInStore,
    deleteObjective: deleteObjectiveFromStore
  } = useRoadmapStore();

  const month = currentRoadmap?.months[monthKey];
  const objectives = month?.objectives || [];

  /**
   * Creates a new objective in the specified month.
   */
  const createObjective = useCallback((
    data: {
      title: string;
      description: string;
      startDate: string;
      endDate: string;
      duration: number;
      energyLevel: EnergyLevel;
      priority: Priority;
      category?: string;
      tags?: string[];
      notes?: string;
    }
  ) => {
    if (!month) return;

    const [year, monthNum] = monthKey.split('-').map(Number);
    const isPinned = shouldPinObjective(
      { 
        ...data, 
        id: '', 
        status: 'pending', 
        progress: 0, 
        isPinned: false, 
        createdAt: '', 
        updatedAt: '',
        tags: data.tags || []
      },
      year,
      monthNum
    );

    const newObjective: Objective = {
      id: uuidv4(),
      ...data,
      tags: data.tags || [],
      status: 'pending',
      progress: 0,
      isPinned,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addObjectiveToStore(monthKey, newObjective);
    return newObjective;
  }, [month, monthKey, addObjectiveToStore]);

  /**
   * Updates an existing objective.
   */
  const updateObjective = useCallback((
    objectiveId: string,
    updates: Partial<Objective>
  ) => {
    updateObjectiveInStore(monthKey, objectiveId, updates);
  }, [monthKey, updateObjectiveInStore]);

  /**
   * Deletes an objective.
   */
  const deleteObjective = useCallback((objectiveId: string) => {
    deleteObjectiveFromStore(monthKey, objectiveId);
  }, [monthKey, deleteObjectiveFromStore]);

  /**
   * Marks an objective as completed.
   */
  const completeObjective = useCallback((objectiveId: string) => {
    updateObjectiveInStore(monthKey, objectiveId, {
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString()
    });
  }, [monthKey, updateObjectiveInStore]);

  /**
   * Updates objective progress.
   */
  const updateProgress = useCallback((objectiveId: string, progress: number) => {
    const newProgress = Math.max(0, Math.min(100, progress));
    const updates: Partial<Objective> = { progress: newProgress };
    
    if (newProgress === 100) {
      updates.status = 'completed';
      updates.completedAt = new Date().toISOString();
    }
    
    updateObjectiveInStore(monthKey, objectiveId, updates);
  }, [monthKey, updateObjectiveInStore]);

  /**
   * Updates objective status.
   */
  const updateStatus = useCallback((
    objectiveId: string, 
    status: ObjectiveStatus
  ) => {
    const updates: Partial<Objective> = { status };
    
    if (status === 'completed') {
      updates.progress = 100;
      updates.completedAt = new Date().toISOString();
    }
    
    updateObjectiveInStore(monthKey, objectiveId, updates);
  }, [monthKey, updateObjectiveInStore]);

  return {
    objectives,
    createObjective,
    updateObjective,
    deleteObjective,
    completeObjective,
    updateProgress,
    updateStatus
  };
}
