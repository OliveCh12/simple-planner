"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarRange, Waypoints } from "lucide-react";
import { CopyForAi } from "@/components/item/CopyForAi";
import { InlineEditable } from "@/components/item/InlineEditable";
import { ItemDateRow, ItemProperties } from "@/components/item/ItemProperties";
import { ItemTree } from "@/components/item/ItemTree";
import { KindChip, StatusChip } from "@/components/task/TaskProperties";
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
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useItemMutations } from "@/hooks/useItemMutations";
import { itemDocumentForAi } from "@/lib/copy-for-ai";
import { expandRecurrence } from "@/lib/time/recurrence";
import { cn, containerClasses } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";
import type { Plan, PlanItem } from "@/types";

interface ItemPageProps {
  plan: Plan;
  item: PlanItem;
}

export function ItemPage({ plan, item }: ItemPageProps) {
  const items = usePlannerStore((s) => s.items);
  const people = usePlannerStore((s) => s.people);
  const categories = usePlannerStore((s) => s.categories);
  const { saveTitle, saveNotes, saveBrief, setStatus, changeKind } = useItemMutations(item);

  const parent = items.find((candidate) => candidate.id === item.parentId);
  const occurrences = useMemo(() => {
    if (!item.recurrence) return [];
    const start = parseRangeStart(item.start);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    return expandRecurrence(item, { start, end }).slice(0, 8);
  }, [item]);

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
            <KindChip value={item.kind} onChange={(kind) => void changeKind(kind)} />
            <InlineEditable
              value={item.title}
              required
              placeholder="Task name…"
              aria-label="Title"
              className="h-9 min-w-0 flex-1 text-xl font-semibold md:text-xl"
              onSave={saveTitle}
            />
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <StatusChip value={item.status} onChange={(status) => void setStatus(status)} />
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
          <FieldGroup className="gap-0">
            <ItemDateRow item={item} />
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

          <ItemTree planId={plan.id} parent={item} items={items} />

          {occurrences.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Next: {occurrences.map((occurrence) => occurrence.start.slice(0, 10)).join(" · ")}
            </p>
          )}
        </div>

        <aside className="min-w-0 lg:w-80 lg:shrink-0">
          <ItemProperties
            item={item}
            items={items}
            people={people}
            categories={categories}
            includeDate={false}
          />
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
