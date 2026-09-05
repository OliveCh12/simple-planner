"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, MoreHorizontal, Trash2, X } from "lucide-react";
import { EventWeather } from "@/components/environment/EventWeather";
import { EditorSection } from "@/components/item/EditorSection";
import { InlineEditable } from "@/components/item/InlineEditable";
import { ImageAddButton, ItemImages } from "@/components/item/ItemImages";
import { ItemAdvanced, ItemDetails, ItemProperties } from "@/components/item/ItemProperties";
import { ItemTree, ItemTreeProgress } from "@/components/item/ItemTree";
import { MarkdownNote } from "@/components/item/MarkdownNote";
import { OccurrenceEditDialog } from "@/components/item/OccurrenceEditDialog";
import { SaveIndicator } from "@/components/item/SaveIndicator";
import { ScheduleSection } from "@/components/item/ScheduleSection";
import { CalendarDot } from "@/components/plan/CalendarDot";
import { KindChip, StatusChip } from "@/components/task/TaskProperties";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeleteItem } from "@/hooks/useItemActions";
import { useItemMutations } from "@/hooks/useItemMutations";
import { useSaveItem } from "@/hooks/useSaveItem";
import { categoryAtmosphere, DEFAULT_SWATCH } from "@/lib/colors";
import { createCategory } from "@/lib/domain/categories";
import {
  duplicateItem,
  excludeOccurrence,
  isUnconfirmedDraft,
  splitOccurrence,
  updateItem,
} from "@/lib/domain/items";
import { childNoun } from "@/lib/domain/tree";
import { isItemReadOnly } from "@/lib/sync/access";
import { describeSync } from "@/lib/sync/mapping";
import { SourceMark } from "@/components/plan/SourceMark";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";
import type { PlanItem } from "@/types";

interface ItemEditorProps {
  item: PlanItem;
  occurrenceStart?: string;
  onClose?: () => void;
}

/**
 * Details pane. Reads top to bottom: identity, time, work, notes, people,
 * links, then the rarely touched rows. Colour is an atmosphere, not a banner.
 */
