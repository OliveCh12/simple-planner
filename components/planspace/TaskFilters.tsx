"use client";

import { useState } from "react";
import { Bookmark, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { STATUSES } from "@/lib/constants";
import { createId } from "@/lib/id";
import type { DueFilter, GroupBy, ScheduleFilter, SortBy, TaskFilter } from "@/lib/planning/views";
import { useUIStore, type SavedView } from "@/store/uiStore";
import type { Category, Person, PlanItem } from "@/types";

interface TaskFiltersProps {
  filter: TaskFilter;
  groupBy: GroupBy;
  sortBy: SortBy;
  items: PlanItem[];
  categories: Category[];
  people: Person[];
  onFilterChange: (next: TaskFilter) => void;
  onGroupByChange: (next: GroupBy) => void;
  onSortByChange: (next: SortBy) => void;
}

const DUE_OPTIONS: { value: DueFilter; label: string }[] = [
  { value: "any", label: "Any deadline" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "week", label: "Due this week" },
  { value: "month", label: "Due this month" },
  { value: "none", label: "No deadline" },
];
const SCHEDULE_OPTIONS: { value: ScheduleFilter; label: string }[] = [
  { value: "any", label: "Any slot" },
  { value: "scheduled", label: "On the calendar" },
  { value: "unscheduled", label: "Not scheduled" },
];
const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "none", label: "No grouping" },
  { value: "project", label: "By project" },
  { value: "calendar", label: "By calendar" },
  { value: "status", label: "By status" },
  { value: "due", label: "By deadline" },
  { value: "category", label: "By category" },
];
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "time", label: "By time" },
  { value: "title", label: "By title" },
  { value: "created", label: "Newest first" },
  { value: "energy", label: "By energy" },
];

/** Every axis the list can be cut on, in one quiet row. Saved views remember a cut. */
export function TaskFilters({
  filter,
  groupBy,
  sortBy,
  items,
  categories,
  people,
  onFilterChange,
  onGroupByChange,
  onSortByChange,
}: TaskFiltersProps) {
  const addSavedView = useUIStore((s) => s.addSavedView);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const patch = (next: Partial<TaskFilter>) => onFilterChange({ ...filter, ...next });
  const kinds = filter.kinds ?? ["task"];
  const kindValue = kinds.length === 2 ? "both" : kinds[0] === "project" ? "project" : "task";
  const containerOptions = items
    .filter((item) => (item.kind === "project" || item.kind === "objective") && !item.draft)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => ({ value: item.id, label: item.title, keywords: item.kind }));
  const active =
    Boolean(filter.withinIds?.length || filter.statuses?.length || filter.categoryIds?.length || filter.assigneeIds?.length) ||
    (filter.due && filter.due !== "any") ||
    (filter.schedule && filter.schedule !== "any") ||
    filter.executor !== undefined;

  const saveView = () => {
    const view: SavedView = { id: createId(), name: name.trim() || "Saved view", filter, groupBy, sortBy };
    addSavedView(view);
    setSaving(false);
    setName("");
  };

  return (
    <div className="flex flex-col gap-2 border-b border-cal-line-strong px-3 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <InputGroup className="h-8 w-56 max-w-full">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={filter.query ?? ""}
            placeholder="Search tasks"
            aria-label="Search"
            className="h-8"
            onChange={(event) => patch({ query: event.target.value })}
          />
        </InputGroup>
        <Select value={kindValue} onValueChange={(value) => patch({ kinds: value === "both" ? ["task", "project"] : value === "project" ? ["project"] : ["task"] })}>
          <SelectTrigger size="sm" aria-label="Kind" className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="task">Tasks</SelectItem>
            <SelectItem value="project">Projects</SelectItem>
            <SelectItem value="both">Tasks and projects</SelectItem>
          </SelectContent>
        </Select>
        <Combobox
          aria-label="Within"
          options={containerOptions}
          value={filter.withinIds ?? []}
          multiple
          placeholder="Any project"
          searchPlaceholder="Projects and goals…"
          onValueChange={(value) => patch({ withinIds: Array.isArray(value) ? value : value ? [value] : [] })}
        />
        <Combobox
          aria-label="Status"
          options={STATUSES.map((status) => ({ value: status.value, label: status.label }))}
          value={filter.statuses ?? []}
          multiple
          placeholder="Any status"
          onValueChange={(value) => patch({ statuses: (Array.isArray(value) ? value : value ? [value] : []) as TaskFilter["statuses"] })}
        />
        <Combobox
          aria-label="Category"
          options={categories.map((category) => ({ value: category.id, label: category.name }))}
          value={filter.categoryIds ?? []}
          multiple
          placeholder="Any category"
          onValueChange={(value) => patch({ categoryIds: Array.isArray(value) ? value : value ? [value] : [] })}
        />
        <Combobox
          aria-label="Assignee"
          options={people.map((person) => ({ value: person.id, label: person.name }))}
          value={filter.assigneeIds ?? []}
          multiple
          placeholder="Anyone"
          onValueChange={(value) => patch({ assigneeIds: Array.isArray(value) ? value : value ? [value] : [] })}
        />
        <Select value={filter.due ?? "any"} onValueChange={(value) => patch({ due: value as DueFilter })}>
          <SelectTrigger size="sm" aria-label="Deadline" className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DUE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filter.schedule ?? "any"} onValueChange={(value) => patch({ schedule: value as ScheduleFilter })}>
          <SelectTrigger size="sm" aria-label="Slot" className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCHEDULE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {active && (
          <Button type="button" variant="ghost" size="xs" className="h-8 text-muted-foreground" onClick={() => onFilterChange({ kinds: filter.kinds, query: filter.query, showDone: filter.showDone })}>
            <X />
            Clear
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Select value={groupBy} onValueChange={(value) => onGroupByChange(value as GroupBy)}>
          <SelectTrigger size="sm" aria-label="Group by" className="h-7 border-transparent bg-transparent shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GROUP_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value) => onSortByChange(value as SortBy)}>
          <SelectTrigger size="sm" aria-label="Sort" className="h-7 border-transparent bg-transparent shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
          <Switch size="sm" checked={Boolean(filter.showDone)} onCheckedChange={(checked) => patch({ showDone: checked })} />
          Show done
        </label>
        <span className="flex-1" />
        <Button type="button" variant="ghost" size="xs" className="h-7 text-muted-foreground hover:text-foreground" onClick={() => setSaving(true)}>
          <Bookmark />
          Save view
        </Button>
      </div>
      <Dialog open={saving} onOpenChange={setSaving}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save this view</DialogTitle>
            <DialogDescription>The filters, grouping and sort you have now, one click away in the Plan rail.</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={name}
            placeholder="Name, e.g. Overdue at work"
            aria-label="View name"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                saveView();
              }
            }}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaving(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveView}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
