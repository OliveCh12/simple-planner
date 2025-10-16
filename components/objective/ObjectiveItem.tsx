'use client';

import { useRouter } from 'next/navigation';
import { useDraggable } from '@dnd-kit/react';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { Objective } from '@/types';

interface ObjectiveItemProps {
  objective: Objective;
  roadmapId: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    className: 'text-muted-foreground'
  },
  'in-progress': {
    icon: Target,
    className: 'text-primary'
  },
  completed: {
    icon: CheckCircle,
    className: 'text-chart-2'
  },
  cancelled: {
    icon: XCircle,
    className: 'text-destructive'
  },
  blocked: {
    icon: AlertTriangle,
    className: 'text-chart-3'
  },
};

export function ObjectiveItem({ objective, roadmapId }: ObjectiveItemProps) {
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
      className={`group text-sm space-y-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 cursor-pointer transition-all duration-200 border border-transparent hover:border-muted-foreground/20 hover:shadow-sm ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={handleClick}
    >

      {/* Title */}
      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1 line-clamp-2">
        {objective.title}
      </h4>

      {/* Description */}
      {objective.description && (
        <p className="text-xs text-muted-foreground line-clamp-1">
          {objective.description}
        </p>
      )}

            {/* Footer with status icon and category */}
      <div className="flex items-center justify-between mb-2">
        {objective.category && (
          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
            {objective.category}
          </Badge>
        )}

        <StatusIcon className={`h-4 w-4 ${status.className}`} />
      </div>

    </div>
  );
}