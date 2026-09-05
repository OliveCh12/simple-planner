"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { SubHeader } from "@/components/layout/SubHeader";
import { CreatePlanDialog } from "@/components/plan/CreatePlanDialog";
import { NewPlanCard } from "@/components/plan/NewPlanCard";
import { PlanCard } from "@/components/plan/PlanCard";
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
import { suggestPlanColor } from "@/lib/domain/plans";
import { getRepository } from "@/lib/repository/create";
import { listHydratedPlans } from "@/lib/repository/hydrate";
import { startDemoSeed } from "@/lib/seed";
import { cn, containerClasses } from "@/lib/utils";
import type { HydratedPlan } from "@/types";

export default function Home() {
  const router = useRouter();
  const [plans, setPlans] = useState<HydratedPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<HydratedPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      setIsLoading(true);
      try {
        const forcePlan = new URLSearchParams(window.location.search).get("seed") === "1";
        await startDemoSeed(forcePlan);
        const allPlans = await listHydratedPlans(getRepository());
        if (!cancelled) setPlans(allPlans);
      } catch (error) {
        console.error("Failed to load calendars:", error);
        if (!cancelled) toast.error("Failed to load calendars.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await getRepository().plans.delete(pendingDelete.id);
      setPlans((prev) => prev.filter((plan) => plan.id !== pendingDelete.id));
      setPendingDelete(null);
      toast.success("Calendar deleted");
    } catch (error) {
      console.error("Failed to delete calendar:", error);
      toast.error("Failed to delete calendar. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  function handlePlanCreated(plan: HydratedPlan) {
    setPlans((prev) => [plan, ...prev]);
    router.push(`/plan/${plan.id}`);
  }

  const subtitle =
    isLoading || plans.length === 0
      ? undefined
      : plans.length === 1
        ? "1 calendar"
        : `${plans.length} calendars`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubHeader title="Calendars" subtitle={subtitle}>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus />
          New calendar
        </Button>
      </SubHeader>

      <div className={cn(containerClasses(), "flex min-h-0 flex-1 flex-col overflow-y-auto py-6")}>
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="text-muted-foreground" />
          </div>
        ) : plans.length === 0 ? (
          <Empty className="flex-1">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarDays />
              </EmptyMedia>
              <EmptyTitle>No calendars yet</EmptyTitle>
              <EmptyDescription>
                A calendar is one area of your life: personal, a business, a project. Create one,
                then add objectives, tasks and events.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus />
                Create a calendar
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onDelete={setPendingDelete} />
            ))}
            <NewPlanCard onClick={() => setIsCreateOpen(true)} />
          </div>
        )}
      </div>

      <CreatePlanDialog
        open={isCreateOpen}
        defaultColor={suggestPlanColor(plans)}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handlePlanCreated}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete calendar"
        description={
          pendingDelete
            ? `Delete “${pendingDelete.title}” with all its objectives, tasks and events? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={isDeleting}
        onConfirm={() => void confirmDelete()}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDelete(null);
        }}
      />
    </div>
  );
}
