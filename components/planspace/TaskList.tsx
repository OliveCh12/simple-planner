"use client";

import { useState } from "react";
import { CalendarPlus, CircleCheck, FolderKanban, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { DatePickPopover } from "@/components/item/ScheduleSection";
import { TaskRow, type TaskRowContext } from "@/components/planspace/TaskRow";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useSaveItem } from "@/hooks/useSaveItem";
import { getKindOption } from "@/lib/constants";
import { applyStatus, canParent, moveItem, setParent } from "@/lib/domain/items";
import type { ItemGroup } from "@/lib/planning/views";
import { formatLocalDate } from "@/lib/time/local";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";
import { useUIStore } from "@/store/uiStore";
import type { PlanItem } from "@/types";

interface TaskListProps {
  groups: ItemGroup[];
  context: TaskRowContext;
  selectedId: string | null;
  onSelect: (id: string) => void;
  empty: { icon: React.ReactNode; title: string; description: string };
}

/**
 * Grouped rows with multi-select. Checking any row reveals a bar for the
 * actions that make sense on many tasks at once.
 */
export function TaskList({ groups, context, selectedId, onSelect, empty }: TaskListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const save = useSaveItem();
  const deleteItem = usePlannerStore((s) => s.deleteItem);
  const items = usePlannerStore((s) => s.items);
  const weekStartsOn = useUIStore((s) => s.settings.firstDayOfWeek);
  const visibleIds = new Set(groups.flatMap((group) => group.items.map((item) => item.id)));
  const active = [...checked].filter((id) => visibleIds.has(id));
  const anyChecked = active.length > 0;
  const total = visibleIds.size;

  const toggle = (id: string, next: boolean) =>
    setChecked((current) => {
      const copy = new Set(current);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  const clear = () => setChecked(new Set());
  const targets = () => active.map((id) => context.byId.get(id)).filter((item): item is PlanItem => Boolean(item));

  const applyAll = async (label: string, build: (item: PlanItem) => PlanItem | null) => {
    let count = 0;
    for (const item of targets()) {
      try {
        const next = build(item);
        if (!next) continue;
        if (await save(next)) count += 1;
      } catch {
        // Skip the ones the rule refuses; the count says how many went through.
      }
    }
    toast(`${label}: ${count} of ${active.length}`);
    clear();
  };

  const containerOptions = items
    .filter((item) => (item.kind === "project" || item.kind === "objective") && !item.draft)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => ({ value: item.id, label: item.title, keywords: getKindOption(item.kind).label }));

  if (total === 0) {
    return (
      <Empty className="flex-1 border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">{empty.icon}</EmptyMedia>
          <EmptyTitle>{empty.title}</EmptyTitle>
          <EmptyDescription>{empty.description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-2 pb-16">
        {groups.map((group) => (
          <section key={group.id} className="pt-2">
            {group.label && (
              <h3 className="flex h-7 items-center gap-2 px-2 text-[11.5px] font-semibold uppercase tracking-wider text-foreground/55">
                {group.color && <span className="size-2 rounded-full" style={{ backgroundColor: group.color }} />}
                {group.label}
                <span className="font-medium tabular-nums opacity-70">{group.items.length}</span>
              </h3>
            )}
            <div className="flex flex-col">
              {group.items.map((item) => (
                <TaskRow
                  key={item.id}
                  item={item}
                  context={context}
                  selected={item.id === selectedId}
                  checked={checked.has(item.id)}
                  anyChecked={anyChecked}
                  onSelect={() => onSelect(item.id)}
                  onCheck={(next) => toggle(item.id, next)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-3 flex justify-center transition-[opacity,transform] duration-150 ease-out",
          anyChecked ? "opacity-100" : "translate-y-2 opacity-0"
        )}
        aria-hidden={!anyChecked}
      >
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-cal-line-strong bg-background/95 py-1 pr-1 pl-3 text-xs shadow-md backdrop-blur">
          <span className="mr-1 font-medium tabular-nums">{active.length} selected</span>
          <Button type="button" variant="ghost" size="xs" className="h-6" onClick={() => void applyAll("Completed", (item) => applyStatus(item, "completed"))}>
            <CircleCheck />
            Complete
          </Button>
          <DatePickPopover
            label="Schedule on"
            weekStartsOn={weekStartsOn}
            onPick={(date) => void applyAll("Scheduled", (item) => (item.kind === "task" ? moveItem(item, formatLocalDate(date)) : null))}
          >
            <Button type="button" variant="ghost" size="xs" className="h-6">
              <CalendarPlus />
              Schedule
            </Button>
          </DatePickPopover>
          <Combobox
            variant="ghost"
            aria-label="Move to project"
            options={containerOptions}
            placeholder="Project"
            searchPlaceholder="Search projects and goals…"
            onValueChange={(value) => {
              const id = Array.isArray(value) ? value[0] : value;
              const parent = id ? context.byId.get(id) : undefined;
              if (!parent) return;
              void applyAll("Moved", (item) =>
                item.planId === parent.planId && canParent(item.kind, parent.kind) ? setParent(item, parent.id, items) : null
              );
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="h-6 text-destructive hover:text-destructive"
            onClick={() => {
              const ids = [...active];
              clear();
              void Promise.all(ids.map((id) => deleteItem(id))).then(() => toast(`Deleted ${ids.length}`));
            }}
          >
            <Trash2 />
            Delete
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" aria-label="Clear selection" onClick={clear}>
            <X />
          </Button>
        </div>
      </div>
      <FolderKanban className="hidden" />
    </div>
  );
}
