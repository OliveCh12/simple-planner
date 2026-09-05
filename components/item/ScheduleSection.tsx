"use client";

import { CalendarOff, CalendarPlus, Flag, X } from "lucide-react";
import { toast } from "sonner";
import { PropertyRow } from "@/components/item/PropertyRow";
import { DateInput, ScheduleField } from "@/components/item/ScheduleField";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useItemMutations } from "@/hooks/useItemMutations";
import { useSaveItem } from "@/hooks/useSaveItem";
import { DomainError, isScheduled, moveItem, setDue, unscheduleItem, updateItem } from "@/lib/domain/items";
import { dueState, quickDates } from "@/lib/planning/views";
import { formatLocalDate, parseLocal } from "@/lib/time/local";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
import type { PlanItem } from "@/types";

/** A date picker behind any trigger, with the same quick choices as the schedule field. */
export function DatePickPopover({
  label,
  weekStartsOn,
  selected,
  onPick,
  children,
}: {
  label: string;
  weekStartsOn: 0 | 1;
  selected?: Date;
  onPick: (date: Date) => void;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-0">
        <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/55">{label}</p>
        <Calendar
          mode="single"
          required
          weekStartsOn={weekStartsOn}
          selected={selected}
          onSelect={(date) => {
            if (date) onPick(date);
          }}
          className="w-full"
        />
        <div className="flex gap-1 border-t p-2">
          {quickDates().map((choice) => (
            <Button key={choice.label} type="button" variant="ghost" size="xs" onClick={() => onPick(parseLocal(choice.date))}>
              {choice.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * When: the slot on the calendar for a scheduled item, or the way to give it
 * one; plus the deadline, which is a separate thing from the work's slot.
 */
export function ScheduleSection({ item }: { item: PlanItem }) {
  const save = useSaveItem();
  const { setDates } = useItemMutations(item);
  const weekStartsOn = useUIStore((s) => s.settings.firstDayOfWeek);
  const scheduled = isScheduled(item);
  const container = item.kind === "project" || item.kind === "objective";
  const dueTone = dueState(item.due);

  const run = (build: () => PlanItem) => {
    try {
      void save(build());
    } catch (error) {
      toast.error(error instanceof DomainError ? error.message : "Failed to save item.");
    }
  };

  return (
    <div className="flex flex-col">
      {scheduled ? (
        <>
          <ScheduleField
            start={item.start}
            end={item.end}
            recurrence={item.recurrence}
            onChange={setDates}
            onRecurrenceChange={(rule) => void save(updateItem(item, { recurrence: rule }))}
          />
          {item.kind !== "event" && (
            <PropertyRow label="">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="-ml-1.5 h-6 text-muted-foreground hover:text-foreground"
                onClick={() => run(() => unscheduleItem(item))}
              >
                <CalendarOff />
                {container ? "Remove dates" : "Take off the calendar"}
              </Button>
            </PropertyRow>
          )}
        </>
      ) : (
        <PropertyRow label={container ? "Dates" : "Slot"}>
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            {quickDates().map((choice) => (
              <Button
                key={choice.label}
                type="button"
                variant="outline"
                size="xs"
                className="h-6"
                onClick={() => run(() => moveItem(item, choice.date))}
              >
                {choice.label}
              </Button>
            ))}
            <DatePickPopover label="Schedule on" weekStartsOn={weekStartsOn} onPick={(date) => run(() => moveItem(item, formatLocalDate(date)))}>
              <Button type="button" variant="ghost" size="xs" className="h-6 text-muted-foreground hover:text-foreground">
                <CalendarPlus />
                Pick a date
              </Button>
            </DatePickPopover>
          </div>
        </PropertyRow>
      )}

      {item.kind !== "event" && (
        <PropertyRow label="Due">
          {item.due ? (
            <div className="flex items-center gap-0.5">
              <Flag
                className={cn(
                  "size-3.5",
                  dueTone === "overdue" ? "text-red-500" : dueTone === "today" ? "text-amber-500" : "text-muted-foreground"
                )}
              />
              <DateInput
                label="Due date"
                value={parseLocal(item.due)}
                weekStartsOn={weekStartsOn}
                onChange={(date) => run(() => setDue(item, formatLocalDate(date)))}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Remove deadline"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => run(() => setDue(item, undefined))}
              >
                <X />
              </Button>
            </div>
          ) : (
            <DatePickPopover label="Due on" weekStartsOn={weekStartsOn} onPick={(date) => run(() => setDue(item, formatLocalDate(date)))}>
              <Button type="button" variant="ghost" size="xs" className="-ml-1.5 h-6 text-muted-foreground hover:text-foreground">
                <Flag />
                Add a deadline
              </Button>
            </DatePickPopover>
          )}
        </PropertyRow>
      )}
    </div>
  );
}
