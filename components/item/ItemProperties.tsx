"use client";

import { useState } from "react";
import { ChevronDown, Repeat } from "lucide-react";
import { toast } from "sonner";
import { DateRangeField } from "@/components/item/DateRangeField";
import { InlineEditable } from "@/components/item/InlineEditable";
import { PropertyRow } from "@/components/item/PropertyRow";
import { PropertyChip } from "@/components/task/PropertyChip";
import { EnergyChip } from "@/components/task/TaskProperties";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Combobox } from "@/components/ui/combobox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FieldGroup } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useItemMutations } from "@/hooks/useItemMutations";
import { useSaveItem } from "@/hooks/useSaveItem";
import { DEFAULT_SWATCH } from "@/lib/colors";
import { formatDateDisplay } from "@/lib/date-utils";
import { createCategory } from "@/lib/domain/categories";
import { DomainError, setParent, updateItem } from "@/lib/domain/items";
import { recurrencePresetId, RECURRENCE_PRESETS } from "@/lib/recurrence-presets";
import { usePlannerStore } from "@/store/plannerStore";
import { useUIStore } from "@/store/uiStore";
import type { Category, Executor, Person, PlanItem } from "@/types";

interface ItemPropertiesProps {
  item: PlanItem;
  items: PlanItem[];
  people: Person[];
  categories: Category[];
  includeDate?: boolean;
}

export function ItemDateRow({ item }: { item: PlanItem }) {
  const { setDates } = useItemMutations(item);
  return (
    <PropertyRow label="Date">
      <DateRangeField start={item.start} end={item.end} onChange={setDates} />
    </PropertyRow>
  );
}

export function ItemProperties({
  item,
  items,
  people,
  categories,
  includeDate = true,
}: ItemPropertiesProps) {
  const save = useSaveItem();
  const putCategory = usePlannerStore((s) => s.putCategory);
  const dateFormat = useUIStore((s) => s.settings.dateFormat);
  const { setEnergy } = useItemMutations(item);
  const [customRule, setCustomRule] = useState(item.recurrence ?? "");
  const preset = recurrencePresetId(item.recurrence);
  const presetLabel = RECURRENCE_PRESETS.find((entry) => entry.id === preset)?.label ?? "Does not repeat";

  const parentOptions = items
    .filter((candidate) => candidate.id !== item.id && candidate.kind !== "event")
    .map((candidate) => ({ value: candidate.id, label: candidate.title }));

  const personOptions = people.map((person) => ({
    value: person.id,
    label: person.name,
    keywords: person.email,
  }));

  return (
    <FieldGroup className="gap-0">
      {includeDate ? <ItemDateRow item={item} /> : null}

      <PropertyRow label="Energy">
        <EnergyChip value={item.energy} onChange={setEnergy} />
      </PropertyRow>

      <PropertyRow label="Assignees">
        <PeoplePicker
          people={people}
          options={personOptions}
          value={item.assigneeIds}
          placeholder="Assign someone"
          ariaLabel="Assignees"
          onChange={(assigneeIds) => void save(updateItem(item, { assigneeIds }))}
        />
      </PropertyRow>

      <PropertyRow label="Does this">
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
      </PropertyRow>

      {item.kind === "event" && (
        <PropertyRow label="Attendees">
          <PeoplePicker
            people={people}
            options={personOptions}
            value={item.attendeeIds}
            placeholder="Add attendees"
            ariaLabel="Attendees"
            onChange={(attendeeIds) => void save(updateItem(item, { attendeeIds }))}
          />
        </PropertyRow>
      )}

      <Separator className="my-3" />

      <Collapsible className="group">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            Advanced
            <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-1">
          <PropertyRow label="Repeats">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <PropertyChip aria-label={`Repeats: ${presetLabel}`}>
                  <Repeat className="text-muted-foreground" />
                  {presetLabel}
                </PropertyChip>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Repeats</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={preset}
                  onValueChange={(next) => {
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
                    <DropdownMenuRadioItem key={entry.id} value={entry.id}>
                      {entry.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </PropertyRow>
          {preset === "custom" && (
            <PropertyRow label="RRULE">
              <InlineEditable
                value={customRule}
                placeholder="FREQ=WEEKLY"
                aria-label="RRULE"
                className="font-mono text-xs"
                onSave={(next) => {
                  setCustomRule(next.trim());
                  if (next.trim()) return save(updateItem(item, { recurrence: next.trim() }));
                  return true;
                }}
              />
            </PropertyRow>
          )}

          <PropertyRow label="Category">
            <Combobox
              variant="ghost"
              aria-label="Category"
              options={categories.map((category) => ({ value: category.id, label: category.name }))}
              value={item.categoryId}
              placeholder="Choose a category"
              onCreate={(name) => {
                const category = createCategory({ name, color: DEFAULT_SWATCH });
                void putCategory(category).then(() => save(updateItem(item, { categoryId: category.id })));
              }}
              onValueChange={(value) => {
                const id = Array.isArray(value) ? value[0] : value;
                void save(updateItem(item, { categoryId: id }));
              }}
            />
          </PropertyRow>

          <PropertyRow label="Parent">
            <Combobox
              variant="ghost"
              aria-label="Parent"
              options={parentOptions}
              value={item.parentId}
              placeholder="Set parent"
              onValueChange={(value) => {
                const id = Array.isArray(value) ? value[0] : value;
                try {
                  void save(setParent(item, id, items));
                } catch (error) {
                  toast.error(error instanceof DomainError ? error.message : "Failed to save item.");
                }
              }}
            />
          </PropertyRow>

          <PropertyRow label="Place" htmlFor="location-name">
            <InlineEditable
              id="location-name"
              value={item.location?.name ?? item.location?.address ?? item.location?.url ?? ""}
              placeholder="Add a place"
              aria-label="Place"
              onSave={(name) => save(updateItem(item, { location: name.trim() ? { name: name.trim() } : undefined }))}
            />
          </PropertyRow>

          <p className="pt-2 text-xs text-muted-foreground">
            Created {formatDateDisplay(item.createdAt, dateFormat)} · Updated{" "}
            {formatDateDisplay(item.updatedAt, dateFormat)}
          </p>
        </CollapsibleContent>
      </Collapsible>
    </FieldGroup>
  );
}

function PeoplePicker({
  people,
  options,
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  people: Person[];
  options: { value: string; label: string; keywords?: string }[];
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
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
          </span>
        );
      })}
      <Combobox
        multiple
        variant="ghost"
        options={options}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onValueChange={(next) => onChange(Array.isArray(next) ? next : next ? [next] : [])}
      />
    </div>
  );
}
