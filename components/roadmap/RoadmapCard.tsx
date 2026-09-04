"use client";

import Link from "next/link";
import { CalendarRange, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateDisplay } from "@/lib/date-utils";
import { useUIStore } from "@/store/uiStore";
import type { Roadmap } from "@/types";

interface RoadmapCardProps {
  roadmap: Roadmap;
  onDelete?: (roadmap: Roadmap) => void;
}

export function RoadmapCard({ roadmap, onDelete }: RoadmapCardProps) {
  const dateFormat = useUIStore((s) => s.settings.dateFormat);
  const objectives = Object.values(roadmap.months).flatMap((month) => month.objectives);
  const total = objectives.length;
  const completed = objectives.filter((objective) => objective.status === "completed").length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const years =
    roadmap.startYear === roadmap.endYear
      ? String(roadmap.startYear)
      : `${roadmap.startYear} – ${roadmap.endYear}`;

  return (
    <Card className="group relative gap-4 transition-shadow hover:shadow-md has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring/50">
      <CardHeader>
        <CardTitle className="text-base">
          <Link
            href={`/roadmap/${roadmap.id}`}
            className="outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            {roadmap.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {roadmap.description || `A ${years} timeline.`}
        </CardDescription>
        <CardAction>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${roadmap.title}`}
                className="relative z-10 -mr-2 -mt-2 text-muted-foreground/60 hover:text-destructive"
                onClick={() => onDelete?.(roadmap)}
              >
                <Trash2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete roadmap</TooltipContent>
          </Tooltip>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarRange className="size-3.5" />
            {years}
          </span>
          <span className="tabular-nums">
            {total === 0 ? "No objectives" : `${completed}/${total} done`}
          </span>
        </div>
        <Progress value={progress} aria-label="Completion" className="mt-2 h-1" />
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Opened {formatDateDisplay(roadmap.lastAccessedAt, dateFormat)}
      </CardFooter>
    </Card>
  );
}
