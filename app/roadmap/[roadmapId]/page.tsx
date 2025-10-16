'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { DragDropProvider } from '@dnd-kit/react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { SubHeader } from '@/components/layout/SubHeader';
import { useRoadmap } from '@/hooks/useRoadmap';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useUIStore } from '@/store/uiStore';
import { CreateObjectiveSheet } from '@/components/objective/CreateObjectiveSheet';
import { ObjectiveItem } from '@/components/objective/ObjectiveItem';
import { generateMonthKeys, formatMonthDisplay, getCurrentMonthKey, isMonthPast } from '@/lib/date-utils';
import { saveRoadmap } from '@/lib/db';
import type { Objective, Roadmap } from '@/types';
import { useDroppable } from '@dnd-kit/react';
import { useAutoCenter } from '@/hooks/useAutoCenter';

interface MonthColumnProps {
  monthKey: string;
  roadmap: Roadmap;
  selectedMonthKey: string | null;
  onMonthClick: (monthKey: string) => void;
  onAddObjective: (monthKey: string) => void;
}

function MonthColumn({ monthKey, roadmap, selectedMonthKey, onMonthClick, onAddObjective }: MonthColumnProps) {
  const [year, month] = monthKey.split('-').map(Number);
  const monthData = roadmap.months[monthKey];
  const objectiveCount = monthData?.objectives.length || 0;
  const isCurrentMonth = monthKey === getCurrentMonthKey();
  const isSelected = monthKey === selectedMonthKey;
  const isPast = isMonthPast(year, month);

  const { ref, isDropTarget } = useDroppable({
    id: monthKey,
  });

  return (
    <div
      key={monthKey}
      data-month-key={monthKey}
      ref={ref}
      className={`
        min-w-[320px] w-[320px]
        border rounded-lg bg-card
        transition-all cursor-pointer flex flex-col
        ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}
        ${isCurrentMonth ? 'border-primary' : ''}
        ${isPast ? 'opacity-50 hover:opacity-100' : 'opacity-100'}
        ${isDropTarget ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
      `}
      onClick={() => onMonthClick(monthKey)}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-lg">
          {formatMonthDisplay(year, month)}
        </h3>
        {isCurrentMonth && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary text-primary-foreground">
            Current
          </span>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {objectiveCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              No objectives yet
            </p>
          ) : (
            monthData?.objectives.map((objective) => (
              <ObjectiveItem
                key={objective.id}
                objective={objective}
                roadmapId={roadmap.id}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onAddObjective(monthKey);
          }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Objective
        </Button>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const params = useParams();
  const router = useRouter();
  const roadmapId = params.roadmapId as string;
  const { roadmap, isLoading } = useRoadmap(roadmapId);
  const { addObjective, deleteObjective, setSelectedMonth, currentRoadmap } = useRoadmapStore();
  const { isCreateObjectiveModalOpen, openCreateObjectiveModal, closeCreateObjectiveModal } = useUIStore();
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [targetMonthKey, setTargetMonthKey] = useState<string | null>(null);

  // Sync local selectedMonthKey with store
  useEffect(() => {
    if (selectedMonthKey) {
      setSelectedMonth(selectedMonthKey);
    }
  }, [selectedMonthKey, setSelectedMonth]);

  useEffect(() => {
    if (roadmap && !selectedMonthKey) {
      // Auto-select current month if it exists in the roadmap range
      const currentMonthKey = getCurrentMonthKey();
      const [year] = currentMonthKey.split('-').map(Number);
      
      if (year >= roadmap.startYear && year <= roadmap.endYear) {
        setSelectedMonthKey(currentMonthKey);
      } else {
        // Otherwise, select the first month of the roadmap
        setSelectedMonthKey(`${roadmap.startYear}-01`);
      }
    }
  }, [roadmap, selectedMonthKey]);

  // Auto-center selected month (handles both selection changes and window resize)
  const { centerElement } = useAutoCenter(selectedMonthKey);
  
  // When modal is opened from SubHeader, set the target month
  useEffect(() => {
    if (isCreateObjectiveModalOpen && selectedMonthKey && !targetMonthKey) {
      setTargetMonthKey(selectedMonthKey);
    }
  }, [isCreateObjectiveModalOpen, selectedMonthKey, targetMonthKey]);

  const handleOpenCreateModal = (monthKey: string) => {
    setTargetMonthKey(monthKey);
    openCreateObjectiveModal();
  };

  const handleScrollToCurrentMonth = () => {
    if (roadmap) {
      const currentMonthKey = getCurrentMonthKey();
      const [year] = currentMonthKey.split('-').map(Number);

      let targetMonthKey: string;
      if (year >= roadmap.startYear && year <= roadmap.endYear) {
        targetMonthKey = currentMonthKey;
      } else {
        // If current month is not in roadmap, scroll to the first month
        targetMonthKey = `${roadmap.startYear}-01`;
      }

      setSelectedMonthKey(targetMonthKey);
      // Force centering even if month is already selected
      setTimeout(() => centerElement(targetMonthKey), 0);
    }
  };

  const handleObjectiveCreated = async (objective: Objective) => {
    if (!roadmap || !targetMonthKey) return;

    // Check if month exists, if not create it
    if (!roadmap.months[targetMonthKey]) {
      const [year, month] = targetMonthKey.split('-').map(Number);
      roadmap.months[targetMonthKey] = {
        id: `${targetMonthKey}-${Date.now()}`,
        year,
        month,
        objectives: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Add objective to store
    addObjective(targetMonthKey, objective);

    // Save to database
    try {
      await saveRoadmap(roadmap);
    } catch (error) {
      console.error('Failed to save roadmap:', error);
      alert('Failed to save objective. Please try again.');
    }
  };

  const handleDragEnd = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!roadmap || !currentRoadmap) return;
    
    const dragData = extractDragData(event);
    if (!dragData) return;
    
    const { objective, sourceMonthKey, targetMonthKey } = dragData;
    
    if (sourceMonthKey === targetMonthKey) return;
    
    moveObjectiveBetweenMonths(objective, sourceMonthKey, targetMonthKey);
    saveUpdatedRoadmap();
  };

  const extractDragData = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const { source, target } = event.operation;
    if (!source || !target) return null;
    
    const objective = source.data?.objective;
    const sourceRoadmapId = source.data?.roadmapId;
    
    if (!objective || sourceRoadmapId !== roadmapId) return null;
    
    const sourceMonthKey = findObjectiveMonth(objective.id);
    if (!sourceMonthKey) return null;
    
    return {
      objective,
      sourceMonthKey,
      targetMonthKey: target.id
    };
  };

  const findObjectiveMonth = (objectiveId: string): string | null => {
    if (!roadmap) return null;
    
    for (const [monthKey, monthData] of Object.entries(roadmap.months)) {
      if (monthData?.objectives.some(obj => obj.id === objectiveId)) {
        return monthKey;
      }
    }
    return null;
  };

  const moveObjectiveBetweenMonths = (objective: Objective, fromMonth: string, toMonth: string) => {
    deleteObjective(fromMonth, objective.id);
    addObjective(toMonth, objective);
  };

  const saveUpdatedRoadmap = () => {
    if (currentRoadmap) {
      saveRoadmap(currentRoadmap);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading roadmap...</p>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Roadmap not found</p>
        <Button onClick={() => router.push('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const monthKeys = generateMonthKeys(roadmap.startYear, roadmap.endYear);

  return (
    <div className="flex flex-1 flex-col h-screen overflow-hidden">
      <SubHeader
        title={roadmap.title}
        subtitle={roadmap.description + (roadmap.description ? ` • ${roadmap.startYear} - ${roadmap.endYear}` : ` ${roadmap.startYear} - ${roadmap.endYear}`)}
        actionButtonIcon={<Plus className="h-4 w-4 mr-2" />}
        onActionClick={() => openCreateObjectiveModal()}
        actionButtonDisabled={!selectedMonthKey}
        showScrollToCurrentButton={true}
        onScrollToCurrentClick={handleScrollToCurrentMonth}
      />
      
      {/* Timeline Container */}
      <div className={`flex-1 overflow-hidden py-4 relative`}>
        <DragDropProvider onDragEnd={handleDragEnd}>
          <ScrollArea className="h-full">
              <div className="flex gap-4">
                {monthKeys.map((monthKey) => (
                  <MonthColumn
                    key={monthKey}
                    monthKey={monthKey}
                    roadmap={roadmap}
                    selectedMonthKey={selectedMonthKey}
                    onMonthClick={setSelectedMonthKey}
                    onAddObjective={handleOpenCreateModal}
                  />
                ))}
              </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DragDropProvider>
      </div>

      {/* Footer */}
      <div className="border-t bg-card px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              {monthKeys.length} months • {Object.values(roadmap.months).reduce((total, month) => total + (month?.objectives?.length || 0), 0)} objectives
            </span>
            {selectedMonthKey && (
              <span>
                Selected: {formatMonthDisplay(...selectedMonthKey.split('-').map(Number) as [number, number])}
              </span>
            )}
          </div>
          <div className="text-xs">
            Last updated: {new Date(roadmap.updatedAt || roadmap.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Create Objective Modal */}
      {targetMonthKey && (
        <CreateObjectiveSheet
          open={isCreateObjectiveModalOpen}
          onClose={() => {
            closeCreateObjectiveModal();
            setTargetMonthKey(null);
          }}
          onCreated={handleObjectiveCreated}
          monthKey={targetMonthKey}
        />
      )}
    </div>
  );
}
