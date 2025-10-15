'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { SubHeader } from '@/components/layout/SubHeader';
import { useRoadmap } from '@/hooks/useRoadmap';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useUIStore } from '@/store/uiStore';
import { CreateObjectiveSheet } from '@/components/objective/CreateObjectiveSheet';
import { generateMonthKeys, formatMonthDisplay, getCurrentMonthKey } from '@/lib/date-utils';
import { saveRoadmap } from '@/lib/db';
import type { Objective } from '@/types';

import { containerClasses } from '@/lib/utils';

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

  // Auto-scroll to selected month
  useEffect(() => {
    if (selectedMonthKey) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        const element = document.querySelector(`[data-month-key="${selectedMonthKey}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
      }, 100);
    }
  }, [selectedMonthKey]);
  
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
    <div className="flex flex-1 flex-col h-screen overflow-hidden">
      <SubHeader
        // backUrl="/"
        title={roadmap.title}
        subtitle={roadmap.description + (roadmap.description ? ` • ${roadmap.startYear} - ${roadmap.endYear}` : ` ${roadmap.startYear} - ${roadmap.endYear}`)}
        showActionButton={true}
        actionButtonLabel="Add Objective"
        actionButtonIcon={<Plus className="h-4 w-4 mr-2" />}
        onActionClick={() => openCreateObjectiveModal()}
        actionButtonDisabled={!selectedMonthKey}
      />
      
      {/* Timeline Container */}
      <div className={`flex-1 overflow-hidden py-4 ${containerClasses()}`}>
        <ScrollArea className="h-full">
            <div className="flex gap-4">
              {monthKeys.map((monthKey) => {
                const [year, month] = monthKey.split('-').map(Number);
                const monthData = roadmap.months[monthKey];
                const objectiveCount = monthData?.objectives.length || 0;
                const isCurrentMonth = monthKey === getCurrentMonthKey();
                const isSelected = monthKey === selectedMonthKey;

                return (
                  <div
                    key={monthKey}
                    data-month-key={monthKey}
                    className={`
                      min-w-[320px] w-[320px]
                      border rounded-lg bg-card
                      transition-all cursor-pointer flex flex-col
                      ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}
                      ${isCurrentMonth ? 'border-primary' : ''}
                    `}
                    // style={{ height: 'calc(100vh - 300px)' }}
                    onClick={() => setSelectedMonthKey(monthKey)}
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
                            <div
                              key={objective.id}
                              className="text-sm p-3 rounded bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/roadmap/${roadmapId}/objective/${objective.id}`);
                              }}
                            >
                              <p className="font-medium">{objective.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {objective.status}
                              </p>
                            </div>
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
            </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
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
