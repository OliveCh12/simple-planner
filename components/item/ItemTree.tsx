"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ItemBranchTree, type BranchNode } from "@/components/item/ItemBranchTree";
import { ProgressDonut } from "@/components/item/ProgressDonut";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useSaveItem } from "@/hooks/useSaveItem";
import { addSubtask, applyStatus, DomainError } from "@/lib/domain/items";
import { childNoun, childProgress, childrenOf } from "@/lib/domain/tree";
import { cn } from "@/lib/utils";
import type { PlanItem } from "@/types";

function ChildRow({ planId, item }: { planId: string; item: PlanItem }) {
  const save = useSaveItem();
  const done = item.status === "completed";
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      <Checkbox
        checked={done}
        aria-label={done ? `Reopen ${item.title}` : `Complete ${item.title}`}
        onCheckedChange={(checked) => void save(applyStatus(item, checked ? "completed" : "pending"))}
      />
      <Link
        href={`/plan/${planId}/item/${item.id}`}
        className={cn(
          "min-w-0 flex-1 truncate rounded-sm text-[13px] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring",
          done && "text-muted-foreground line-through"
        )}
      >
        {item.title}
      </Link>
    </div>
  );
}

function toBranchNodes(planId: string, parentId: string, items: PlanItem[]): BranchNode[] {
  return childrenOf(parentId, items).map((item) => ({
    id: item.id,
    content: <ChildRow planId={planId} item={item} />,
    children: toBranchNodes(planId, item.id, items),
  }));
}

interface ItemTreeProps {
  planId: string;
  parent: PlanItem;
  items: PlanItem[];
  /** Print the section heading with the count; off when a parent section already names it. */
  heading?: boolean;
}

/** Children of an item as a checklist: tasks under an objective, subtasks under a task. */
export function ItemTree({ planId, parent, items, heading = true }: ItemTreeProps) {
  const nodes = toBranchNodes(planId, parent.id, items);
  const { done, total } = childProgress(parent.id, items);
  const noun = childNoun(parent.kind);

  return (
    <section className="flex flex-col gap-2">
      {heading && (
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium capitalize">{noun}</h2>
          {total > 0 && <ProgressDonut done={done} total={total} />}
        </div>
      )}
      {nodes.length > 0 ? (
        <ItemBranchTree nodes={nodes} className="-ml-1" />
      ) : (
        <p className="text-[13px] text-muted-foreground">No {noun} yet.</p>
      )}
      <AddChildRow parent={parent} noun={childNoun(parent.kind, 1)} />
    </section>
  );
}

export function ItemTreeProgress({ parent, items }: { parent: PlanItem; items: PlanItem[] }) {
  const { done, total } = childProgress(parent.id, items);
  if (total === 0) return null;
  return (
    <span className="flex items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground">
      <ProgressDonut done={done} total={total} size={16} stroke={2.5} label={false} />
      {done}/{total}
    </span>
  );
}

function AddChildRow({ parent, noun }: { parent: PlanItem; noun: string }) {
  const save = useSaveItem();
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);

  const submit = async () => {
    const next = title.trim();
    if (!next) return;
    try {
      await save(addSubtask(parent, { title: next }));
      setTitle("");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof DomainError ? error.message : `Failed to add ${noun}.`);
    }
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="-ml-1.5 w-fit text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Plus />
        Add {noun}
      </Button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <InputGroup className="h-8">
        <InputGroupAddon>
          <Plus />
        </InputGroupAddon>
        <InputGroupInput
          autoFocus
          value={title}
          placeholder={`New ${noun}`}
          aria-label={`New ${noun} title`}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setTitle("");
            }
          }}
        />
        <InputGroupButton type="submit" disabled={!title.trim()}>
          Add
        </InputGroupButton>
      </InputGroup>
    </form>
  );
}
