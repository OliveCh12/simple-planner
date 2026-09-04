"use client";

import { useState } from "react";
import { CalendarRange, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { saveRoadmap } from "@/lib/db";
import { createId, createMonthBlock } from "@/lib/objective";
import { sampleRoadmapData } from "@/data/sampleData";
import { useUIStore } from "@/store/uiStore";
import type { Roadmap } from "@/types";

interface CreateRoadmapSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (roadmap: Roadmap) => void;
}

export function CreateRoadmapSheet({ open, onClose, onCreated }: CreateRoadmapSheetProps) {
  const currentYear = new Date().getFullYear();
  const [title, setTitle] = useState("");
  const [startYear, setStartYear] = useState(currentYear);
  const [endYear, setEndYear] = useState(currentYear);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsLoading(true);

    try {
      const now = new Date().toISOString();
      const resolvedEnd = Math.max(startYear, endYear);
      const newRoadmap: Roadmap = {
        id: createId(),
        title: title.trim(),
        startYear,
        endYear: resolvedEnd,
        months: {},
        createdAt: now,
        updatedAt: now,
        lastAccessedAt: now,
      };

      if (title.trim() === sampleRoadmapData.title) {
        sampleRoadmapData.objectives.forEach(({ month, objectives }) => {
          const [, monthStr] = month.split("-");
          const year = parseInt(month.slice(0, 4), 10);
          const adjustedYear = startYear + (year - 2025);
          const adjustedMonth = `${adjustedYear}-${monthStr.padStart(2, "0")}`;
          newRoadmap.months[adjustedMonth] = createMonthBlock(
            adjustedMonth,
            objectives.map((obj) => ({
              ...obj,
              id: createId(),
              createdAt: now,
              updatedAt: now,
            }))
          );
        });
      }

      await saveRoadmap(newRoadmap);
      onCreated?.(newRoadmap);
      setTitle("");
      setStartYear(currentYear);
      setEndYear(currentYear);
      onClose();
    } catch (error) {
      console.error("Failed to create roadmap:", error);
      useUIStore.getState().notify("Failed to create roadmap. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New roadmap</DialogTitle>
          <DialogDescription>A timeline for one life area or project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <InputGroup>
            <InputGroupAddon>
              <Type />
            </InputGroupAddon>
            <InputGroupInput
              id="title"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Career, health, side project…"
              required
            />
          </InputGroup>

          <div className="grid grid-cols-2 gap-3">
            <InputGroup>
              <InputGroupAddon>
                <CalendarRange />
              </InputGroupAddon>
              <InputGroupInput
                id="startYear"
                type="number"
                value={startYear}
                min={2020}
                max={2100}
                onChange={(e) => setStartYear(parseInt(e.target.value, 10))}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>From</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <InputGroup>
              <InputGroupInput
                id="endYear"
                type="number"
                value={endYear}
                min={startYear}
                max={2100}
                onChange={(e) => setEndYear(parseInt(e.target.value, 10))}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>To</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </div>

          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            onClick={() => {
              setTitle(sampleRoadmapData.title);
              setStartYear(currentYear);
              setEndYear(currentYear + 1);
            }}
          >
            Use sample template
          </button>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
