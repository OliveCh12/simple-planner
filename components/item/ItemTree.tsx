"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Plus, User } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { addSubtask, completeItem, DomainError, reopenItem, setExecutor } from "@/lib/domain/items";
import { usePlannerStore } from "@/store/plannerStore";
import type { PlanItem } from "@/types";

function sortSiblings(items: PlanItem[]) {
  return [...items].sort((a, b) => a.start.localeCompare(b.start) || a.createdAt.localeCompare(b.createdAt));
}

interface ItemTreeProps {
  planId: string;
  parent: PlanItem;
  items: PlanItem[];
}

export function ItemTree({ planId, parent, items }: ItemTreeProps) {
  if (parent.kind === "event") return null;

  const children = sortSiblings(items.filter((item) => item.parentId === parent.id));

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium">Sub-items</h2>
      <div className="space-y-1">
        {children.map((child) => (
          <TreeNode key={child.id} planId={planId} item={child} items={items} depth={0} />
        ))}
        <AddChildRow parent={parent} />
      </div>
    </section>
  );
}

function TreeNode({
  planId,
  item,
  items,
  depth,
}: {
  planId: string;
  item: PlanItem;
  items: PlanItem[];
  depth: number;
}) {
  const putItem = usePlannerStore((s) => s.putItem);
  const children = sortSiblings(items.filter((candidate) => candidate.parentId === item.id));
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
    <div className="space-y-1">
      <div className="flex items-center gap-2" style={{ paddingLeft: depth * 16 }}>
        <Checkbox
          checked={completed}
          aria-label={`Complete ${item.title}`}
          onCheckedChange={(value) => void toggleComplete(value === true)}
        />
        <Link
          href={`/plan/${planId}/item/${item.id}`}
          className="min-w-0 flex-1 truncate text-sm hover:underline"
        >
          {item.title}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          aria-label={`Executor: ${item.executor}`}
          onClick={() => void toggleExecutor()}
        >
          {item.executor === "ai" ? <Bot /> : <User />}
          {item.executor === "ai" ? "AI" : "Human"}
        </Button>
      </div>
      {children.map((child) => (
        <TreeNode key={child.id} planId={planId} item={child} items={items} depth={depth + 1} />
      ))}
      {item.kind !== "event" && (
        <div style={{ paddingLeft: (depth + 1) * 16 }}>
          <AddChildRow parent={item} />
        </div>
      )}
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
      await putItem(
        addSubtask(parent, {
          title: next,
          start: parent.start,
          end: parent.end,
        })
      );
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
        Add sub-item
      </Button>
    );
  }

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <Input
        autoFocus
        value={title}
        placeholder="Title"
        aria-label="New sub-item title"
        className="h-8"
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            setTitle("");
          }
        }}
      />
      <Button type="submit" size="xs" disabled={!title.trim()}>
        Add
      </Button>
    </form>
  );
}

export function KindBadge({ kind }: { kind: PlanItem["kind"] }) {
  const label = kind === "objective" ? "Objective" : kind === "event" ? "Event" : "Task";
  return <Badge variant="secondary">{label}</Badge>;
}
