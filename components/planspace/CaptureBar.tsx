"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { CalendarDot } from "@/components/plan/CalendarDot";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createItem, DomainError } from "@/lib/domain/items";
import { describeQuickAdd, parseQuickAdd } from "@/lib/quickadd";
import { todayLocal } from "@/lib/time/local";
import type { Category, Plan, PlanItem } from "@/types";

interface CaptureBarProps {
  plans: Plan[];
  planId: string;
  categories: Category[];
  placeholder?: string;
  /** Fixed fields for what this bar creates: a parent, a kind, a link. */
  defaults?: Partial<Pick<PlanItem, "parentId" | "kind" | "linkedIds">>;
  onPlanChange: (id: string) => void;
  onCreate: (item: PlanItem) => Promise<boolean>;
}

/**
 * Inline capture at the top of a list. A day, a time or a rhythm in the text
 * schedules the item; otherwise it stays unscheduled where it was captured.
 */
export function CaptureBar({ plans, planId, categories, placeholder = "Add a task", defaults, onPlanChange, onCreate }: CaptureBarProps) {
  const [value, setValue] = useState("");
  const draft = useMemo(() => parseQuickAdd(value, { defaultStart: todayLocal(), categories }), [categories, value]);
  const hint = draft?.dated ? describeQuickAdd(draft, categories) : "";

  const submit = async () => {
    if (!draft || !planId) return;
    try {
      const item = createItem({
        planId,
        title: draft.title,
        kind: defaults?.kind ?? "task",
        parentId: defaults?.parentId,
        linkedIds: defaults?.linkedIds,
        start: draft.dated ? draft.start : undefined,
        end: draft.dated ? draft.end : undefined,
        recurrence: draft.dated ? draft.recurrence : undefined,
        executor: draft.executor,
        categoryId: draft.categoryId,
      });
      if (await onCreate(item)) setValue("");
    } catch (error) {
      toast.error(error instanceof DomainError ? error.message : "Could not add that.");
    }
  };

  return (
    <div className="flex items-start gap-2 px-3 py-2">
      <div className="min-w-0 flex-1">
        <InputGroup className="h-9 bg-background">
          <InputGroupAddon>
            <Plus />
          </InputGroupAddon>
          <InputGroupInput
            value={value}
            placeholder={placeholder}
            aria-label="Capture"
            className="h-9"
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void submit();
              }
              if (event.key === "Escape") setValue("");
            }}
          />
          {value.trim() ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton variant="secondary" onClick={() => void submit()} disabled={!draft || !planId}>
                Add
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
        {hint ? <p className="truncate px-2 pt-1 text-[11px] text-muted-foreground">Scheduled: {hint}</p> : null}
      </div>
      {plans.length > 1 && (
        <Select value={planId} onValueChange={onPlanChange}>
          <SelectTrigger size="sm" aria-label="Calendar" className="h-9 max-w-44 border-transparent bg-transparent shadow-none">
            <SelectValue placeholder="Calendar" />
          </SelectTrigger>
          <SelectContent align="end">
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                <CalendarDot color={plan.color} />
                {plan.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
