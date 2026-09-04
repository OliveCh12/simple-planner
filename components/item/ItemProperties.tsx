"use client";

import { useState } from "react";
import { Bot, CalendarRange, Clock, FolderTree, MapPin, Repeat, Tag, User, Users } from "lucide-react";
import { toast } from "sonner";
import { EnergyChip } from "@/components/task/TaskProperties";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Combobox } from "@/components/ui/combobox";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DEFAULT_SWATCH } from "@/lib/colors";
import { KINDS } from "@/lib/constants";
import { createCategory } from "@/lib/domain/categories";
import { DomainError, moveItem, setKind, setParent, updateItem } from "@/lib/domain/items";
import { recurrencePresetId, RECURRENCE_PRESETS } from "@/lib/recurrence-presets";
import { isAllDay } from "@/lib/time/local";
import { formatDateDisplay } from "@/lib/date-utils";
import { usePlannerStore } from "@/store/plannerStore";
import { useUIStore } from "@/store/uiStore";
import type { Category, EnergyLevel, Executor, Person, PlanItem } from "@/types";

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

  const setStartDate = (date: string) => {
    void save(moveItem(item, joinLocal(date, startParts.time), item.end));
  };

  const setEndDate = (date: string) => {
    void save(moveItem(item, item.start, joinLocal(date, endParts.time || startParts.time)));
  };

  const setStartTime = (time: string) => {
    void save(moveItem(item, joinLocal(startParts.date, time), item.end ? joinLocal(endParts.date, endParts.time || time) : undefined));
  };

  const setEndTime = (time: string) => {
    if (!item.end) return;
    void save(moveItem(item, item.start, joinLocal(endParts.date, time)));
  };

  return (
    <Tabs defaultValue="when" className="gap-4">
      <TabsList variant="line" className="w-full">
        <TabsTrigger value="when">
          <CalendarRange />
          When
        </TabsTrigger>
        <TabsTrigger value="who">
          <Users />
          Who
        </TabsTrigger>
        <TabsTrigger value="more">
          <Tag />
          More
        </TabsTrigger>
      </TabsList>

      <TabsContent value="when" className="space-y-5">
        <Field>
          <FieldLabel className="text-muted-foreground">
            <CalendarRange />
            Dates
          </FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <CalendarRange />
            </InputGroupAddon>
            <InputGroupInput
              type="date"
              aria-label="Start"
              value={startParts.date}
              onChange={(event) => setStartDate(event.target.value)}
            />
            {item.end ? (
              <>
                <InputGroupText className="px-1">–</InputGroupText>
                <InputGroupInput
                  type="date"
                  aria-label="End"
                  value={endParts.date}
                  min={startParts.date}
                  onChange={(event) => setEndDate(event.target.value)}
                />
                <InputGroupButton aria-label="Remove end" onClick={() => void save(moveItem(item, item.start))}>
                  No end
                </InputGroupButton>
              </>
            ) : (
              <InputGroupButton onClick={() => void save(moveItem(item, item.start, item.start))}>
                Add end
              </InputGroupButton>
            )}
          </InputGroup>
          {timed ? (
            <InputGroup>
              <InputGroupAddon>
                <Clock />
              </InputGroupAddon>
              <InputGroupInput
                type="time"
                aria-label="Start time"
                value={startParts.time}
                onChange={(event) => setStartTime(event.target.value)}
              />
              {item.end ? (
                <>
                  <InputGroupText className="px-1">–</InputGroupText>
                  <InputGroupInput
                    type="time"
                    aria-label="End time"
                    value={endParts.time}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </>
              ) : null}
              <InputGroupButton
                onClick={() => void save(moveItem(item, item.start.slice(0, 10), item.end?.slice(0, 10)))}
              >
                All day
              </InputGroupButton>
            </InputGroup>
          ) : (
            <button
              type="button"
              className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() =>
                void save(
                  moveItem(
                    item,
                    `${item.start}T09:00`,
                    item.end ? `${item.end}T10:00` : `${item.start}T10:00`
                  )
                )
              }
            >
              <Clock className="size-3.5" />
              Add time
            </button>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="recurrence" className="text-muted-foreground">
            <Repeat />
            Repeats
          </FieldLabel>
          <NativeSelect
            id="recurrence"
            size="sm"
            className="w-full"
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
            <InputGroup>
              <InputGroupInput
                className="font-mono text-xs"
                value={customRule}
                aria-label="RRULE"
                onChange={(event) => setCustomRule(event.target.value)}
                onBlur={() => {
                  if (customRule.trim()) void save(updateItem(item, { recurrence: customRule.trim() }));
                }}
              />
            </InputGroup>
          )}
        </Field>

        <Field>
          <FieldLabel className="text-muted-foreground">Energy</FieldLabel>
          <EnergyChip value={item.energy} onChange={(energy: EnergyLevel) => void save(updateItem(item, { energy }))} />
        </Field>
      </TabsContent>

      <TabsContent value="who" className="space-y-5">
        <Field>
          <FieldLabel className="text-muted-foreground">Kind</FieldLabel>
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
            {KINDS.map((kind) => (
              <ToggleGroupItem key={kind.value} value={kind.value} aria-label={kind.label}>
                <kind.icon />
                {kind.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <Field>
          <FieldLabel className="text-muted-foreground">Does this</FieldLabel>
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
            <ToggleGroupItem value="human">
              <User />
              Human
            </ToggleGroupItem>
            <ToggleGroupItem value="ai">
              <Bot />
              AI
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>

        <Field>
          <FieldLabel className="text-muted-foreground">
            <Users />
            Assignees
          </FieldLabel>
          <PeoplePicker
            people={people}
            options={personOptions}
            value={item.assigneeIds}
            onChange={(assigneeIds) => void save(updateItem(item, { assigneeIds }))}
          />
        </Field>

        {item.kind === "event" && (
          <Field>
            <FieldLabel className="text-muted-foreground">Attendees</FieldLabel>
            <PeoplePicker
              people={people}
              options={personOptions}
              value={item.attendeeIds}
              onChange={(attendeeIds) => void save(updateItem(item, { attendeeIds }))}
            />
          </Field>
        )}
      </TabsContent>

      <TabsContent value="more" className="space-y-5">
        <Field>
          <FieldLabel className="text-muted-foreground">
            <Tag />
            Category
          </FieldLabel>
          <Combobox
            aria-label="Category"
            options={categories.map((category) => ({ value: category.id, label: category.name }))}
            value={item.categoryId}
            placeholder="None"
            onCreate={(name) => {
              const category = createCategory({ name, color: DEFAULT_SWATCH });
              void putCategory(category).then(() => save(updateItem(item, { categoryId: category.id })));
            }}
            onValueChange={(value) => {
              const id = Array.isArray(value) ? value[0] : value;
              void save(updateItem(item, { categoryId: id }));
            }}
          />
        </Field>

        <Field>
          <FieldLabel className="text-muted-foreground">
            <FolderTree />
            Parent
          </FieldLabel>
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
          <FieldLabel htmlFor="location-name" className="text-muted-foreground">
            <MapPin />
            Place
          </FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <MapPin />
            </InputGroupAddon>
            <InputGroupInput
              id="location-name"
              placeholder="Name, address, or URL"
              defaultValue={item.location?.name ?? item.location?.address ?? item.location?.url ?? ""}
              onBlur={(event) => {
                const name = event.target.value.trim();
                void save(updateItem(item, { location: name ? { name } : undefined }));
              }}
            />
          </InputGroup>
        </Field>

        <p className="text-xs text-muted-foreground">
          Created {formatDateDisplay(item.createdAt, dateFormat)} · Updated {formatDateDisplay(item.updatedAt, dateFormat)}
        </p>
      </TabsContent>
    </Tabs>
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
            return (
              <span key={id} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Avatar size="sm" className="size-5">
                  <AvatarFallback
                    style={{ backgroundColor: person.color ?? DEFAULT_SWATCH }}
                    className="text-[10px] text-white"
                  >
                    {person.name.slice(0, 1).toUpperCase()}
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
