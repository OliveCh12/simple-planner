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
    label: 'Pending',
    bgClass: 'bg-background/40 hover:bg-card/50'
  },
  'in-progress': {
    icon: Target,
    className: 'text-primary',
    label: 'In Progress',
    bgClass: 'bg-background/40 hover:bg-card/50'
  },
  completed: {
    icon: CheckCircle,
    className: 'text-green-600',
    label: 'Completed',
    bgClass: 'bg-green-50/80 dark:bg-green-950/30 hover:bg-green-100/90 dark:hover:bg-green-900/40 border-green-200/50 dark:border-green-800/30'
  },
  cancelled: {
    icon: XCircle,
    className: 'text-destructive',
    label: 'Cancelled',
    bgClass: 'bg-red-50/80 dark:bg-red-950/30 hover:bg-red-100/90 dark:hover:bg-red-900/40 border-red-200/50 dark:border-red-800/30'
  },
  blocked: {
    icon: AlertTriangle,
    className: 'text-orange-600',
    label: 'Blocked',
    bgClass: 'bg-orange-50/80 dark:bg-orange-950/30 hover:bg-orange-100/90 dark:hover:bg-orange-900/40 border-orange-200/50 dark:border-orange-800/30'
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
      className={`group relative cursor-pointer transition-all duration-200 rounded-lg border backdrop-blur-sm ${
        status.bgClass
      } ${
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
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
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