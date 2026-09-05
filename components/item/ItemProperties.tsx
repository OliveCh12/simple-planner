"use client";

import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { DateRangeField } from "@/components/item/DateRangeField";
import { InlineEditable } from "@/components/item/InlineEditable";
import { PropertyRow } from "@/components/item/PropertyRow";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Combobox } from "@/components/ui/combobox";
import { FieldGroup } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useItemMutations } from "@/hooks/useItemMutations";
import { useSaveItem } from "@/hooks/useSaveItem";
import { DEFAULT_SWATCH } from "@/lib/colors";
import { formatDateDisplay } from "@/lib/date-utils";
import { DomainError, setParent, updateItem } from "@/lib/domain/items";
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
  includeDate = true,
}: ItemPropertiesProps) {
  const save = useSaveItem();
  const dateFormat = useUIStore((s) => s.settings.dateFormat);

  const parentOptions = items
    .filter((candidate) => {
      if (candidate.id === item.id) return false;
      if (item.kind === "event") return candidate.kind === "objective";
      if (item.kind === "objective") return false;
      return true;
    })
    .map((candidate) => ({ value: candidate.id, label: candidate.title }));

  const personOptions = people.map((person) => ({
    value: person.id,
    label: person.name,
    keywords: person.email,
  }));

  return (
    <FieldGroup className="gap-0">
      {includeDate ? <ItemDateRow item={item} /> : null}

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