export function ItemEditor({ item, occurrenceStart, onClose }: ItemEditorProps) {
  const items = usePlannerStore((s) => s.items);
  const people = usePlannerStore((s) => s.people);
  const categories = usePlannerStore((s) => s.categories);
  const putItem = usePlannerStore((s) => s.putItem);
  const putCategory = usePlannerStore((s) => s.putCategory);
  const currentPlan = usePlannerStore((s) => s.currentPlan);
  const plans = usePlannerStore((s) => s.plans);
  const plan = plans.find((entry) => entry.id === item.planId) ?? currentPlan;
  const { saveTitle, saveNotes, saveBrief, setStatus, changeKind } = useItemMutations(item);
  const deleteItem = useDeleteItem();
  const save = useSaveItem();
  const recurring = Boolean(item.recurrence);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const category = categories.find((entry) => entry.id === item.categoryId);
  const tint = category?.color ?? plan?.color;
  const atmosphere = tint ? categoryAtmosphere(tint) : undefined;
  const readOnly = isItemReadOnly(item, plan);
  const sync = describeSync(item, plan);
  const external = plan?.source && plan.source.provider !== "local";
  const images = item.images ?? [];
  const draft = isUnconfirmedDraft(item);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      onKeyDownCapture={(event) => {
        if (event.key !== "Escape" || !draft || !onClose) return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
    >
      <header className="relative border-b border-cal-line-strong px-4 pt-2.5 pb-3" style={atmosphere}>
        <div className="flex items-center gap-0.5">
          <KindChip value={item.kind} onChange={(kind) => void changeKind(kind)} />
          <span className="flex-1" />
          {!draft && <SaveIndicator itemId={item.id} />}
          {!draft && <StatusChip value={item.status} onChange={(status) => void setStatus(status)} />}
          {!draft && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon-xs" aria-label="More actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={!item.title.trim()}
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
          )}
          {onClose && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={draft ? "Discard draft" : "Close details"}
                  onClick={onClose}
                >
                  <X />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {draft ? "Discard draft" : "Close"} <Kbd>Esc</Kbd>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <InlineEditable
          value={item.title}
          required
          autoFocus={Boolean(item.draft)}
          focusKey={item.draft ? item.start : undefined}
          placeholder={draft ? `Name this ${item.kind}…` : `New ${item.kind}…`}
          aria-label="Title"
          className="mt-1 h-9 px-1.5 text-lg font-semibold tracking-tight md:text-lg"
          onSave={saveTitle}
        />
        {draft ? (
          <p className="mt-1 pl-1.5 text-[11px] text-muted-foreground">
            Draft. Press <Kbd className="h-4 min-w-4 text-[10px]">Enter</Kbd> on a name to keep it, or click another slot to move it.
          </p>
        ) : (
          <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 pl-0.5">
            <CalendarDot color={category?.color} className={cn(!category && "opacity-30")} />
            <Combobox
              variant="ghost"
              aria-label="Category"
              options={categories.map((entry) => ({ value: entry.id, label: entry.name }))}
              value={item.categoryId}
              placeholder="No category"
              onCreate={(name) => {
                const created = createCategory({ name, color: DEFAULT_SWATCH });
                void putCategory(created).then(() => save(updateItem(item, { categoryId: created.id })));
              }}
              onValueChange={(value) => {
                const id = Array.isArray(value) ? value[0] : value;
                void save(updateItem(item, { categoryId: id }));
              }}
            />
            {external && (
              <span
                className={cn(
                  "ml-auto inline-flex items-center gap-1 truncate text-[11px]",
                  sync.tone === "conflict" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                )}
                title={plan?.source?.account}
              >
                <SourceMark source={plan?.source} />
                {sync.label}
                {readOnly ? "" : plan?.source?.account ? ` · ${plan.source.account}` : ""}
              </span>
            )}
          </div>
        )}
      </header>

      <div className="scroll-thin flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-6">
          {recurring && occurrenceStart && (
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              This occurrence of a repeating item.
              <button
                type="button"
                className="rounded-sm text-foreground underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  const { series, detached } = splitOccurrence(item, occurrenceStart);
                  void putItem(series).then(() => putItem(detached));
                  onClose?.();
                }}
              >
                Edit only this one
              </button>
            </p>
          )}

          <EditorSection title="When">
            <ScheduleSection item={item} />
            <EventWeather item={item} />
          </EditorSection>

          {!draft && (
            <>
              <EditorSection title={childNoun(item.kind)} action={<ItemTreeProgress parent={item} items={items} />}>
                <ItemTree planId={item.planId} parent={item} items={items} heading={false} />
              </EditorSection>

              <EditorSection
                title="Notes"
                action={
                  <ImageAddButton onAdd={(added) => void save(updateItem(item, { images: [...images, ...added] }))} />
                }
              >
                <MarkdownNote value={item.notes} onSave={saveNotes} />
                <ItemImages
                  images={images}
                  onChange={(next) => void save(updateItem(item, { images: next.length ? next : undefined }))}
                />
                {item.executor === "ai" && (
                  <InlineEditable
                    multiline
                    value={item.agentBrief ?? ""}
                    placeholder="Brief for the AI executor…"
                    aria-label="Agent brief"
                    className="-mx-2"
                    onSave={saveBrief}
                  />
                )}
              </EditorSection>

              <EditorSection title="People">
                <ItemProperties
                  item={item}
                  items={items}
                  people={people}
                  categories={categories}
                  includeDate={false}
                  includeAdvanced={false}
                />
              </EditorSection>

              <EditorSection title="Details">
                <ItemDetails item={item} items={items} />
                <ItemAdvanced item={item} />
              </EditorSection>
            </>
          )}
        </div>
      </div>
      <OccurrenceEditDialog
        open={deleteOpen}
        title="Delete recurring item"
        description="Remove only this occurrence, or delete the whole series."
        onThis={() => {
          const at = occurrenceStart ?? item.start;
          if (at) void save(excludeOccurrence(item, at));
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
