'use client';

import { useRouter } from 'next/navigation';
import { useDraggable } from '@dnd-kit/react';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { Objective } from '@/types';

interface ObjectiveItemProps {
  objective: Objective;
  roadmapId: string;
  compact?: boolean;
}

const statusConfig = {
  pending: {
    icon: Clock,
    className: 'text-muted-foreground',
    label: 'Pending'
  },
  'in-progress': {
    icon: Target,
    className: 'text-primary',
    label: 'In Progress'
  },
  completed: {
    icon: CheckCircle,
    className: 'text-green-600',
    label: 'Completed'
  },
  cancelled: {
    icon: XCircle,
    className: 'text-destructive',
    label: 'Cancelled'
  },
  blocked: {
    icon: AlertTriangle,
    className: 'text-orange-600',
    label: 'Blocked'
  },
};

export function ObjectiveItem({ objective, roadmapId, compact = false }: ObjectiveItemProps) {
  const router = useRouter();
  const status = statusConfig[objective.status];
  const StatusIcon = status.icon;

  const { ref, isDragging } = useDraggable({
    id: objective.id,
    data: {
      objective,
      roadmapId,
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/roadmap/${roadmapId}/objective/${objective.id}`);
  };

  return (
    <div
      ref={ref}
      className={`group relative cursor-pointer transition-all duration-200 rounded-lg border border-border/40 bg-background/40 hover:bg-card/50 hover:border-border hover:shadow-sm backdrop-blur-sm ${
        isDragging ? "scale-105 shadow-lg rotate-2" : ''
      } ${compact ? 'p-2.5' : 'p-3'}`}
      onClick={handleClick}
    >
      <div className="space-y-2.5">
        {/* Header with title and status */}
        <div className="flex items-start justify-between gap-3">
          <h4 className={`text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1 ${
            compact ? 'leading-tight' : 'text-base leading-snug'
          }`}>
            {objective.title}
          </h4>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StatusIcon
              className={`${
                compact ? 'h-3.5 w-3.5' : 'h-4 w-4'
              } ${status.className} transition-colors`}
            />
          </div>
        </div>

        {/* Description - only show in non-compact mode */}
        {objective.description && !compact && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {objective.description}
          </p>
        )}

        {/* Footer with category */}
        {objective.category && (
          <div className="flex items-center justify-between pt-1">
            <Badge
              variant="secondary"
              className={`text-xs font-medium ${
                compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1'
              }`}
            >
              {objective.category}
            </Badge>
            {!compact && (
              <span className="text-xs text-muted-foreground">
                {status.label}
              </span>
            )}
          </div>
        )}

        {/* Status label for compact mode without category */}
        {!objective.category && !compact && (
          <div className="flex justify-end pt-1">
            <span className="text-xs text-muted-foreground font-medium">
              {status.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}