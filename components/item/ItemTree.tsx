"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Plus, User } from "lucide-react";
import { toast } from "sonner";
import { ItemBranchTree, type BranchNode } from "@/components/item/ItemBranchTree";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { getKindOption } from "@/lib/constants";
import { addSubtask, completeItem, DomainError, reopenItem, setExecutor } from "@/lib/domain/items";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";
import type { ItemKind, PlanItem } from "@/types";

function sortSiblings(items: PlanItem[]) {
  return [...items].sort((a, b) => a.start.localeCompare(b.start) || a.createdAt.localeCompare(b.createdAt));
}

function toBranchNodes(planId: string, parentId: string, items: PlanItem[]): BranchNode[] {
  return sortSiblings(items.filter((item) => item.parentId === parentId)).map((item) => ({
    id: item.id,
    content: <TreeRow planId={planId} item={item} />,
    children: toBranchNodes(planId, item.id, items),
  }));
}

interface ItemTreeProps {
  planId: string;
  parent: PlanItem;
  items: PlanItem[];
}

export function ItemTree({ planId, parent, items }: ItemTreeProps) {
  if (parent.kind === "event") return null;
  const children = toBranchNodes(planId, parent.id, items);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium">Outline</h2>
      {children.length > 0 ? (
        <ItemBranchTree
          guides={false}
          nodes={[
            {
              id: parent.id,
              content: <span className="text-sm font-medium">{parent.title}</span>,
              children,
            },
          ]}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Nothing nested yet.</p>
      )}
      <AddChildRow parent={parent} />
    </section>
  );
}

function TreeRow({ planId, item }: { planId: string; item: PlanItem }) {
  const putItem = usePlannerStore((s) => s.putItem);
  const completed = item.status === "completed";

  const toggleComplete = async (checked: boolean) => {
    try {
      await putItem(checked ? completeItem(item) : reopenItem(item));
    } catch (error) {
      toast.error(error instanceof DomainError ? error.message : "Failed to update item.");
    }
  };

  const toggleExecutor = async () => {
    try {
      await putItem(setExecutor(item, item.executor === "ai" ? "human" : "ai"));
    } catch (error) {
      toast.error(error instanceof DomainError ? error.message : "Failed to update item.");
    }
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Checkbox
        checked={completed}
        aria-label={`Complete ${item.title}`}
        onCheckedChange={(value) => void toggleComplete(value === true)}
      />
      <Link
        href={`/plan/${planId}/item/${item.id}`}
        className={cn("min-w-0 flex-1 truncate text-sm hover:underline", completed && "text-muted-foreground line-through")}
      >
        {item.title}
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={item.executor === "ai" ? "AI" : "Human"}
        onClick={() => void toggleExecutor()}
      >
        {item.executor === "ai" ? <Bot /> : <User />}
      </Button>
    </div>
  );
}

function AddChildRow({ parent }: { parent: PlanItem }) {
  const putItem = usePlannerStore((s) => s.putItem);
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);

  const submit = async () => {
    const next = title.trim();
    if (!next) return;
    try {
      await putItem(addSubtask(parent, { title: next, start: parent.start, end: parent.end }));
      setTitle("");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof DomainError ? error.message : "Failed to add sub-item.");
    }
  };

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="xs" className="text-muted-foreground" onClick={() => setOpen(true)}>
        <Plus />
        Add
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
      <InputGroup>
        <InputGroupAddon>
          <Plus />
        </InputGroupAddon>
        <InputGroupInput
          autoFocus
          value={title}
          placeholder="New sub-item"
          aria-label="New sub-item title"
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

export function KindBadge({ kind }: { kind: ItemKind }) {
  const option = getKindOption(kind);
  return (
    <Badge variant="secondary" className="gap-1">
      <option.icon />
      {option.label}
    </Badge>
  );
}
