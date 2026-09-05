"use client";

import { Bot, CalendarOff, CalendarPlus, Circle, CircleCheck, Copy, FolderKanban, MoreHorizontal, Repeat, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DatePickPopover } from "@/components/item/ScheduleSection";
import { CalendarDot } from "@/components/plan/CalendarDot";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeleteItem } from "@/hooks/useItemActions";
import { useSaveItem } from "@/hooks/useSaveItem";
import { getKindOption, getStatusOption } from "@/lib/constants";
import { applyStatus, DomainError, duplicateItem, isScheduled, moveItem, setKind, unscheduleItem } from "@/lib/domain/items";
import { objectiveOf, projectOf } from "@/lib/domain/tree";
import { dueState } from "@/lib/planning/views";
import { itemDatesLabel } from "@/lib/time/labels";
import { formatLocalDate } from "@/lib/time/local";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";
import { useUIStore } from "@/store/uiStore";
import type { Category, Plan, PlanItem } from "@/types";

export interface TaskRowContext {
  byId: Map<string, PlanItem>;
  plans: Plan[];
  categories: Category[];
  /** Print the calendar dot: only useful when more than one calendar is in view. */
  showCalendar: boolean;
  /** Hide the project crumb, e.g. when rows are already grouped by project. */
  hideProject?: boolean;
}

interface TaskRowProps {
  item: PlanItem;
  context: TaskRowContext;
  selected: boolean;
  checked: boolean;
  anyChecked: boolean;
  onSelect: () => void;
  onCheck: (checked: boolean) => void;
}

function dueLabel(due: string): string {
  const date = new Date(Number(due.slice(0, 4)), Number(due.slice(5, 7)) - 1, Number(due.slice(8, 10)));
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/**
 * One line per task: done toggle, title, then the context that helps decide
 * what to do with it. Actions appear on hover so a long list stays quiet.
 */
export function TaskRow({ item, context, selected, checked, anyChecked, onSelect, onCheck }: TaskRowProps) {
  const save = useSaveItem();
  const deleteItem = useDeleteItem();
  const items = usePlannerStore((s) => s.items);
  const weekStartsOn = useUIStore((s) => s.settings.firstDayOfWeek);
  const done = item.status === "completed";
  const kind = getKindOption(item.kind);
  const status = getStatusOption(item.status);
  const container = context.hideProject ? undefined : (projectOf(item, context.byId) ?? objectiveOf(item, context.byId));
  const showContainer = container && container.id !== item.id;
  const plan = context.showCalendar ? context.plans.find((entry) => entry.id === item.planId) : undefined;
  const category = item.categoryId ? context.categories.find((entry) => entry.id === item.categoryId) : undefined;
  const due = dueState(item.due);
  const scheduled = isScheduled(item);
  const subtasks = items.filter((entry) => entry.parentId === item.id);
  const subDone = subtasks.filter((entry) => entry.status === "completed" || entry.status === "cancelled").length;

  const run = (build: () => PlanItem) => {
    try {
      void save(build());
    } catch (error) {
      toast.error(error instanceof DomainError ? error.message : "Failed to save item.");
    }
  };

  return (
    <div
      data-plan-row={item.id}
      className={cn(
        "group/row flex h-9 min-w-0 items-center gap-2 rounded-md pr-1 pl-1 [contain-intrinsic-size:auto_36px] [content-visibility:auto]",
        selected ? "bg-accent" : "hover:bg-accent/60",
        done && "opacity-60"
      )}
    >
      <span className={cn("flex size-6 shrink-0 items-center justify-center", !anyChecked && "opacity-0 group-hover/row:opacity-100 focus-within:opacity-100")}>
        <Checkbox checked={checked} aria-label={`Select ${item.title}`} onCheckedChange={(next) => onCheck(next === true)} />
      </span>
      <button
        type="button"
        aria-label={done ? `Reopen ${item.title}` : `Complete ${item.title}`}
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => run(() => applyStatus(item, done ? "pending" : "completed"))}
      >
        {done ? <CircleCheck className="size-4 text-emerald-500" /> : <Circle className="size-4" />}
      </button>
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onSelect}
      >
        {item.kind !== "task" && <kind.icon className="size-3.5 shrink-0 text-muted-foreground" />}
        <span className={cn("min-w-0 truncate text-[13px]", done && "line-through")}>{item.title || <span className="italic text-muted-foreground">Untitled</span>}</span>
        {subtasks.length > 0 && (
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {subDone}/{subtasks.length}
          </span>
        )}
        <span className="min-w-0 flex-1" />
        <span className="flex shrink-0 items-center gap-2 text-[11.5px] text-muted-foreground">
          {item.executor === "ai" && <Bot className="size-3.5" aria-label="AI executor" />}
          {item.status !== "pending" && !done && <status.icon className={cn("size-3.5", status.className)} />}
          {showContainer && (
            <span className="hidden max-w-40 items-center gap-1 truncate md:inline-flex">
              {container.kind === "project" ? <FolderKanban className="size-3" /> : <KindGlyph kind={container.kind} />}
              <span className="truncate">{container.title}</span>
            </span>
          )}
          {scheduled && (
            <span className="hidden items-center gap-1 tabular-nums sm:inline-flex">
              {item.recurrence && <Repeat className="size-3" />}
              {itemDatesLabel({ start: item.start, end: item.end })}
            </span>
          )}
          {item.due && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-sm px-1 py-px tabular-nums",
                due === "overdue" && "bg-red-500/10 text-red-600 dark:text-red-400",
                due === "today" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                (due === "soon" || due === "later") && "bg-foreground/5"
              )}
            >
              Due {dueLabel(item.due)}
            </span>
          )}
          {category && <span aria-label={category.name} title={category.name} className="size-2 rounded-full" style={{ backgroundColor: category.color }} />}
          {plan && <CalendarDot color={plan.color} className="ml-0.5" />}
        </span>
      </button>
      <span className="flex shrink-0 items-center opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
        {item.kind === "task" && !scheduled && (
          <DatePickPopover label="Schedule on" weekStartsOn={weekStartsOn} onPick={(date) => run(() => moveItem(item, formatLocalDate(date)))}>
            <Button type="button" variant="ghost" size="icon-xs" aria-label="Schedule" className="text-muted-foreground hover:text-foreground">
              <CalendarPlus />
            </Button>
          </DatePickPopover>
        )}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon-xs" aria-label="More" className="text-muted-foreground hover:text-foreground">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>More</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            {item.kind === "task" && scheduled && (
              <DropdownMenuItem onSelect={() => run(() => unscheduleItem(item))}>
                <CalendarOff />
                Take off the calendar
              </DropdownMenuItem>
            )}
            {item.kind === "task" && (
              <DropdownMenuItem onSelect={() => run(() => setKind(item, "event", items))}>
                <kind.icon />
                Make it an event
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => run(() => duplicateItem(item))}>
              <Copy />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => void deleteItem(item)}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
    </div>
  );
}

function KindGlyph({ kind }: { kind: PlanItem["kind"] }) {
  const Icon = getKindOption(kind).icon;
  return <Icon className="size-3" />;
}
