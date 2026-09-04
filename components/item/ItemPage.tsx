"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, CalendarRange, StickyNote, Waypoints } from "lucide-react";
import { CopyForAi } from "@/components/item/CopyForAi";
import { ItemProperties } from "@/components/item/ItemProperties";
import { ItemTree, KindBadge } from "@/components/item/ItemTree";
import { StatusChip } from "@/components/task/TaskProperties";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { itemDocumentForAi } from "@/lib/copy-for-ai";
import { completeItem, DomainError, reopenItem, updateItem } from "@/lib/domain/items";
import { expandRecurrence } from "@/lib/time/recurrence";
import { cn, containerClasses } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";
import type { ItemStatus, Plan, PlanItem } from "@/types";
import { toast } from "sonner";

interface ItemPageProps {
  plan: Plan;
  item: PlanItem;
}

export function ItemPage({ plan, item }: ItemPageProps) {
  const items = usePlannerStore((s) => s.items);
  const people = usePlannerStore((s) => s.people);
  const categories = usePlannerStore((s) => s.categories);
  const putItem = usePlannerStore((s) => s.putItem);
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes);
  const [brief, setBrief] = useState(item.agentBrief ?? "");

  const parent = items.find((candidate) => candidate.id === item.parentId);
  const occurrences = useMemo(() => {
    if (!item.recurrence) return [];
    const start = parseRangeStart(item.start);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    return expandRecurrence(item, { start, end }).slice(0, 8);
  }, [item]);

  const save = async (next: PlanItem) => {
    try {
      await putItem(next);
    } catch (error) {
      toast.error(error instanceof DomainError ? error.message : "Failed to save item.");
    }
  };

  const commitTitle = () => {
    const next = title.trim();
    if (!next) {
      setTitle(item.title);
      return;
    }
    if (next !== item.title) void save(updateItem(item, { title: next }));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="border-b">
        <div className={cn(containerClasses(), "space-y-3 py-4")}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Plans</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/plan/${plan.id}`}>{plan.title}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {parent && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={`/plan/${plan.id}/item/${parent.id}`}>{parent.title}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <KindBadge kind={item.kind} />
            <Input
              value={title}
              aria-label="Title"
              onChange={(event) => setTitle(event.target.value)}
              onBlur={commitTitle}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitTitle();
                }
              }}
              className="h-9 min-w-0 flex-1 border-0 bg-transparent px-1 text-xl font-semibold shadow-none focus-visible:bg-muted/60 focus-visible:ring-0 md:text-xl"
            />
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <StatusChip
                value={item.status}
                onChange={(status: ItemStatus) => {
                  if (status === "completed") {
                    void save(completeItem(item));
                    return;
                  }
                  if (item.status === "completed") {
                    void save(updateItem(reopenItem(item), { status }));
                    return;
                  }
                  void save(updateItem(item, { status }));
                }}
              />
              <ButtonGroup>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/plan/${plan.id}?focus=${item.id}`}>
                    <CalendarRange />
                    Timeline
                  </Link>
                </Button>
                <CopyForAi document={itemDocumentForAi(item)} iconOnly />
              </ButtonGroup>
            </div>
          </div>
        </div>
      </header>

      <div className={cn(containerClasses(), "flex flex-col gap-10 py-8 lg:flex-row")}>
        <div className="min-w-0 flex-1 space-y-8 lg:w-2/3">
          <InputGroup className="h-auto min-h-28 items-start">
            <InputGroupAddon className="pt-3">
              <StickyNote />
            </InputGroupAddon>
            <InputGroupTextarea
              value={notes}
              placeholder="Notes…"
              aria-label="Notes"
              className="min-h-28 py-3"
              onChange={(event) => setNotes(event.target.value)}
              onBlur={() => {
                if (notes !== item.notes) void save(updateItem(item, { notes }));
              }}
            />
          </InputGroup>

          {item.executor === "ai" && (
            <InputGroup className="h-auto min-h-24 items-start">
              <InputGroupAddon className="pt-3">
                <Bot />
              </InputGroupAddon>
              <InputGroupTextarea
                value={brief}
                placeholder="Brief for the AI executor…"
                aria-label="Agent brief"
                className="min-h-24 py-3"
                onChange={(event) => setBrief(event.target.value)}
                onBlur={() => {
                  const next = brief.trim();
                  if (next !== (item.agentBrief ?? "")) {
                    void save(updateItem(item, { agentBrief: next || undefined }));
                  }
                }}
              />
            </InputGroup>
          )}

          <ItemTree planId={plan.id} parent={item} items={items} />

          {occurrences.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Next: {occurrences.map((occurrence) => occurrence.start.slice(0, 10)).join(" · ")}
            </p>
          )}
        </div>

        <aside className="min-w-0 lg:w-80 lg:shrink-0">
          <ItemProperties item={item} items={items} people={people} categories={categories} />
        </aside>
      </div>
    </div>
  );
}

export function ItemPageState({
  planId,
  isLoading,
  plan,
  item,
}: {
  planId: string;
  isLoading: boolean;
  plan: Plan | null;
  item: PlanItem | undefined;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="text-muted-foreground" />
      </div>
    );
  }

  if (!plan || !item) {
    return (
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Waypoints />
          </EmptyMedia>
          <EmptyTitle>{plan ? "Item not found" : "Plan not found"}</EmptyTitle>
          <EmptyDescription>It may have been deleted, or the link is out of date.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" asChild>
            <Link href={plan ? `/plan/${planId}` : "/"}>
              <ArrowLeft />
              {plan ? "Back to plan" : "All plans"}
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return <ItemPage key={item.id} plan={plan} item={item} />;
}

function parseRangeStart(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}
