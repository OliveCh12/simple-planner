"use client";

import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { DateRangeField } from "@/components/item/DateRangeField";
import { InlineEditable } from "@/components/item/InlineEditable";
import { ItemProperties } from "@/components/item/ItemProperties";
import { ItemTree } from "@/components/item/ItemTree";
import { PropertyRow } from "@/components/item/PropertyRow";
import { KindChip, StatusChip } from "@/components/task/TaskProperties";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeleteItem } from "@/hooks/useItemActions";
import { useItemMutations } from "@/hooks/useItemMutations";
import { usePlannerStore } from "@/store/plannerStore";
import type { PlanItem } from "@/types";

interface ItemEditorProps {
  item: PlanItem;
  onClose?: () => void;
}

export function ItemEditor({ item, onClose }: ItemEditorProps) {
  const items = usePlannerStore((s) => s.items);
  const people = usePlannerStore((s) => s.people);
  const categories = usePlannerStore((s) => s.categories);
  const { saveTitle, saveNotes, saveBrief, setStatus, changeKind, setDates } = useItemMutations(item);
  const deleteItem = useDeleteItem();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start gap-2 border-b px-4 py-3 pr-12">
        <KindChip value={item.kind} onChange={(kind) => void changeKind(kind)} />
        <InlineEditable
          value={item.title}
          required
          placeholder="Task name…"
          aria-label="Title"
          className="h-8 flex-1 text-base font-semibold"
          onSave={saveTitle}
        />
        <StatusChip value={item.status} onChange={(status) => void setStatus(status)} />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label="Open page" asChild>
              <Link href={`/plan/${item.planId}/item/${item.id}`}>
                <ExternalLink />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open page</TooltipContent>
        </Tooltip>
        {onClose && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Delete item"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  onClose();
                  void deleteItem(item);
                }}
              >
                <Trash2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <FieldGroup className="gap-0">
          <PropertyRow label="Date">
            <DateRangeField start={item.start} end={item.end} onChange={setDates} />
          </PropertyRow>
        </FieldGroup>

        <InlineEditable
          multiline
          value={item.notes}
          placeholder="Add a description…"
          aria-label="Notes"
          onSave={saveNotes}
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

        <ItemTree planId={item.planId} parent={item} items={items} />

        <ItemProperties
          item={item}
          items={items}
          people={people}
          categories={categories}
          includeDate={false}
        />
      </div>
    </div>
  );
}
