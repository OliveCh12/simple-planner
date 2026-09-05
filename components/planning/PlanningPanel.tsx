"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarPlus, ChevronRight, Repeat } from "lucide-react";
import { useCalendarUi } from "@/components/calendar/calendar-ui";
import { ProgressDonut } from "@/components/item/ProgressDonut";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getKindOption, getStatusOption } from "@/lib/constants";
import { isScheduled } from "@/lib/domain/items";
import { planningContext, type PlanningObjective, type PlanningProject } from "@/lib/planning/context";
import { dueState } from "@/lib/planning/views";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";
import type { PlanItem, TimeScale } from "@/types";
import type { Interval } from "@/lib/time/local";

interface PlanningPanelProps {
  range: Interval;
  scale: TimeScale;
  periodLabel: string;
}

/**
 * The plan for the visible period: goals with their projects and work, prep
 * before events, and tasks still to place. Contextual by design — the full
 * list lives in Plan. Reads as an outline; hierarchy comes from indent and
 * type, not from fills.
 */
export function PlanningPanel({ range, scale }: PlanningPanelProps) {
  const items = usePlannerStore((s) => s.items);
  const categories = usePlannerStore((s) => s.categories);
  const colorById = new Map(categories.map((category) => [category.id, category.color]));
  const zoom = scale === "hour" ? "day" : scale;
  const context = planningContext(items, range, zoom);
  const empty =
    context.objectives.length === 0 &&
    context.projects.length === 0 &&
    context.prep.length === 0 &&
    context.toSchedule.length === 0;
  const openByDefault = zoom === "week" || zoom === "day";

  return (
    <div className="scroll-thin flex h-full min-h-0 flex-col overflow-y-auto px-2 py-3">
      {empty ? (
        <div className="flex flex-col gap-2 px-2 pt-1 text-[13px] leading-relaxed text-muted-foreground">
          <p>Nothing planned for this period. Goals, projects and the work behind them will appear here.</p>
          <PlanLink href="/plan?view=projects">Open Plan</PlanLink>
        </div>
      ) : (
        <div key={zoom} className="flex flex-col gap-5">
          {context.objectives.length > 0 && (
            <section className="flex flex-col gap-0.5">
              <SectionLabel>{zoom === "year" ? "Horizons" : "Goals"}</SectionLabel>
              {context.objectives.map((group) => (
                <GoalBlock
                  key={group.item.id}
                  group={group}
                  color={group.item.categoryId ? colorById.get(group.item.categoryId) : undefined}
                  defaultOpen={openByDefault}
                  showChildren={zoom !== "year"}
                  colorById={colorById}
                />
              ))}
            </section>
          )}
          {context.projects.length > 0 && (
            <section className="flex flex-col gap-0.5">
              <SectionLabel>Projects</SectionLabel>
              {context.projects.map((project) => (
                <ProjectBlock
                  key={project.item.id}
                  project={project}
                  color={project.item.categoryId ? colorById.get(project.item.categoryId) : undefined}
                  defaultOpen={openByDefault}
                  showChildren={zoom !== "year"}
                />
              ))}
            </section>
          )}
          {context.prep.length > 0 && (
            <section className="flex flex-col gap-0.5">
              <SectionLabel>Before events</SectionLabel>
              {context.prep.map((entry) => (
                <div key={entry.event.id}>
                  <ItemLine item={entry.event} color={entry.event.categoryId ? colorById.get(entry.event.categoryId) : undefined} />
                  <div className="ml-[15px] border-l border-cal-line-strong pl-1.5">
                    {entry.tasks.map((task) => (
                      <ItemLine key={task.id} item={task} nested />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}
          {context.toSchedule.length > 0 && (
            <section className="flex flex-col gap-0.5">
              <SectionLabel>To schedule</SectionLabel>
              {context.toSchedule.map((item) => (
                <ItemLine key={item.id} item={item} />
              ))}
              {context.moreToSchedule > 0 && (
                <PlanLink href="/plan?view=schedule" className="mt-1 px-2">
                  {context.moreToSchedule} more in Plan
                </PlanLink>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function PlanLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-sm text-[12.5px] font-medium text-foreground/70 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      {children}
      <ArrowUpRight className="size-3" />
    </Link>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1 px-2 text-[11.5px] font-semibold uppercase tracking-wider text-foreground/55">
      {children}
    </p>
  );
}

function ContainerRow({
  item,
  color,
  progress,
  hasBody,
  selected,
  onSelect,
}: {
  item: PlanItem;
  color?: string;
  progress: { done: number; total: number };
  hasBody: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const done = item.status === "completed";
  const KindIcon = getKindOption(item.kind).icon;
  return (
    <div
      className={cn(
        "relative flex h-8 items-center gap-1 rounded-md pr-1 transition-colors",
        selected ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/70"
      )}
    >
      <span
        aria-hidden
        className="absolute top-1.5 bottom-1.5 left-1 w-[3px] rounded-full bg-[var(--goal,var(--primary))]"
        style={color ? ({ "--goal": color } as React.CSSProperties) : undefined}
      />
      {hasBody ? (
        <CollapsibleTrigger asChild>
          <button
            type="button"
            aria-label="Toggle details"
            className="ml-2.5 flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="size-3.5 transition-transform duration-150 ease-out group-data-[state=open]/goal:rotate-90" />
          </button>
        </CollapsibleTrigger>
      ) : (
        <span className="ml-2.5 size-5 shrink-0" />
      )}
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        className={cn(
          "flex h-full min-w-0 flex-1 items-center gap-1.5 rounded-sm text-left text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
          done && "text-muted-foreground line-through"
        )}
        onClick={onSelect}
      >
        {item.kind === "project" && <KindIcon className="size-3.5 shrink-0 text-muted-foreground" />}
        <span className="truncate">{item.title}</span>
      </button>
      {progress.total > 0 && (
        <span className="flex shrink-0 items-center gap-1.5 pr-1 text-[11px] tabular-nums text-muted-foreground">
          <ProgressDonut done={progress.done} total={progress.total} size={16} stroke={2.5} label={false} color={color} />
          {progress.done}/{progress.total}
        </span>
      )}
    </div>
  );
}

function ProjectBlock({
  project,
  color,
  defaultOpen,
  showChildren,
  nested = false,
}: {
  project: PlanningProject;
  color?: string;
  defaultOpen: boolean;
  showChildren: boolean;
  nested?: boolean;
}) {
  const ui = useCalendarUi();
  const selected = ui?.selectedId === project.item.id;
  const hasBody = showChildren && (project.events.length > 0 || project.tasks.length > 0 || project.toSchedule.length > 0);

  return (
    <Collapsible defaultOpen={defaultOpen} className={cn("group/goal", nested && "ml-[19px] border-l border-cal-line-strong pl-1.5")}>
      <ContainerRow
        item={project.item}
        color={color}
        progress={project.progress}
        hasBody={hasBody}
        selected={Boolean(selected)}
        onSelect={() => ui?.onSelect(project.item.id)}
      />
      {hasBody && (
        <CollapsibleContent className="ml-[19px] overflow-hidden border-l border-cal-line-strong pl-1.5 pt-0.5 pb-1 duration-150 ease-out data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          {project.events.map((event) => (
            <ItemLine key={event.id} item={event} nested />
          ))}
          {project.tasks.map((task) => (
            <ItemLine key={task.id} item={task} nested />
          ))}
          {project.toSchedule.map((task) => (
            <ItemLine key={task.id} item={task} nested unscheduled />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

function GoalBlock({
  group,
  color,
  defaultOpen,
  showChildren,
  colorById,
}: {
  group: PlanningObjective;
  color?: string;
  defaultOpen: boolean;
  showChildren: boolean;
  colorById: Map<string, string>;
}) {
  const ui = useCalendarUi();
  const selected = ui?.selectedId === group.item.id;
  const hasBody =
    group.projects.length > 0 ||
    (showChildren && (group.events.length > 0 || group.tasks.length > 0 || group.toSchedule.length > 0));

  return (
    <Collapsible defaultOpen={defaultOpen} className="group/goal">
      <ContainerRow
        item={group.item}
        color={color}
        progress={group.progress}
        hasBody={hasBody}
        selected={Boolean(selected)}
        onSelect={() => ui?.onSelect(group.item.id)}
      />
      {hasBody && (
        <CollapsibleContent className="overflow-hidden pt-0.5 pb-1 duration-150 ease-out data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          {group.projects.map((project) => (
            <ProjectBlock
              key={project.item.id}
              project={project}
              color={project.item.categoryId ? colorById.get(project.item.categoryId) : color}
              defaultOpen={defaultOpen}
              showChildren={showChildren}
              nested
            />
          ))}
          <div className="ml-[19px] border-l border-cal-line-strong pl-1.5">
            {group.events.map((event) => (
              <ItemLine key={event.id} item={event} nested />
            ))}
            {group.tasks.map((task) => (
              <ItemLine key={task.id} item={task} nested />
            ))}
            {group.toSchedule.map((task) => (
              <ItemLine key={task.id} item={task} nested unscheduled />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

function ItemLine({
  item,
  nested,
  unscheduled,
  color,
}: {
  item: PlanItem;
  nested?: boolean;
  unscheduled?: boolean;
  color?: string;
}) {
  const ui = useCalendarUi();
  const selected = ui?.selectedId === item.id;
  const kind = getKindOption(item.kind);
  const status = getStatusOption(item.status);
  const Icon = kind.icon;
  const done = item.status === "completed";
  const showStatus = item.status !== "pending";
  const placeable = item.kind === "task" && !isScheduled(item) && Boolean(ui?.canCreate && ui.onPlace);
  const placing = ui?.placing?.id === item.id;
  const due = dueState(item.due);

  return (
    <div
      className={cn(
        "group/line flex h-7 w-full min-w-0 items-center gap-2 rounded-md pr-1 pl-2 text-[13px] transition-colors",
        selected || placing ? "bg-sidebar-accent text-foreground" : "hover:bg-sidebar-accent/70",
        done && "text-muted-foreground",
        (unscheduled || (!isScheduled(item) && item.kind === "task")) && !done && "text-foreground/80"
      )}
    >
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => ui?.onSelect(item.id)}
      >
        <Icon
          className={cn("size-3.5 shrink-0", !color && "text-muted-foreground")}
          style={color ? { color } : undefined}
        />
        <span className={cn("min-w-0 flex-1 truncate", done && "line-through", nested && "text-[12.5px]")}>
          {item.title}
        </span>
        {item.recurrence && <Repeat className="size-3 shrink-0 text-muted-foreground" />}
        {item.due && !done && (
          <span
            className={cn(
              "shrink-0 text-[10.5px] tabular-nums",
              due === "overdue" ? "text-red-500" : due === "today" ? "text-amber-600" : "text-muted-foreground"
            )}
          >
            {item.due.slice(5).replace("-", "/")}
          </span>
        )}
        {showStatus && <status.icon className={cn("size-3 shrink-0", status.className)} />}
      </button>
      {placeable && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={placing ? "Cancel placing" : `Place ${item.title} on the calendar`}
              aria-pressed={placing}
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-opacity hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                placing ? "text-primary opacity-100" : "opacity-0 group-hover/line:opacity-100 focus-visible:opacity-100"
              )}
              onClick={(event) => {
                event.stopPropagation();
                ui?.onPlace?.(placing ? null : item);
              }}
            >
              <CalendarPlus className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{placing ? "Cancel" : "Place on the calendar"}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
