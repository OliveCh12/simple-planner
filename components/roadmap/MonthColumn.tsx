'use client';

import { Target, Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/react';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { ObjectiveItem } from '@/components/objective/ObjectiveItem';
import { formatMonthDisplay, getCurrentMonthKey, isMonthPast } from '@/lib/date-utils';
import type { Roadmap } from '@/types';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';

interface MonthColumnProps {
  monthKey: string;
  roadmap: Roadmap;
  selectedMonthKey: string | null;
  onMonthClick: (monthKey: string) => void;
  onAddObjective: (monthKey: string) => void;
  compact?: boolean;
}

export function MonthColumn({
  monthKey,
  roadmap,
  selectedMonthKey,
  onMonthClick,
  onAddObjective,
  compact = false
}: MonthColumnProps) {
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
          <div className="space-y-2 max-h-[400px] p-4 overflow-y-auto">
            {objectiveCount === 0 ? (
              <Empty className="text-sm text-muted-foreground h-full">
                <EmptyMedia variant="icon">
                  <Target className="h-8 w-8 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>No objectives</EmptyTitle>
                <EmptyDescription>
                  Click &quot;Add Objective&quot; to create your first objective for this month.
                </EmptyDescription>
                <EmptyContent />
              </Empty>
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
          </div>

      </CardContent>

      <CardFooter className="flex-shrink-0 p-4">
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onAddObjective(monthKey);
          }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </CardFooter>
    </Card>
  );
}