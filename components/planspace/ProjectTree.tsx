"use client";

import { useState } from "react";
import { ChevronRight, Circle, CircleCheck, Plus } from "lucide-react";
import { toast } from "sonner";
import { ProgressDonut } from "@/components/item/ProgressDonut";
import { CalendarDot } from "@/components/plan/CalendarDot";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSaveItem } from "@/hooks/useSaveItem";
import { getKindOption, getStatusOption } from "@/lib/constants";
import { applyStatus, DomainError, isScheduled } from "@/lib/domain/items";
import { dueState, type PlanNode } from "@/lib/planning/views";
import { itemDatesLabel } from "@/lib/time/labels";
import { cn } from "@/lib/utils";
import type { Category, ItemKind, Plan, PlanItem } from "@/types";

const ProjectIcon = getKindOption("project").icon;

interface ProjectTreeProps {
  nodes: PlanNode[];
  plans: Plan[];
  categories: Category[];
  showCalendar: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateChild: (parent: PlanItem, kind: ItemKind) => void;
}

function nodeIds(nodes: PlanNode[], into: Set<string>, depthLimit: number, depth = 0): Set<string> {
  for (const node of nodes) {
    if (node.children.length > 0 && depth < depthLimit) into.add(node.item.id);
    nodeIds(node.children, into, depthLimit, depth + 1);
  }
  return into;
}

/**
 * Objectives, projects, tasks and subtasks as one outline. Containers show
 * their progress; leaves show their place in time. Expansion is local to
 * the view so a big tree can be folded down to what matters.
 */
export function ProjectTree({ nodes, plans, categories, showCalendar, selectedId, onSelect, onCreateChild }: ProjectTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => nodeIds(nodes, new Set(), 1));
  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (nodes.length === 0) {
    return (
      <Empty className="flex-1 border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ProjectIcon className="size-5" />
          </EmptyMedia>
          <EmptyTitle>No projects yet</EmptyTitle>
          <EmptyDescription>A project holds the tasks of one initiative. A goal can group several projects.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-2 py-2">
      {nodes.map((node) => (
        <TreeRow
          key={node.item.id}
          node={node}
          depth={0}
          expanded={expanded}
          onToggle={toggle}
          plans={plans}
          categories={categories}
          showCalendar={showCalendar}
          selectedId={selectedId}
          onSelect={onSelect}
          onCreateChild={onCreateChild}
        />
      ))}
    </div>
  );
}

function TreeRow({
  node,
  depth,
  expanded,
  onToggle,
  plans,
  categories,
  showCalendar,
  selectedId,
  onSelect,
  onCreateChild,
}: {
  node: PlanNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
} & Omit<ProjectTreeProps, "nodes">) {
  const { item } = node;
  const save = useSaveItem();
  const kind = getKindOption(item.kind);
  const status = getStatusOption(item.status);
  const container = item.kind === "objective" || item.kind === "project";
  const open = expanded.has(item.id);
  const hasChildren = node.children.length > 0;
  const selected = item.id === selectedId;
  const done = item.status === "completed";
  const category = item.categoryId ? categories.find((entry) => entry.id === item.categoryId) : undefined;
  const plan = showCalendar && depth === 0 ? plans.find((entry) => entry.id === item.planId) : undefined;
  const due = dueState(item.due);
  const when = isScheduled(item) ? itemDatesLabel({ start: item.start, end: item.end }) : undefined;

  const complete = () => {
    try {
      void save(applyStatus(item, done ? "pending" : "completed"));
    } catch (error) {
      toast.error(error instanceof DomainError ? error.message : "Failed to save item.");
    }
  };

  return (
    <div>
      <div
        data-plan-row={item.id}
        className={cn(
          "group/row flex h-8 min-w-0 items-center gap-1 rounded-md pr-1 [contain-intrinsic-size:auto_32px] [content-visibility:auto]",
          selected ? "bg-accent" : "hover:bg-accent/60",
          done && "opacity-60"
        )}
        style={{ paddingLeft: depth * 18 + 2 }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={open ? "Collapse" : "Expand"}
            aria-expanded={open}
            className="flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onToggle(item.id)}
          >
            <ChevronRight className={cn("size-3.5 transition-transform duration-150 ease-out", open && "rotate-90")} />
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}
        {container ? (
          <span className="flex size-5 shrink-0 items-center justify-center">
            {node.progress.total > 0 ? (
              <ProgressDonut done={node.progress.done} total={node.progress.total} size={14} stroke={2.5} label={false} color={category?.color} />
            ) : (
              <kind.icon className="size-3.5 text-muted-foreground" style={category ? { color: category.color } : undefined} />
            )}
          </span>
        ) : (
          <button
            type="button"
            aria-label={done ? `Reopen ${item.title}` : `Complete ${item.title}`}
            className="flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            onClick={complete}
          >
            {done ? <CircleCheck className="size-3.5 text-emerald-500" /> : item.kind === "event" ? <kind.icon className="size-3.5" /> : <Circle className="size-3.5" />}
          </button>
        )}
        <button
          type="button"
          aria-current={selected ? "true" : undefined}
          className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onSelect(item.id)}
        >
          <span
            className={cn(
              "min-w-0 truncate text-[13px]",
              container && "font-medium",
              item.kind === "objective" && "text-[13.5px]",
              done && "line-through"
            )}
          >
            {item.title || <span className="italic text-muted-foreground">Untitled</span>}
          </span>
          {container && node.progress.total > 0 && (
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {node.progress.done}/{node.progress.total}
            </span>
          )}
          <span className="flex-1" />
          <span className="flex shrink-0 items-center gap-2 text-[11.5px] text-muted-foreground">
            {item.status !== "pending" && !done && <status.icon className={cn("size-3.5", status.className)} />}
            {when && <span className="hidden tabular-nums sm:inline">{when}</span>}
            {item.due && (
              <span
                className={cn(
                  "rounded-sm px-1 py-px tabular-nums",
                  due === "overdue" && "bg-red-500/10 text-red-600 dark:text-red-400",
                  due === "today" && "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                )}
              >
                Due {item.due.slice(5).replace("-", "/")}
              </span>
            )}
            {plan && <CalendarDot color={plan.color} />}
          </span>
        </button>
        {container && (
          <span className="flex shrink-0 items-center opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
            {item.kind === "objective" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="xs" className="h-6 text-muted-foreground hover:text-foreground" onClick={() => onCreateChild(item, "project")}>
                    <Plus />
                    Project
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New project under this goal</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="xs" className="h-6 text-muted-foreground hover:text-foreground" onClick={() => onCreateChild(item, "task")}>
                  <Plus />
                  Task
                </Button>
              </TooltipTrigger>
              <TooltipContent>New task here</TooltipContent>
            </Tooltip>
          </span>
        )}
      </div>
      {open &&
        node.children.map((child) => (
          <TreeRow
            key={child.item.id}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            plans={plans}
            categories={categories}
            showCalendar={showCalendar}
            selectedId={selectedId}
            onSelect={onSelect}
            onCreateChild={onCreateChild}
          />
        ))}
    </div>
  );
}
