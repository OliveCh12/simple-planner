"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trash2 } from "lucide-react";
import type { Roadmap } from "@/types";
import { formatDateDisplay } from "@/lib/date-utils";
import { useUIStore } from "@/store/uiStore";

interface RoadmapCardProps {
  roadmap: Roadmap;
  onDelete?: (roadmap: Roadmap) => void;
}

export function RoadmapCard({ roadmap, onDelete }: RoadmapCardProps) {
  const objectiveCount = Object.values(roadmap.months).reduce(
    (sum, month) => sum + month.objectives.length,
    0
  );

  const completedCount = Object.values(roadmap.months).reduce(
    (sum, month) => sum + month.objectives.filter((obj) => obj.status === "completed").length,
    0
  );

  const dateFormat = useUIStore((s) => s.settings.dateFormat);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(roadmap);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow h-full relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        className="absolute top-4 right-4 text-muted-foreground hover:text-destructive z-10"
        aria-label={`Delete ${roadmap.title}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <Link href={`/roadmap/${roadmap.id}`} className="block h-full">
        <CardHeader className="pr-12">
          <CardTitle className="text-xl mb-1">{roadmap.title}</CardTitle>
          {roadmap.description && (
            <CardDescription className="line-clamp-2">{roadmap.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {roadmap.startYear} - {roadmap.endYear}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {objectiveCount} {objectiveCount === 1 ? "objective" : "objectives"}
              </Badge>
              {completedCount > 0 && (
                <Badge variant="default" className="bg-green-500">
                  {completedCount} completed
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Last accessed: {formatDateDisplay(roadmap.lastAccessedAt, dateFormat)}
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
