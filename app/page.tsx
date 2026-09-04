"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Waypoints } from "lucide-react";
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
import { deletePlan, getAllPlans } from "@/lib/db";
import { cn, containerClasses } from "@/lib/utils";
import type { Plan } from "@/types";

export default function Home() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Plan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      setIsLoading(true);
      try {
        const allPlans = await getAllPlans();
        if (!cancelled) setPlans(allPlans);
      } catch (error) {
        console.error("Failed to load plans:", error);
        if (!cancelled) toast.error("Failed to load plans.");
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
      await deletePlan(pendingDelete.id);
      setPlans((prev) => prev.filter((plan) => plan.id !== pendingDelete.id));
      setPendingDelete(null);
      toast.success("Plan deleted");
    } catch (error) {
      console.error("Failed to delete plan:", error);
      toast.error("Failed to delete plan. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  function handlePlanCreated(plan: Plan) {
    setPlans((prev) => [plan, ...prev]);
    router.push(`/roadmap/${plan.id}`);
  }

  const subtitle =
    isLoading || plans.length === 0
      ? undefined
      : plans.length === 1
        ? "1 plan"
        : `${plans.length} plans`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubHeader title="Plans" subtitle={subtitle}>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus />
          New plan
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
                <Waypoints />
              </EmptyMedia>
              <EmptyTitle>No plans yet</EmptyTitle>
              <EmptyDescription>
                A plan is a zoomable timeline for one life area, project, or event. Create one,
                then add tasks along the way.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus />
                Create a plan
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
        onClose={() => setIsCreateOpen(false)}
        onCreated={handlePlanCreated}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete plan"
        description={
          pendingDelete
            ? `Delete “${pendingDelete.title}” and all its tasks? This cannot be undone.`
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
