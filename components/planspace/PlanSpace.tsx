"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, Flag, FolderKanban, Inbox, ListTodo, Plus, Redo2, Undo2 } from "lucide-react";
import { ItemEditor } from "@/components/item/ItemEditor";
import { CalendarWorkspace } from "@/components/layout/CalendarWorkspace";
import { CaptureBar } from "@/components/planspace/CaptureBar";
import { PlanNav } from "@/components/planspace/PlanNav";
import { ProjectTree } from "@/components/planspace/ProjectTree";
import { TaskFilters } from "@/components/planspace/TaskFilters";
import { TaskList } from "@/components/planspace/TaskList";
import type { TaskRowContext } from "@/components/planspace/TaskRow";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSaveItem } from "@/hooks/useSaveItem";
import { isTypingTarget, useUndoKeys, useUndoRedo } from "@/hooks/useUndoRedo";
import { createItem, isUnconfirmedDraft } from "@/lib/domain/items";
import { indexById } from "@/lib/domain/tree";
import {
  DEFAULT_TASK_FILTER,
  filterItems,
  groupItems,
  isInbox,
  isToSchedule,
  planCounts,
  planTree,
  sortItems,
  type GroupBy,
  type PlanView,
  type SortBy,
  type TaskFilter,
} from "@/lib/planning/views";
import { isPlanWritable } from "@/lib/sync/access";
import { usePlannerStore } from "@/store/plannerStore";
import { useUIStore, type SavedView } from "@/store/uiStore";
import type { ItemKind, PlanItem } from "@/types";

const VIEWS: PlanView[] = ["inbox", "schedule", "projects", "tasks"];
const TITLES: Record<PlanView, string> = {
  inbox: "Inbox",
  schedule: "To schedule",
  projects: "Projects",
  tasks: "All tasks",
};

/**
 * The Plan space: what to accomplish, why, and what is next — across every
 * calendar. Four views over one dataset; the calendar keeps time, this keeps
 * intent. Selection opens the same details pane as the calendar.
 */
