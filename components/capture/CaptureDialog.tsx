"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Inbox, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { CalendarDot } from "@/components/plan/CalendarDot";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { createItem, DomainError } from "@/lib/domain/items";
import { describeQuickAdd, parseQuickAdd } from "@/lib/quickadd";
import { getRepository } from "@/lib/repository/create";
import { isPlanWritable } from "@/lib/sync/access";
import { formatLocalDateTime, todayLocal } from "@/lib/time/local";
import { usePlannerStore } from "@/store/plannerStore";
import { useUIStore } from "@/store/uiStore";
import type { Category, ItemKind, Plan } from "@/types";

/**
 * Capture in seconds, sort later. A task with no date lands in the inbox;
 * name a day, a time or a rhythm and it goes straight onto the calendar.
 */
export function CaptureDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const currentPlan = usePlannerStore((s) => s.currentPlan);
  const storedCategories = usePlannerStore((s) => s.categories);
  const captureCalendarId = useUIStore((s) => s.captureCalendarId);
  const setCaptureCalendarId = useUIStore((s) => s.setCaptureCalendarId);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>(storedCategories);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<ItemKind>("task");
  const [planId, setPlanId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void Promise.all([getRepository().plans.list(), getRepository().categories.list()]).then(([loaded, cats]) => {
      if (cancelled) return;
      const writable = loaded
        .filter((plan) => isPlanWritable(plan))
        .sort((a, b) => (a.lastAccessedAt < b.lastAccessedAt ? 1 : -1));
      setPlans(writable);
      setCategories(cats);
      const preferred = [currentPlan?.id, captureCalendarId, writable[0]?.id].find((id) =>
        writable.some((plan) => plan.id === id)
      );
      setPlanId(preferred ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [captureCalendarId, currentPlan?.id, open]);

  const draft = useMemo(
    () =>
      parseQuickAdd(text, {
        defaultStart: kind === "event" ? formatLocalDateTime(nextRoundHour()) : todayLocal(),
        categories,
      }),
    [categories, kind, text]
  );
  const scheduled = Boolean(draft && (draft.dated || kind === "event"));
  const hint = draft ? describeQuickAdd(draft, categories) : "";

  const submit = async () => {
    if (!draft || !planId || busy) return;
    setBusy(true);
    try {
      const item = createItem({
        planId,
        title: draft.title,
        kind,
        start: scheduled ? draft.start : undefined,
        end: scheduled ? draft.end : undefined,
        recurrence: scheduled ? draft.recurrence : undefined,
        executor: draft.executor,
        categoryId: draft.categoryId,
      });
      await getRepository().items.put(item);
      setCaptureCalendarId(planId);
      setText("");
      onOpenChange(false);
      const plan = plans.find((entry) => entry.id === planId);
      toast(scheduled ? `Added to ${plan?.title ?? "the calendar"}` : "Captured to the inbox", {
        description: item.title,
        action: {
          label: "Open",
          onClick: () => router.push(scheduled ? `/plan/${planId}?focus=${item.id}` : `/plan?view=inbox&focus=${item.id}`),
        },
      });
    } catch (error) {
      toast.error(error instanceof DomainError ? error.message : "Could not capture that.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[18%] translate-y-0 gap-3 p-4 sm:max-w-lg" showCloseButton={false}>
        <DialogTitle className="sr-only">Capture</DialogTitle>
        <DialogDescription className="sr-only">Add a task or an event in a few words.</DialogDescription>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={kind}
            aria-label="What is it"
            onValueChange={(next) => {
              if (next) setKind(next as ItemKind);
            }}
          >
            <ToggleGroupItem value="task" aria-label="Task" className="gap-1.5 px-2">
              <ListTodo className="size-3.5" />
              Task
            </ToggleGroupItem>
            <ToggleGroupItem value="event" aria-label="Event" className="gap-1.5 px-2">
              <CalendarDays className="size-3.5" />
              Event
            </ToggleGroupItem>
          </ToggleGroup>
          <span className="flex-1" />
          <Select value={planId} onValueChange={setPlanId}>
            <SelectTrigger size="sm" aria-label="Calendar" className="max-w-48 border-transparent bg-transparent shadow-none">
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
        </div>
        <Input
          autoFocus
          value={text}
          placeholder={kind === "event" ? "Lunch with Sam tomorrow 12:30 #family" : "Call the plumber #home"}
          aria-label="Capture"
          className="h-10 text-[15px] md:text-[15px]"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <div className="flex min-h-5 items-center gap-2 text-xs text-muted-foreground">
          {draft ? (
            scheduled ? (
              <>
                <CalendarDays className="size-3.5" />
                <span className="truncate">{hint}</span>
              </>
            ) : (
              <>
                <Inbox className="size-3.5" />
                <span className="truncate">To the inbox, unscheduled. Add “tomorrow”, “fri 9am” or “every week” to place it.</span>
              </>
            )
          ) : (
            <span>Type a few words. Tokens: today, tomorrow, mon…sun, 9am, every week, until Aug 31, #category, @ai.</span>
          )}
          <span className="flex-1" />
          <Button type="button" size="sm" disabled={!draft || !planId || busy} onClick={() => void submit()}>
            Add <Kbd className="ml-1 bg-primary-foreground/15 text-primary-foreground">↵</Kbd>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function nextRoundHour(): Date {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  return now;
}
