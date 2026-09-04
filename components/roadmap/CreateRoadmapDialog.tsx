"use client";

import { useState } from "react";
import { Type } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { sampleRoadmapData } from "@/data/sampleData";
import { saveRoadmap } from "@/lib/db";
import { createId, createMonthBlock } from "@/lib/objective";
import type { Roadmap } from "@/types";

interface CreateRoadmapDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (roadmap: Roadmap) => void;
}

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

export function CreateRoadmapDialog({ open, onClose, onCreated }: CreateRoadmapDialogProps) {
  const currentYear = new Date().getFullYear();
  const [title, setTitle] = useState("");
  const [startYear, setStartYear] = useState(currentYear);
  const [endYear, setEndYear] = useState(currentYear);
  const [isLoading, setIsLoading] = useState(false);

  const resolvedEnd = Math.max(startYear, endYear);

  const reset = () => {
    setTitle("");
    setStartYear(currentYear);
    setEndYear(currentYear);
  };

  const setYear = (setter: (year: number) => void) => (raw: number) => {
    if (Number.isFinite(raw)) setter(raw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsLoading(true);

    try {
      const now = new Date().toISOString();
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
      reset();
      onClose();
    } catch (error) {
      console.error("Failed to create roadmap:", error);
      toast.error("Failed to create roadmap. Please try again.");
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
        <form onSubmit={handleSubmit} className="grid gap-5">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="roadmap-title">Title</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Type />
                </InputGroupAddon>
                <InputGroupInput
                  id="roadmap-title"
                  value={title}
                  autoFocus
                  required
                  placeholder="Career, health, side project…"
                  onChange={(e) => setTitle(e.target.value)}
                />
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="roadmap-start">Years</FieldLabel>
              <ButtonGroup className="w-full [&>*]:flex-1 [&>*]:focus-within:relative [&>*]:focus-within:z-10">
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>From</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="roadmap-start"
                    type="number"
                    inputMode="numeric"
                    min={MIN_YEAR}
                    max={MAX_YEAR}
                    value={startYear}
                    onChange={(e) => setYear(setStartYear)(e.target.valueAsNumber)}
                  />
                </InputGroup>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>To</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="roadmap-end"
                    type="number"
                    inputMode="numeric"
                    min={startYear}
                    max={MAX_YEAR}
                    value={endYear}
                    aria-label="Last year"
                    onChange={(e) => setYear(setEndYear)(e.target.valueAsNumber)}
                  />
                </InputGroup>
              </ButtonGroup>
              <FieldDescription>
                {resolvedEnd === startYear
                  ? `12 months in ${startYear}.`
                  : `${(resolvedEnd - startYear + 1) * 12} months, ${startYear} to ${resolvedEnd}.`}
              </FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="px-0 text-muted-foreground"
              onClick={() => {
                setTitle(sampleRoadmapData.title);
                setStartYear(currentYear);
                setEndYear(currentYear + 1);
              }}
            >
              Use sample template
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !title.trim()}>
                {isLoading && <Spinner />}
                Create
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
