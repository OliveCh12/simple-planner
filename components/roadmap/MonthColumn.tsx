'use client';

import { v4 as uuidv4 } from 'uuid';
import { Badge } from "@/components/ui/badge"
import { ObjectiveItem } from '@/components/objective/ObjectiveItem';
import { AddObjectiveItem } from '@/components/objective/AddObjectiveItem';
import { formatMonthDisplay, getCurrentMonthKey, isMonthPast } from '@/lib/date-utils';
import type { Roadmap, Objective } from '@/types';
import { Card, CardHeader, CardContent } from '../ui/card';
import { useRoadmapStore } from '@/store/roadmapStore';
import { createISODate, getDaysInMonthForDate } from '@/lib/date-utils';
import { useDroppable } from '@dnd-kit/react';

interface MonthColumnProps {
  monthKey: string;
  roadmap: Roadmap;
  selectedMonthKey: string | null;
  onMonthClick: (monthKey: string) => void;
  editingMonthKey: string | null;
  onEditingMonthChange: (monthKey: string | null) => void;
  compact?: boolean;
}

export function MonthColumn({
  monthKey,
  roadmap,
  selectedMonthKey,
  onMonthClick,
  editingMonthKey,
  onEditingMonthChange,
  compact = false
}: MonthColumnProps) {
  const { addObjective } = useRoadmapStore();
  const [year, month] = monthKey.split('-').map(Number);
  const monthData = roadmap.months[monthKey];
  const isCurrentMonth = monthKey === getCurrentMonthKey();
  const isSelected = monthKey === selectedMonthKey;
  const isPast = isMonthPast(year, month);

  const { ref, isDropTarget } = useDroppable({
    id: monthKey,
  });

  return (
    <Card
      key={monthKey}
      data-month-key={monthKey}
      ref={ref}
      className={`
        min-w-[320px] w-[320px] min-h-full
        transition-all cursor-pointer
        ${isSelected ? 'ring-2 ring-ring shadow-lg bg-primary/10' : 'hover:shadow-md'}
        ${isCurrentMonth ? 'border-primary' : ''}
        ${isPast ? 'opacity-50 hover:opacity-100' : 'opacity-100'}
        ${isDropTarget ? 'ring-2 ring-ring bg-primary/10' : ''}
      `}
      onClick={() => onMonthClick(monthKey)}
    >
      <CardHeader className="flex items-center justify-between flex-shrink-0 px-4">
        <h3 className="font-semibold">
          {formatMonthDisplay(year, month)}
        </h3>
        {isCurrentMonth && (
          <Badge variant="default">
            Current
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-0">
          <div className={`space-y-2 p-4 overflow-y-auto h-[400px] md:h-[500px] ${isSelected ? 'scrollbar-primary' : 'scrollbar-secondary'}`}>
            {monthData?.objectives.length === 0 ? (
              ""
            ) : (
              monthData?.objectives.map((objective) => (
                <ObjectiveItem
                  key={objective.id}
                  objective={objective}
                  roadmapId={roadmap.id}
                  compact={compact}
                />
              ))
            )}
            <AddObjectiveItem
              onCreate={(title: string, description: string) => {
                const [year, month] = monthKey.split('-').map(Number);
                const daysInMonth = getDaysInMonthForDate(year, month);
                const startDate = createISODate(year, month, 1);
                const endDate = createISODate(year, month, daysInMonth);
                const duration = daysInMonth;
                const isPinned = duration >= 28;

                const now = new Date().toISOString();
                const newObjective: Objective = {
                  id: uuidv4(),
                  title,
                  description,
                  startDate,
                  endDate,
                  duration,
                  energyLevel: 'medium',
                  priority: 'medium',
                  status: 'pending',
                  tags: [],
                  progress: 0,
                  isPinned,
                  createdAt: now,
                  updatedAt: now,
                };

                addObjective(monthKey, newObjective);
              }}
              isEditing={editingMonthKey === monthKey}
              onEditingChange={(isEditing: boolean) => {
                onEditingMonthChange(isEditing ? monthKey : null);
              }}
            />
          </div>

      </CardContent>
    </Card>
  );
}