export function PlanSpace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const view: PlanView = VIEWS.includes(viewParam as PlanView) ? (viewParam as PlanView) : "inbox";
  const focusParam = searchParams.get("focus");

  const loadAll = usePlannerStore((s) => s.loadAll);
  const scope = usePlannerStore((s) => s.scope);
  const isLoading = usePlannerStore((s) => s.isLoading);
  const items = usePlannerStore((s) => s.items);
  const plans = usePlannerStore((s) => s.plans);
  const categories = usePlannerStore((s) => s.categories);
  const people = usePlannerStore((s) => s.people);
  const putItem = usePlannerStore((s) => s.putItem);
  const deleteItemById = usePlannerStore((s) => s.deleteItem);
  const captureCalendarId = useUIStore((s) => s.captureCalendarId);
  const setCaptureCalendarId = useUIStore((s) => s.setCaptureCalendarId);
  const saveItem = useSaveItem();
  const { runUndo, runRedo, canUndo, canRedo, undoLabel, redoLabel } = useUndoRedo();
  useUndoKeys(runUndo, runRedo);

  const [selectedId, setSelectedId] = useState<string | null>(focusParam);
  const [calendarIds, setCalendarIds] = useState<string[]>([]);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>(DEFAULT_TASK_FILTER);
  const [groupBy, setGroupBy] = useState<GroupBy>("project");
  const [sortBy, setSortBy] = useState<SortBy>("time");
  const [savedViewId, setSavedViewId] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const writablePlans = useMemo(() => plans.filter((plan) => isPlanWritable(plan)), [plans]);
  const capturePlanId = useMemo(() => {
    if (calendarIds.length === 1 && writablePlans.some((plan) => plan.id === calendarIds[0])) return calendarIds[0];
    if (captureCalendarId && writablePlans.some((plan) => plan.id === captureCalendarId)) return captureCalendarId;
    return writablePlans[0]?.id ?? "";
  }, [calendarIds, captureCalendarId, writablePlans]);

  const live = useMemo(
    () => (calendarIds.length ? items.filter((item) => calendarIds.includes(item.planId)) : items),
    [calendarIds, items]
  );
  const byId = useMemo(() => indexById(items), [items]);
  const counts = useMemo(() => planCounts(live), [live]);
  const selectedItem = selectedId ? (items.find((item) => item.id === selectedId) ?? null) : null;

  const discardUnconfirmed = useCallback(
    async (id: string | null) => {
      if (!id) return;
      const item = items.find((entry) => entry.id === id);
      if (item && isUnconfirmedDraft(item)) await deleteItemById(id);
    },
    [deleteItemById, items]
  );
  const onSelect = useCallback(
    (id: string) => {
      if (id !== selectedId) void discardUnconfirmed(selectedId);
      setSelectedId(id);
    },
    [discardUnconfirmed, selectedId]
  );
  const onClose = useCallback(() => {
    void discardUnconfirmed(selectedId);
    setSelectedId(null);
  }, [discardUnconfirmed, selectedId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isTypingTarget(event.target) || !selectedId) return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, selectedId]);

  const setView = (next: PlanView) => {
    setSavedViewId(null);
    router.replace(`/plan?view=${next}`);
  };
  const applySavedView = (saved: SavedView) => {
    setTaskFilter(saved.filter);
    setGroupBy(saved.groupBy);
    setSortBy(saved.sortBy);
    setSavedViewId(saved.id);
    router.replace("/plan?view=tasks");
  };

  // A new container or task starts as a draft: it is named in the pane and
  // dropped if the name never comes, exactly like a slot on the calendar.
  const createDraft = useCallback(
    (kind: ItemKind, parent?: PlanItem) => {
      const planId = parent?.planId ?? capturePlanId;
      if (!planId) return;
      void discardUnconfirmed(selectedId);
      const item = createItem({ planId, title: "", kind, parentId: parent?.id, draft: true });
      void putItem(item);
      setSelectedId(item.id);
    },
    [capturePlanId, discardUnconfirmed, putItem, selectedId]
  );

  const rowContext: TaskRowContext = useMemo(
    () => ({ byId, plans, categories, showCalendar: plans.length > 1 && calendarIds.length !== 1 }),
    [byId, calendarIds.length, categories, plans]
  );

  const inboxGroups = useMemo(() => {
    if (view !== "inbox") return [];
    return [{ id: "all", label: "", items: sortItems(live.filter(isInbox), "created") }];
  }, [live, view]);
  const scheduleGroups = useMemo(() => {
    if (view !== "schedule") return [];
    const list = sortItems(live.filter((item) => isToSchedule(item, byId)), "time");
    return groupItems(list, "project", { all: items, plans, categories });
  }, [byId, categories, items, live, plans, view]);
  const taskGroups = useMemo(() => {
    if (view !== "tasks") return [];
    const list = sortItems(filterItems(live, taskFilter), sortBy);
    return groupItems(list, groupBy, { all: items, plans, categories });
  }, [categories, groupBy, items, live, plans, sortBy, taskFilter, view]);
  const tree = useMemo(() => (view === "projects" ? planTree(live, { showDone }) : []), [live, showDone, view]);
  const taskTotal = taskGroups.reduce((sum, group) => sum + group.items.length, 0);

  if (scope !== "all" || (isLoading && items.length === 0)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="text-muted-foreground" />
      </div>
    );
  }

  const count =
    view === "inbox" ? counts.inbox : view === "schedule" ? counts.schedule : view === "projects" ? counts.projects : taskTotal;

  return (
    <CalendarWorkspace
      left={
        <PlanNav
          view={view}
          savedViewId={savedViewId}
          counts={counts}
          plans={plans}
          calendarIds={calendarIds}
          onViewChange={setView}
          onSavedView={applySavedView}
          onCalendarToggle={(id) =>
            setCalendarIds((current) => (id === null ? [] : current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]))
          }
        />
      }
      rightKey={selectedItem?.id}
      right={selectedItem ? <ItemEditor key={selectedItem.id} item={selectedItem} onClose={onClose} /> : null}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-cal-line-strong px-3">
          <h1 className="text-sm font-semibold tracking-tight">{TITLES[view]}</h1>
          <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
          <span className="flex-1" />
          {view === "projects" && (
            <>
              <label className="mr-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Switch size="sm" checked={showDone} onCheckedChange={setShowDone} />
                Show done
              </label>
              <Button type="button" variant="outline" size="sm" disabled={!capturePlanId} onClick={() => createDraft("objective")}>
                <Flag />
                Goal
              </Button>
              <Button type="button" size="sm" disabled={!capturePlanId} onClick={() => createDraft("project")}>
                <Plus />
                Project
              </Button>
            </>
          )}
          <ButtonGroup className="ml-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Undo" disabled={!canUndo} className="text-muted-foreground hover:text-foreground" onClick={() => void runUndo()}>
                  <Undo2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {undoLabel ? `Undo ${undoLabel}` : "Nothing to undo"} <Kbd>⌘Z</Kbd>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Redo" disabled={!canRedo} className="text-muted-foreground hover:text-foreground" onClick={() => void runRedo()}>
                  <Redo2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {redoLabel ? `Redo ${redoLabel}` : "Nothing to redo"} <Kbd>⇧⌘Z</Kbd>
              </TooltipContent>
            </Tooltip>
          </ButtonGroup>
        </div>

        {view === "inbox" && (
          <>
            <CaptureBar
              plans={writablePlans}
              planId={capturePlanId}
              categories={categories}
              placeholder="Capture a task: Call the plumber #home"
              onPlanChange={setCaptureCalendarId}
              onCreate={saveItem}
            />
            <TaskList
              groups={inboxGroups}
              context={rowContext}
              selectedId={selectedId}
              onSelect={onSelect}
              empty={{ icon: <Inbox />, title: "Inbox zero", description: "Capture anything above or with ⌘K. Sort it here: give it a project, a deadline or a slot." }}
            />
          </>
        )}
        {view === "schedule" && (
          <TaskList
            groups={scheduleGroups}
            context={{ ...rowContext, hideProject: true }}
            selectedId={selectedId}
            onSelect={onSelect}
            empty={{ icon: <CalendarClock />, title: "Nothing waiting for a slot", description: "Clarified tasks without a date show up here until you place them on the calendar." }}
          />
        )}
        {view === "projects" && (
          <ProjectTree
            nodes={tree}
            plans={plans}
            categories={categories}
            showCalendar={plans.length > 1 && calendarIds.length !== 1}
            selectedId={selectedId}
            onSelect={onSelect}
            onCreateChild={(parent, kind) => createDraft(kind, parent)}
          />
        )}
        {view === "tasks" && (
          <>
            <TaskFilters
              filter={taskFilter}
              groupBy={groupBy}
              sortBy={sortBy}
              items={live}
              categories={categories}
              people={people}
              onFilterChange={(next) => {
                setSavedViewId(null);
                setTaskFilter(next);
              }}
              onGroupByChange={setGroupBy}
              onSortByChange={setSortBy}
            />
            <TaskList
              groups={taskGroups}
              context={{ ...rowContext, hideProject: groupBy === "project" }}
              selectedId={selectedId}
              onSelect={onSelect}
              empty={{ icon: <ListTodo />, title: "No tasks match", description: "Loosen a filter, or capture something new with ⌘K." }}
            />
          </>
        )}
      </div>
      <FolderKanban className="hidden" />
    </CalendarWorkspace>
  );
}
