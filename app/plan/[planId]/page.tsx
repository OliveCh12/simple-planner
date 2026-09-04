"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Waypoints } from "lucide-react";
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
            <Waypoints />
          </EmptyMedia>
          <EmptyTitle>Plan not found</EmptyTitle>
          <EmptyDescription>It may have been deleted, or the link is out of date.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft />
              All plans
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return <TimelineBoard plan={plan} />;
}
