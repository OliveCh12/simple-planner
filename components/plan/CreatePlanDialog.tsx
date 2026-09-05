"use client";

import { useState } from "react";
import { addDays, formatDuration, intervalToDuration } from "date-fns";
import { Type } from "lucide-react";
import { toast } from "sonner";
import { ColorSwatch } from "@/components/settings/ColorSwatch";
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
import { sampleCategories, samplePeople, samplePlan, sampleTasks } from "@/data/sampleData";
import { DEFAULT_SWATCH } from "@/lib/colors";
import { taskToItem } from "@/lib/domain/convert";
import { createPlan } from "@/lib/plan";
import { getRepository } from "@/lib/repository/create";
import { isValidLocal, parseLocal } from "@/lib/time/local";
import type { HydratedPlan } from "@/types";

interface CreatePlanDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (plan: HydratedPlan) => void;
  /** Suggested color, so consecutive calendars get different marks. */
  defaultColor?: string;
}

function currentYearRange() {
  const year = new Date().getFullYear();
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

function describeRange(start: string, end: string): string {
  if (!isValidLocal(start) || !isValidLocal(end)) return "Pick a start and an end date.";
  const duration = intervalToDuration({
    start: parseLocal(start),
    end: addDays(parseLocal(end), 1),
  });
  const text = formatDuration(duration, { format: ["years", "months", "weeks", "days"] });
  return `${text || "1 day"}.`;
}

export function CreatePlanDialog({
  open,
  onClose,
  onCreated,
  defaultColor = DEFAULT_SWATCH,
}: CreatePlanDialogProps) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(defaultColor);
  const [start, setStart] = useState(() => currentYearRange().start);
  const [end, setEnd] = useState(() => currentYearRange().end);
  const [isLoading, setIsLoading] = useState(false);

  const resolvedEnd = end < start ? start : end;
  const valid = title.trim().length > 0 && isValidLocal(start) && isValidLocal(resolvedEnd);

  const reset = () => {
    const range = currentYearRange();
    setTitle("");
    setColor(defaultColor);
    setStart(range.start);
    setEnd(range.end);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setIsLoading(true);

    try {
      const isSample = title.trim() === samplePlan.title;
      const plan = createPlan({
        title,
        start,
        end: resolvedEnd,
        color,
        description: isSample ? samplePlan.description : undefined,
        tasks: isSample ? sampleTasks(start) : [],
      });

      const { tasks, ...record } = plan;
      const repository = getRepository();
      await repository.plans.put(record);
      if (tasks.length) {
        await repository.items.putMany(tasks.map((task) => taskToItem(task, record.id)));
      }
      if (isSample) {
        await Promise.all([
          ...samplePeople.map((person) => repository.people.put(person)),
          ...sampleCategories.map((category) => repository.categories.put(category)),
        ]);
      }
      onCreated?.(plan);
      reset();
      onClose();
    } catch (error) {
      console.error("Failed to create calendar:", error);
      toast.error("Failed to create calendar. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New calendar</DialogTitle>
          <DialogDescription>
            One calendar per area of your life: personal, a business, a project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="plan-title">Name</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Type />
                </InputGroupAddon>
                <InputGroupInput
                  id="plan-title"
                  value={title}
                  autoFocus
                  required
                  placeholder="Personal, Goji Berry, side project…"
                  onChange={(e) => setTitle(e.target.value)}
                />
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel>Color</FieldLabel>
              <ColorSwatch value={color} onChange={setColor} aria-label="Calendar color" />
            </Field>

            <Field>
              <FieldLabel htmlFor="plan-start">Dates</FieldLabel>
              <ButtonGroup className="w-full [&>*]:flex-1 [&>*]:focus-within:relative [&>*]:focus-within:z-10">
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>From</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="plan-start"
                    type="date"
                    value={start}
                    required
                    onChange={(e) => setStart(e.target.value)}
                  />
                </InputGroup>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>To</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="plan-end"
                    type="date"
                    value={end}
                    min={start}
                    required
                    aria-label="End date"
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </InputGroup>
              </ButtonGroup>
              <FieldDescription>{describeRange(start, resolvedEnd)}</FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="px-0 text-muted-foreground"
              onClick={() => {
                const range = currentYearRange();
                setTitle(samplePlan.title);
                setStart(range.start);
                setEnd(range.end);
              }}
            >
              Use sample template
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !valid}>
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
