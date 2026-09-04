"use client";

import { useState } from "react";
import { toast } from "sonner";
import { EnergyChip, StatusChip } from "@/components/task/TaskProperties";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DEFAULT_SWATCH } from "@/lib/colors";
import { createCategory } from "@/lib/domain/categories";
import { DomainError, moveItem, setKind, setParent, updateItem } from "@/lib/domain/items";
import { recurrencePresetId, RECURRENCE_PRESETS } from "@/lib/recurrence-presets";
import { formatLocalDate, isAllDay, parseLocal } from "@/lib/time/local";
import { formatDateDisplay } from "@/lib/date-utils";
import { usePlannerStore } from "@/store/plannerStore";
import { useUIStore } from "@/store/uiStore";
import type { Category, EnergyLevel, Executor, ItemStatus, Person, PlanItem } from "@/types";

function splitLocal(value: string) {
  if (value.includes("T")) {
    const [date, time] = value.split("T");
    return { date, time };
  }
  return { date: value, time: "" };
}

function joinLocal(date: string, time: string) {
  return time ? `${date}T${time}` : date;
}

interface ItemPropertiesProps {
  item: PlanItem;
  items: PlanItem[];
  people: Person[];
  categories: Category[];
}

export function ItemProperties({ item, items, people, categories }: ItemPropertiesProps) {
  const putItem = usePlannerStore((s) => s.putItem);
  const putCategory = usePlannerStore((s) => s.putCategory);
  const dateFormat = useUIStore((s) => s.settings.dateFormat);
  const [customRule, setCustomRule] = useState(item.recurrence ?? "");
  const preset = recurrencePresetId(item.recurrence);
  const startParts = splitLocal(item.start);
  const endParts = item.end ? splitLocal(item.end) : { date: "", time: "" };
  const timed = !isAllDay(item.start);

  const save = async (next: PlanItem) => {
    try {
      await putItem(next);
    } catch (error) {
      toast.error(error instanceof DomainError ? error.message : "Failed to save item.");
    }
  };

  const parentOptions = items
    .filter((candidate) => candidate.id !== item.id && candidate.kind !== "event")
    .map((candidate) => ({ value: candidate.id, label: candidate.title }));

  const personOptions = people.map((person) => ({
    value: person.id,
    label: person.name,
    keywords: person.email,
  }));

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const createNewCategory = async (name: string) => {
    const category = createCategory({ name, color: DEFAULT_SWATCH });
    await putCategory(category);
    await save(updateItem(item, { categoryId: category.id }));
  };

  const setStart = (date: string, time: string) => {
    const start = joinLocal(date, time);
    const end = item.end
      ? joinLocal(splitLocal(item.end).date, time ? splitLocal(item.end).time || time : "")
      : undefined;
    void save(moveItem(item, start, end));
  };

  const setEnd = (date: string, time: string) => {
    void save(moveItem(item, item.start, joinLocal(date, time)));
  };

  return (
    <FieldGroup className="gap-5">
      <Field>
        <FieldLabel>Kind</FieldLabel>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={item.kind}
          onValueChange={(value) => {
            if (value === "task" || value === "event" || value === "objective") {
              try {
                void save(setKind(item, value, items));
              } catch (error) {
                toast.error(error instanceof DomainError ? error.message : "Failed to save item.");
              }
            }
          }}
        >
          <ToggleGroupItem value="task">Task</ToggleGroupItem>
          <ToggleGroupItem value="event">Event</ToggleGroupItem>
          <ToggleGroupItem value="objective">Objective</ToggleGroupItem>
        </ToggleGroup>
      </Field>

      <Field>
        <FieldLabel>Executor</FieldLabel>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={item.executor}
          onValueChange={(value) => {
            if (value === "human" || value === "ai") {
              void save(updateItem(item, { executor: value as Executor }));
            }
          }}
        >
          <ToggleGroupItem value="human">Human</ToggleGroupItem>
          <ToggleGroupItem value="ai">AI</ToggleGroupItem>
        </ToggleGroup>
      </Field>

      <Field>
        <FieldLabel>Dates</FieldLabel>
        <div className="space-y-2">
          <DateRow
            label="Start"
            date={startParts.date}
            time={startParts.time}
            onDate={(date) => setStart(date, startParts.time)}
            onTime={(time) => setStart(startParts.date, time)}
          />
          {item.end ? (
            <DateRow
              label="End"
              date={endParts.date}
              time={endParts.time}
              onDate={(date) => setEnd(date, endParts.time)}
              onTime={(time) => setEnd(endParts.date, time)}
            />
          ) : null}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() =>
                timed
                  ? void save(moveItem(item, item.start.slice(0, 10), item.end?.slice(0, 10)))
                  : void save(moveItem(item, `${item.start}T09:00`, item.end ? `${item.end}T10:00` : `${item.start}T10:00`))
              }
            >
              {timed ? "All day" : "Add time"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() =>
                item.end ? void save(moveItem(item, item.start)) : void save(moveItem(item, item.start, item.start))
              }
            >
              {item.end ? "No end" : "Add end"}
            </Button>
          </div>
        </div>
      </Field>

      <Field>
        <FieldLabel htmlFor="recurrence">Recurrence</FieldLabel>
        <NativeSelect
          id="recurrence"
          size="sm"
          value={preset}
          onChange={(event) => {
            const next = event.target.value;
            if (next === "none") {
              void save(updateItem(item, { recurrence: undefined }));
              return;
            }
            if (next === "custom") {
              setCustomRule(item.recurrence ?? "FREQ=WEEKLY");
              void save(updateItem(item, { recurrence: item.recurrence ?? "FREQ=WEEKLY" }));
              return;
            }
            const rule = RECURRENCE_PRESETS.find((entry) => entry.id === next)?.rrule;
            if (rule) void save(updateItem(item, { recurrence: rule }));
          }}
        >
          {RECURRENCE_PRESETS.map((entry) => (
            <NativeSelectOption key={entry.id} value={entry.id}>
              {entry.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {preset === "custom" && (
          <Input
            className="mt-2 font-mono text-xs"
            value={customRule}
            aria-label="RRULE"
            onChange={(event) => setCustomRule(event.target.value)}
            onBlur={() => {
              if (customRule.trim()) void save(updateItem(item, { recurrence: customRule.trim() }));
            }}
          />
        )}
      </Field>

      <Field>
        <FieldLabel>Category</FieldLabel>
        <Combobox
          aria-label="Category"
          options={categoryOptions}
          value={item.categoryId}
          placeholder="None"
          onCreate={(name) => void createNewCategory(name)}
          onValueChange={(value) => {
            const id = Array.isArray(value) ? value[0] : value;
            void save(updateItem(item, { categoryId: id }));
          }}
        />
      </Field>

      <Field>
        <FieldLabel>Assignees</FieldLabel>
        <PeoplePicker
          people={people}
          options={personOptions}
          value={item.assigneeIds}
          onChange={(assigneeIds) => void save(updateItem(item, { assigneeIds }))}
        />
      </Field>

      <Field>
        <FieldLabel>Attendees</FieldLabel>
        <PeoplePicker
          people={people}
          options={personOptions}
          value={item.attendeeIds}
          onChange={(attendeeIds) => void save(updateItem(item, { attendeeIds }))}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="location-name">Location</FieldLabel>
        <Input
          id="location-name"
          placeholder="Name"
          defaultValue={item.location?.name ?? ""}
          onBlur={(event) => {
            const name = event.target.value.trim();
            void save(updateItem(item, { location: name ? { ...item.location, name } : undefined }));
          }}
        />
        <Input
          className="mt-2"
          placeholder="Address"
          defaultValue={item.location?.address ?? ""}
          onBlur={(event) => {
            const address = event.target.value.trim();
            if (!item.location?.name) return;
            void save(
              updateItem(item, {
                location: { ...item.location, address: address || undefined },
              })
            );
          }}
        />
        <Input
          className="mt-2"
          placeholder="URL"
          defaultValue={item.location?.url ?? ""}
          onBlur={(event) => {
            const url = event.target.value.trim();
            if (!item.location?.name) return;
            void save(updateItem(item, { location: { ...item.location, url: url || undefined } }));
          }}
        />
      </Field>

      <Field>
        <FieldLabel>Parent</FieldLabel>
        <Combobox
          aria-label="Parent"
          options={parentOptions}
          value={item.parentId}
          placeholder="None"
          onValueChange={(value) => {
            const id = Array.isArray(value) ? value[0] : value;
            try {
              void save(setParent(item, id, items));
            } catch (error) {
              toast.error(error instanceof DomainError ? error.message : "Failed to save item.");
            }
          }}
        />
      </Field>

      <Field>
        <FieldLabel>Energy</FieldLabel>
        <EnergyChip value={item.energy} onChange={(energy: EnergyLevel) => void save(updateItem(item, { energy }))} />
      </Field>

      <Field>
        <FieldLabel>Status</FieldLabel>
        <StatusChip
          value={item.status}
          onChange={(status: ItemStatus) =>
            void save(
              updateItem(item, {
                status,
                completedAt: status === "completed" ? new Date().toISOString() : undefined,
              })
            )
          }
        />
      </Field>

      <p className="text-xs text-muted-foreground">
        Created {formatDateDisplay(item.createdAt, dateFormat)} · Updated{" "}
        {formatDateDisplay(item.updatedAt, dateFormat)}
      </p>
    </FieldGroup>
  );
}

function DateRow({
  label,
  date,
  time,
  onDate,
  onTime,
}: {
  label: string;
  date: string;
  time: string;
  onDate: (date: string) => void;
  onTime: (time: string) => void;
}) {
  const selected = date ? parseLocal(date) : undefined;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="font-normal">
            {label}: {date || "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(next) => {
              if (next) onDate(formatLocalDate(next));
            }}
          />
        </PopoverContent>
      </Popover>
      {time ? (
        <Input type="time" value={time} aria-label={`${label} time`} className="h-8 w-32" onChange={(event) => onTime(event.target.value)} />
      ) : null}
    </div>
  );
}

function PeoplePicker({
  people,
  options,
  value,
  onChange,
}: {
  people: Person[];
  options: { value: string; label: string; keywords?: string }[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Combobox
        multiple
        options={options}
        value={value}
        placeholder="None"
        onValueChange={(next) => onChange(Array.isArray(next) ? next : next ? [next] : [])}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => {
            const person = people.find((entry) => entry.id === id);
            if (!person) return null;
            const initial = person.name.slice(0, 1).toUpperCase();
            return (
              <span key={id} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Avatar size="sm" className="size-5">
                  <AvatarFallback style={{ backgroundColor: person.color ?? DEFAULT_SWATCH }} className="text-[10px] text-white">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                {person.name}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
