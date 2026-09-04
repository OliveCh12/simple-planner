"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ItemBranchTree, type BranchNode } from "@/components/item/ItemBranchTree";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useSaveItem } from "@/hooks/useSaveItem";
import { addSubtask, DomainError } from "@/lib/domain/items";
import { cn } from "@/lib/utils";
import type { PlanItem } from "@/types";

function sortSiblings(items: PlanItem[]) {
  return [...items].sort((a, b) => a.start.localeCompare(b.start) || a.createdAt.localeCompare(b.createdAt));
}

function toBranchNodes(planId: string, parentId: string, items: PlanItem[]): BranchNode[] {
  return sortSiblings(items.filter((item) => item.parentId === parentId)).map((item) => ({
    id: item.id,
    content: (
      <Link
        href={`/plan/${planId}/item/${item.id}`}
        className={cn(
          "min-w-0 flex-1 truncate text-sm hover:underline",
          item.status === "completed" && "text-muted-foreground line-through"
        )}
      >
        {item.title}
      </Link>
    ),
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

function AddChildRow({ parent }: { parent: PlanItem }) {
  const save = useSaveItem();
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);

  const submit = async () => {
    const next = title.trim();
    if (!next) return;
    try {
      await save(addSubtask(parent, { title: next, start: parent.start, end: parent.end }));
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
