"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Waypoints } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { SubHeader } from "@/components/layout/SubHeader";
import { CreateRoadmapDialog } from "@/components/roadmap/CreateRoadmapDialog";
import { NewRoadmapCard } from "@/components/roadmap/NewRoadmapCard";
import { RoadmapCard } from "@/components/roadmap/RoadmapCard";
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
import { deleteRoadmap, getAllRoadmaps } from "@/lib/db";
import { cn, containerClasses } from "@/lib/utils";
import type { Roadmap } from "@/types";

export default function Home() {
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Roadmap | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRoadmaps() {
      setIsLoading(true);
      try {
        const allRoadmaps = await getAllRoadmaps();
        if (!cancelled) setRoadmaps(allRoadmaps);
      } catch (error) {
        console.error("Failed to load roadmaps:", error);
        if (!cancelled) toast.error("Failed to load roadmaps.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadRoadmaps();
    return () => {
      cancelled = true;
    };
  }, []);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteRoadmap(pendingDelete.id);
      setRoadmaps((prev) => prev.filter((r) => r.id !== pendingDelete.id));
      setPendingDelete(null);
      toast.success("Roadmap deleted");
    } catch (error) {
      console.error("Failed to delete roadmap:", error);
      toast.error("Failed to delete roadmap. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleRoadmapCreated(roadmap: Roadmap) {
    setRoadmaps((prev) => [roadmap, ...prev]);
    router.push(`/roadmap/${roadmap.id}`);
  }

  const subtitle =
    isLoading || roadmaps.length === 0
      ? undefined
      : roadmaps.length === 1
        ? "1 roadmap"
        : `${roadmaps.length} roadmaps`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubHeader title="Roadmaps" subtitle={subtitle}>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus />
          New roadmap
        </Button>
      </SubHeader>

      <div className={cn(containerClasses(), "flex min-h-0 flex-1 flex-col overflow-y-auto py-6")}>
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="text-muted-foreground" />
          </div>
        ) : roadmaps.length === 0 ? (
          <Empty className="flex-1">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Waypoints />
              </EmptyMedia>
              <EmptyTitle>No roadmaps yet</EmptyTitle>
              <EmptyDescription>
                A roadmap is a month-by-month timeline for one life area or project. Create
                one, then add objectives to each month.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus />
                Create a roadmap
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roadmaps.map((roadmap) => (
              <RoadmapCard key={roadmap.id} roadmap={roadmap} onDelete={setPendingDelete} />
            ))}
            <NewRoadmapCard onClick={() => setIsCreateOpen(true)} />
          </div>
        )}
      </div>

      <CreateRoadmapDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleRoadmapCreated}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete roadmap"
        description={
          pendingDelete ? `Delete “${pendingDelete.title}” and all its objectives? This cannot be undone.` : ""
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
