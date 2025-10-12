'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trash2 } from 'lucide-react';
import type { Roadmap } from '@/types';
import { formatDateDisplay } from '@/lib/date-utils';

interface RoadmapCardProps {
  roadmap: Roadmap;
  onDelete?: (id: string) => void;
}

export function RoadmapCard({ roadmap, onDelete }: RoadmapCardProps) {
  const objectiveCount = Object.values(roadmap.months).reduce(
    (sum, month) => sum + month.objectives.length,
    0
  );
  
  const completedCount = Object.values(roadmap.months).reduce(
    (sum, month) => 
      sum + month.objectives.filter(obj => obj.status === 'completed').length,
    0
  );

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm(`Are you sure you want to delete "${roadmap.title}"?`)) {
      onDelete?.(roadmap.id);
    }
  };

  return (
    <Link href={`/roadmap/${roadmap.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-1">{roadmap.title}</CardTitle>
              {roadmap.description && (
                <CardDescription className="line-clamp-2">
                  {roadmap.description}
                </CardDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-muted-foreground hover:text-destructive -mt-2 -mr-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{roadmap.startYear} - {roadmap.endYear}</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {objectiveCount} {objectiveCount === 1 ? 'objective' : 'objectives'}
              </Badge>
              {completedCount > 0 && (
                <Badge variant="default" className="bg-green-500">
                  {completedCount} completed
                </Badge>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground">
              Last accessed: {formatDateDisplay(roadmap.lastAccessedAt, 'MMM d, yyyy')}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
