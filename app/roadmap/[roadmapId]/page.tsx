"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Waypoints } from "lucide-react";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { SubHeader } from "@/components/layout/SubHeader";
import { MonthColumn } from "@/components/roadmap/MonthColumn";
import { RemoveDropZone } from "@/components/roadmap/RemoveDropZone";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeleteObjective } from "@/hooks/useObjectiveActions";
import { useRoadmap } from "@/hooks/useRoadmap";
import { getCenteredMonthKey, useTimelinePan } from "@/hooks/useTimelinePan";
import { generateMonthKeys, getCurrentMonthKey } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { useRoadmapStore } from "@/store/roadmapStore";
import type { Objective } from "@/types";

function defaultMonthKey(startYear: number, endYear: number): string {
  const currentMonthKey = getCurrentMonthKey();
  const [year] = currentMonthKey.split("-").map(Number);
  if (year >= startYear && year <= endYear) return currentMonthKey;
  return `${startYear}-01`;
}

export default function RoadmapPage() {
  const params = useParams();
  const roadmapId = typeof params.roadmapId === "string" ? params.roadmapId : "";
  const { roadmap, isLoading } = useRoadmap(roadmapId || null);
  const deleteObjective = useDeleteObjective();
  const moveObjective = useRoadmapStore((s) => s.moveObjective);

  const [boardEl, setBoardEl] = useState<HTMLDivElement | null>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { panning, panReady } = useTimelinePan(boardEl, !isDragging);

  const startYear = roadmap?.startYear;
  const endYear = roadmap?.endYear;
  const monthKeys = useMemo(
    () => (startYear != null && endYear != null ? generateMonthKeys(startYear, endYear) : []),
    [startYear, endYear]
  );
  const effectiveMonthKey =
    selectedMonthKey ??
    (roadmap ? defaultMonthKey(roadmap.startYear, roadmap.endYear) : null);

  const scrollToMonth = useCallback(
    (monthKey: string, behavior: ScrollBehavior = "smooth") => {
      const column = boardEl?.querySelector(`[data-month-key="${monthKey}"]`);
      column?.scrollIntoView({ inline: "center", block: "nearest", behavior });
    },
    [boardEl]
  );

  useEffect(() => {
    if (!roadmap) return;
    const key = defaultMonthKey(roadmap.startYear, roadmap.endYear);
    const frame = window.requestAnimationFrame(() => scrollToMonth(key, "auto"));
    return () => window.cancelAnimationFrame(frame);
    // Center once when opening a roadmap, not after every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmap?.id, scrollToMonth]);

  const handleSelectMonth = (monthKey: string) => {
    setSelectedMonthKey(monthKey);
    scrollToMonth(monthKey);
  };

  const shiftMonth = useCallback(
    (delta: number) => {
      if (monthKeys.length === 0) return;
      const centered = boardEl ? getCenteredMonthKey(boardEl) : null;
      const current = centered ?? effectiveMonthKey ?? monthKeys[0];
      const index = monthKeys.indexOf(current);
      const next = monthKeys[Math.min(monthKeys.length - 1, Math.max(0, index + delta))];
      if (!next) return;
      setSelectedMonthKey(next);
      scrollToMonth(next);
    },
    [boardEl, effectiveMonthKey, monthKeys, scrollToMonth]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement) {
        const tag = event.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        shiftMonth(1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        shiftMonth(-1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shiftMonth]);

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    if (event.canceled || !roadmap) return;

    const { source, target } = event.operation;
    if (!source || !target) return;

    const data = source.data as { objective?: Objective; roadmapId?: string } | undefined;
    const objective = data?.objective;
    if (!objective || data?.roadmapId !== roadmapId) return;

    const sourceMonthKey = findObjectiveMonth(roadmap, objective.id);
    if (!sourceMonthKey) return;

    const targetId = String(target.id);
    if (targetId === "remove-zone") {
      void deleteObjective(sourceMonthKey, objective);
      return;
    }
    if (targetId !== sourceMonthKey) {
      void moveObjective(sourceMonthKey, targetId, objective);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="text-muted-foreground" />
      </div>
    );
  }

  if (!roadmap) {
    return (
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Waypoints />
          </EmptyMedia>
          <EmptyTitle>Roadmap not found</EmptyTitle>
          <EmptyDescription>It may have been deleted, or the link is out of date.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft />
              All roadmaps
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const years =
    roadmap.startYear === roadmap.endYear
      ? String(roadmap.startYear)
      : `${roadmap.startYear} – ${roadmap.endYear}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubHeader backUrl="/" title={roadmap.title} subtitle={years}>
        <p
          className={cn(
            "hidden items-center gap-1.5 text-xs transition-colors md:flex",
            panReady ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {panReady ? "Drag to pan" : "Hold"}
          <Kbd
            aria-pressed={panReady}
            className={cn("transition-colors", panReady && "bg-foreground text-background")}
          >
            Space
          </Kbd>
          {!panReady && "to pan"}
        </p>
        <ButtonGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous month"
                onClick={() => shiftMonth(-1)}
              >
                <ChevronLeft />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Previous month <Kbd>←</Kbd>
            </TooltipContent>
          </Tooltip>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSelectMonth(defaultMonthKey(roadmap.startYear, roadmap.endYear))}
          >
            <CalendarDays />
            Today
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next month"
                onClick={() => shiftMonth(1)}
              >
                <ChevronRight />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Next month <Kbd>→</Kbd>
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>
      </SubHeader>

      <div className="relative min-h-0 flex-1">
        <DragDropProvider
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
        >
          <div
            ref={setBoardEl}
            className={cn(
              "timeline-board flex h-full min-h-[24rem] items-stretch overflow-x-auto overflow-y-hidden",
              panning && "is-panning",
              panReady && "is-pan-ready"
            )}
          >
            {monthKeys.map((monthKey) => (
              <MonthColumn
                key={monthKey}
                monthKey={monthKey}
                roadmap={roadmap}
                selected={monthKey === effectiveMonthKey}
                onSelect={() => handleSelectMonth(monthKey)}
              />
            ))}
          </div>
          <RemoveDropZone isDragging={isDragging} />
        </DragDropProvider>
      </div>
    </div>
  );
}

function findObjectiveMonth(
  roadmap: { months: Record<string, { objectives: Objective[] }> },
  objectiveId: string
): string | null {
  for (const [monthKey, monthData] of Object.entries(roadmap.months)) {
    if (monthData?.objectives.some((obj) => obj.id === objectiveId)) {
      return monthKey;
    }
  }
  return null;
}
