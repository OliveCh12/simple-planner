"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { TimelineBoard } from "@/components/timeline/TimelineBoard";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { usePlan } from "@/hooks/usePlan";
import type { HydratedPlan } from "@/types";

function PlanBoard({ plan }: { plan: HydratedPlan }) {
  const searchParams = useSearchParams();
  return <TimelineBoard plan={plan} focusItemId={searchParams.get("focus")} />;
}

export default function PlanPage() {
  const params = useParams();
  const planId = typeof params.planId === "string" ? params.planId : "";
  const { plan, isLoading } = usePlan(planId || null);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="text-muted-foreground" />
      </div>
    );
  }

  if (!plan) {
    return (
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarDays />
          </EmptyMedia>
          <EmptyTitle>Calendar not found</EmptyTitle>
          <EmptyDescription>It may have been deleted, or the link is out of date.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft />
              All calendars
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="text-muted-foreground" />
        </div>
      }
    >
      <PlanBoard key={plan.id} plan={plan} />
    </Suspense>
  );
}
