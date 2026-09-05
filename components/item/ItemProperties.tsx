"use client";

import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { DateRangeField } from "@/components/item/DateRangeField";
import { InlineEditable } from "@/components/item/InlineEditable";
import { PropertyRow } from "@/components/item/PropertyRow";
import { EnergyChip } from "@/components/task/TaskProperties";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Combobox } from "@/components/ui/combobox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useItemMutations } from "@/hooks/useItemMutations";
import { useSaveItem } from "@/hooks/useSaveItem";
import { DEFAULT_SWATCH } from "@/lib/colors";
import { getKindOption } from "@/lib/constants";
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
  /** Also render the links and the advanced rows (the item page does; the pane lays them out itself). */
  includeAdvanced?: boolean;
}

export function ItemDateRow({ item }: { item: PlanItem }) {
  const { setDates } = useItemMutations(item);
  return (
    <PropertyRow label="Date">
      <DateRangeField start={item.start} end={item.end} onChange={setDates} />
    </PropertyRow>
  );
}

/** Who and how much: energy, people, executor. */
export function ItemProperties({
  item,
  items,
  people,
  includeDate = true,
  includeAdvanced = true,
}: ItemPropertiesProps) {
  const save = useSaveItem();
  const { setEnergy } = useItemMutations(item);

  const personOptions = people.map((person) => ({
    value: person.id,
    label: person.name,
    keywords: person.email,
  }));

  return (
    <div className="flex flex-col">
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

      <PropertyRow label="Done by">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={item.executor}
          className="-ml-px"
          onValueChange={(value) => {
            if (value === "human" || value === "ai") {
              void save(updateItem(item, { executor: value as Executor }));
            }
          }}
        >
          <ToggleGroupItem value="human" className="h-7 px-2.5 text-xs">
            Human
          </ToggleGroupItem>
          <ToggleGroupItem value="ai" className="h-7 px-2.5 text-xs">
            AI
          </ToggleGroupItem>
        </ToggleGroup>
      </PropertyRow>

      {includeAdvanced && (
        <>
          <ItemDetails item={item} items={items} />
          <ItemAdvanced item={item} />
        </>
      )}
    </div>
  );
}

/** Where the item belongs and where it happens. */
export function ItemDetails({ item, items }: { item: PlanItem; items: PlanItem[] }) {
  const save = useSaveItem();

  const parentOptions = items
    .filter((candidate) => {
      if (candidate.id === item.id) return false;
      if (candidate.draft) return false;
      if (item.kind === "event") return candidate.kind === "objective";
      if (item.kind === "objective") return false;
      return true;
    })
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.title.localeCompare(b.title))
    .map((candidate) => ({
      value: candidate.id,
      label: candidate.title || "Untitled",
      keywords: getKindOption(candidate.kind).label,
    }));

  const parentLabel = item.kind === "event" ? "Goal" : "Part of";

  return (
    <div className="flex flex-col">
      {item.kind !== "objective" && (
        <PropertyRow label={parentLabel}>
          <Combobox
            variant="ghost"
            aria-label={parentLabel}
            options={parentOptions}
            value={item.parentId}
            placeholder={item.kind === "event" ? "No goal" : "Nothing"}
            searchPlaceholder="Search goals, tasks…"
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
      )}

      <PropertyRow label="Place" htmlFor="location-name">
        <InlineEditable
          id="location-name"
          value={item.location?.name ?? item.location?.address ?? item.location?.url ?? ""}
          placeholder="Add a place"
          aria-label="Place"
          className="-ml-2 h-7"
          onSave={(name) => save(updateItem(item, { location: name.trim() ? { name: name.trim() } : undefined }))}
        />
      </PropertyRow>
    </div>
  );
}

/** Timestamps: behind a disclosure, never in the way. */
export function ItemAdvanced({ item }: { item: PlanItem }) {
  const dateFormat = useUIStore((s) => s.settings.dateFormat);

  return (
    <Collapsible className="group/advanced mt-1">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="-ml-1.5 h-6 text-muted-foreground hover:text-foreground"
        >
          Advanced
          <ChevronDown className="size-3 transition-transform group-data-[state=open]/advanced:rotate-180" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col pt-1">
        <p className="text-[11px] text-muted-foreground">
          Created {formatDateDisplay(item.createdAt, dateFormat)} · Updated{" "}
          {formatDateDisplay(item.updatedAt, dateFormat)}
        </p>
      </CollapsibleContent>
    </Collapsible>
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
    <div className="-ml-1.5 flex min-w-0 flex-wrap items-center gap-1">
      {value.map((id) => {
        const person = people.find((entry) => entry.id === id);
        if (!person) return null;
        return (
          <Avatar key={id} size="sm" className="size-5" title={person.name}>
            <AvatarFallback
              style={{ backgroundColor: person.color ?? DEFAULT_SWATCH }}
              className="text-[10px] text-white"
            >
              {person.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
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
