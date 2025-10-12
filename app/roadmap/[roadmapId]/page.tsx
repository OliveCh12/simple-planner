'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useRoadmap } from '@/hooks/useRoadmap';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useUIStore } from '@/store/uiStore';
import { CreateObjectiveModal } from '@/components/objective/CreateObjectiveModal';
import { generateMonthKeys, formatMonthDisplay, getCurrentMonthKey } from '@/lib/date-utils';
import { saveRoadmap } from '@/lib/db';
import type { Objective } from '@/types';

export default function RoadmapPage() {
  const params = useParams();
  const router = useRouter();
  const roadmapId = params.roadmapId as string;
  const { roadmap, isLoading } = useRoadmap(roadmapId);
  const { addObjective, setSelectedMonth } = useRoadmapStore();
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
    <div className="flex flex-1 flex-col h-full">
      {/* Timeline Container */}
      <div className="container mx-auto flex-1 px-4 py-8 overflow-hidden flex flex-col">
        <div className="flex flex-col h-full">
          {/* <div className="flex-shrink-0">
            <h2 className="text-lg font-semibold mb-2">Timeline</h2>
            <p className="text-sm text-muted-foreground">
              {roadmap.startYear} - {roadmap.endYear}
            </p>
          </div> */}

          {/* Horizontal Scrollable Timeline */}
          <ScrollArea className="p-6" >
            <div className="flex flex-1 gap-4 p-4 overflow-x-auto snap-x snap-mandatory">
              {monthKeys.map((monthKey) => {
                const [year, month] = monthKey.split('-').map(Number);
                const monthData = roadmap.months[monthKey];
                const objectiveCount = monthData?.objectives.length || 0;
                const isCurrentMonth = monthKey === getCurrentMonthKey();
                const isSelected = monthKey === selectedMonthKey;

                return (
                  <div
                    key={monthKey}
                    className={`
                      min-w-[280px] w-[280px] snap-start
                      border rounded-lg p-4 bg-card
                      transition-all cursor-pointer
                      ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}
                      ${isCurrentMonth ? 'border-primary' : ''}
                    `}
                    onClick={() => setSelectedMonthKey(monthKey)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">
                        {formatMonthDisplay(year, month)}
                      </h3>
                      {isCurrentMonth && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary text-primary-foreground">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {objectiveCount === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No objectives yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {monthData?.objectives.slice(0, 3).map((objective) => (
                            <div
                              key={objective.id}
                              className="text-sm p-2 rounded bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/roadmap/${roadmapId}/objective/${objective.id}`);
                              }}
                            >
                              <p className="font-medium truncate">{objective.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {objective.status}
                              </p>
                            </div>
                          ))}
                          {objectiveCount > 3 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{objectiveCount - 3} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCreateModal(monthKey);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Objective
                      </Button>
                    </div>
                  </div>
                );
              })}
              <ScrollBar orientation="horizontal" />
            </div>
          </ScrollArea>

          {/* Selected Month Details
          {selectedMonthKey && roadmap.months[selectedMonthKey] && (
            <div className="flex-1 overflow-y-auto min-h-0">
              <h3 className="text-xl font-semibold mb-4">
                {formatMonthDisplay(
                  ...selectedMonthKey.split('-').map(Number) as [number, number]
                )}
              </h3>
              <div className="space-y-3 pb-4">
                {roadmap.months[selectedMonthKey].objectives.map((objective) => (
                  <div
                    key={objective.id}
                    className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/roadmap/${roadmapId}/objective/${objective.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{objective.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        objective.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : objective.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {objective.status}
                      </span>
                    </div>
                    {objective.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {objective.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Energy: {objective.energyLevel}</span>
                      <span>Priority: {objective.priority}</span>
                      {objective.duration && (
                        <span>{objective.duration} days</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )} */}
        </div>
      </div>

      {/* Create Objective Modal */}
      {targetMonthKey && (
        <CreateObjectiveModal
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
