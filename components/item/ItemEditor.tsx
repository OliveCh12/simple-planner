"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, MoreHorizontal, Trash2, X } from "lucide-react";
import { EnergySlider } from "@/components/item/EnergySlider";
import { InlineEditable } from "@/components/item/InlineEditable";
import { ItemImages } from "@/components/item/ItemImages";
import { ItemProperties } from "@/components/item/ItemProperties";
import { ItemTree } from "@/components/item/ItemTree";
import { MarkdownNote } from "@/components/item/MarkdownNote";
import { OccurrenceEditDialog } from "@/components/item/OccurrenceEditDialog";
import { ScheduleField } from "@/components/item/ScheduleField";
import { KindChip, StatusChip } from "@/components/task/TaskProperties";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteItem } from "@/hooks/useItemActions";
import { useItemMutations } from "@/hooks/useItemMutations";
import { useSaveItem } from "@/hooks/useSaveItem";
import { categorySurface } from "@/lib/colors";
import { DEFAULT_SWATCH } from "@/lib/colors";
import { createCategory } from "@/lib/domain/categories";
import { duplicateItem, excludeOccurrence, splitOccurrence, updateItem } from "@/lib/domain/items";
import { usePlannerStore } from "@/store/plannerStore";
import type { PlanItem } from "@/types";

interface ItemEditorProps {
  item: PlanItem;
  occurrenceStart?: string;
  onClose?: () => void;
}

export function ItemEditor({ item, occurrenceStart, onClose }: ItemEditorProps) {
  const items = usePlannerStore((s) => s.items);
  const people = usePlannerStore((s) => s.people);
  const categories = usePlannerStore((s) => s.categories);
  const putItem = usePlannerStore((s) => s.putItem);
  const putCategory = usePlannerStore((s) => s.putCategory);
  const { saveTitle, saveNotes, saveBrief, setStatus, changeKind, setDates, setEnergy } = useItemMutations(item);
  const deleteItem = useDeleteItem();
  const save = useSaveItem();
  const recurring = Boolean(item.recurrence);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const category = categories.find((entry) => entry.id === item.categoryId);
  const surface = category ? categorySurface(category.color, "task") : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header
        className="space-y-3 border-b px-4 py-3"
        style={surface ? { backgroundImage: surface.backgroundImage } : undefined}
      >
        <div className="flex items-start gap-1">
          <KindChip value={item.kind} onChange={(kind) => void changeKind(kind)} />
          <InlineEditable
            value={item.title}
            required
            placeholder="Name…"
            aria-label="Title"
            className="h-8 flex-1 text-base font-semibold"
            onSave={saveTitle}
          />
          <StatusChip value={item.status} onChange={(status) => void setStatus(status)} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon-xs" aria-label="More actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  void putItem(duplicateItem(item));
                }}
              >
                <Copy />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/plan/${item.planId}/item/${item.id}`}>
                  <ExternalLink />
                  Open page
                </Link>
              </DropdownMenuItem>
              {onClose && (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => {
                    if (recurring) {
                      setDeleteOpen(true);
                      return;
                    }
                    onClose();
                    void deleteItem(item);
                  }}
                >
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {onClose && (
            <Button type="button" variant="ghost" size="icon-xs" aria-label="Close details" onClick={onClose}>
              <X />
            </Button>
          )}
        </div>
        <Combobox
          variant="ghost"
          aria-label="Category"
          options={categories.map((entry) => ({ value: entry.id, label: entry.name }))}
          value={item.categoryId}
          placeholder="Category"
          onCreate={(name) => {
            const created = createCategory({ name, color: DEFAULT_SWATCH });
            void putCategory(created).then(() => save(updateItem(item, { categoryId: created.id })));
          }}
          onValueChange={(value) => {
            const id = Array.isArray(value) ? value[0] : value;
            void save(updateItem(item, { categoryId: id }));
          }}
        />
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4 [scrollbar-width:thin]">
        {recurring && occurrenceStart && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <p className="text-muted-foreground">This occurrence of a repeating item.</p>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => {
                const { series, detached } = splitOccurrence(item, occurrenceStart);
                void putItem(series).then(() => putItem(detached));
                onClose?.();
              }}
            >
              Edit this occurrence only
            </Button>
          </div>
        )}

        <ScheduleField
          start={item.start}
          end={item.end}
          recurrence={item.recurrence}
          onChange={setDates}
          onRecurrenceChange={(rule) => void save(updateItem(item, { recurrence: rule }))}
        />

        <ItemTree planId={item.planId} parent={item} items={items} />

        <section className="space-y-2">
          <h2 className="text-sm font-medium">Energy</h2>
          <EnergySlider value={item.energy} onChange={setEnergy} />
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium">Description</h2>
          <MarkdownNote value={item.notes} onSave={saveNotes} />
        </section>

        <ItemImages
          images={item.images ?? []}
          onChange={(images) => void save(updateItem(item, { images: images.length ? images : undefined }))}
        />

        {item.executor === "ai" && (
          <InlineEditable
            multiline
            value={item.agentBrief ?? ""}
            placeholder="Brief for the AI executor…"
            aria-label="Agent brief"
            onSave={saveBrief}
          />
        )}

        <ItemProperties item={item} items={items} people={people} categories={categories} includeDate={false} />
      </div>
      <OccurrenceEditDialog
        open={deleteOpen}
        title="Delete recurring item"
        description="Remove only this occurrence, or delete the whole series."
        onThis={() => {
          void save(excludeOccurrence(item, occurrenceStart ?? item.start));
          setDeleteOpen(false);
          onClose?.();
        }}
        onSeries={() => {
          setDeleteOpen(false);
          onClose?.();
          void deleteItem(item);
        }}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
