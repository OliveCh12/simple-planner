"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { Button } from "@/components/ui/button";
import { SubHeader } from "@/components/layout/SubHeader";
import { useRoadmap } from "@/hooks/useRoadmap";
import { getCenteredMonthKey, useTimelinePan } from "@/hooks/useTimelinePan";
import { useRoadmapStore } from "@/store/roadmapStore";
import { MonthColumn } from "@/components/roadmap/MonthColumn";
import { RemoveDropZone } from "@/components/roadmap/RemoveDropZone";
import { generateMonthKeys, getCurrentMonthKey } from "@/lib/date-utils";
import type { Objective } from "@/types";

function defaultMonthKey(startYear: number, endYear: number): string {
  const currentMonthKey = getCurrentMonthKey();
  const [year] = currentMonthKey.split("-").map(Number);
  if (year >= startYear && year <= endYear) return currentMonthKey;
  return `${startYear}-01`;
}

export default function RoadmapPage() {
  const params = useParams();
  const router = useRouter();
  const roadmapId = typeof params.roadmapId === "string" ? params.roadmapId : "";
  const { roadmap, isLoading } = useRoadmap(roadmapId || null);
  const deleteObjective = useRoadmapStore((s) => s.deleteObjective);
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

  const scrollToMonth = useCallback((monthKey: string, behavior: ScrollBehavior = "smooth") => {
    const column = boardEl?.querySelector(`[data-month-key="${monthKey}"]`);
    column?.scrollIntoView({ inline: "center", block: "nearest", behavior });
  }, [boardEl]);

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
      void deleteObjective(sourceMonthKey, objective.id);
      return;
    }
    if (targetId !== sourceMonthKey) {
      void moveObjective(sourceMonthKey, targetId, objective);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading timeline…
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Roadmap not found</p>
        <Button onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubHeader
        backUrl="/"
        title={roadmap.title}
        subtitle={`${roadmap.startYear}${
          roadmap.endYear !== roadmap.startYear ? ` – ${roadmap.endYear}` : ""
        }`}
        trailing={
          <div className="flex items-center gap-2">
            <p
              className={`hidden items-center gap-1.5 text-xs sm:flex ${
                panReady ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {panReady ? "Drag to pan" : "Hold"}
              <kbd
                aria-pressed={panReady}
                className={`inline-flex h-5 min-w-[2.75rem] items-center justify-center rounded-md border px-1.5 font-mono text-[10px] font-semibold leading-none transition-[transform,box-shadow,background-color,color,border-color] duration-100 ${
                  panReady
                    ? "translate-y-[2px] border-foreground/30 bg-foreground text-background shadow-none"
                    : "border-border bg-muted text-foreground shadow-[0_2px_0_0_var(--border)]"
                }`}
              >
                Space
              </kbd>
              {panReady ? "" : "to pan"}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() =>
                handleSelectMonth(defaultMonthKey(roadmap.startYear, roadmap.endYear))
              }
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="relative min-h-0 flex-1">
        <DragDropProvider
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
        >
          <div
            ref={setBoardEl}
            className={`timeline-board flex h-full min-h-[24rem] items-stretch overflow-x-auto overflow-y-hidden ${
              panning ? "is-panning" : ""
            } ${panReady ? "is-pan-ready" : ""}`}
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
