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
import { countCompleted } from "@/lib/plan";
import { useUIStore } from "@/store/uiStore";
import type { Plan } from "@/types";

interface PlanCardProps {
  plan: Plan;
  onDelete?: (plan: Plan) => void;
}

export function PlanCard({ plan, onDelete }: PlanCardProps) {
  const dateFormat = useUIStore((s) => s.settings.dateFormat);
  const total = plan.tasks.length;
  const completed = countCompleted(plan.tasks);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const range = `${formatDateDisplay(plan.start, dateFormat)} – ${formatDateDisplay(plan.end, dateFormat)}`;

  return (
    <Card className="group relative gap-4 transition-shadow hover:shadow-md has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring/50">
      <CardHeader>
        <CardTitle className="text-base">
          <Link
            href={`/plan/${plan.id}`}
            className="outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            {plan.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {plan.description || `A timeline from ${range}.`}
        </CardDescription>
        <CardAction>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${plan.title}`}
                className="relative z-10 -mr-2 -mt-2 text-muted-foreground/60 hover:text-destructive"
                onClick={() => onDelete?.(plan)}
              >
                <Trash2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete plan</TooltipContent>
          </Tooltip>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarRange className="size-3.5" />
            {range}
          </span>
          <span className="tabular-nums">
            {total === 0 ? "No tasks" : `${completed}/${total} done`}
          </span>
        </div>
        <Progress value={progress} aria-label="Completion" className="mt-2 h-1" />
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Opened {formatDateDisplay(plan.lastAccessedAt, dateFormat)}
      </CardFooter>
    </Card>
  );
}
