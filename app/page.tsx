"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Folder, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubHeader } from "@/components/layout/SubHeader";
import { RoadmapCard } from "@/components/roadmap/RoadmapCard";
import { CreateRoadmapSheet } from "@/components/roadmap/CreateRoadmapSheet";
import { getAllRoadmaps, deleteRoadmap } from "@/lib/db";
import type { Roadmap } from "@/types";
import RoadmapCardNew from "@/components/roadmap/RoadmapCardNew";
import { containerClasses } from "@/lib/utils";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function Home() {
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadRoadmaps();
  }, []);

  async function loadRoadmaps() {
    setIsLoading(true);
    try {
      const allRoadmaps = await getAllRoadmaps();
      setRoadmaps(allRoadmaps);
    } catch (error) {
      console.error("Failed to load roadmaps:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteRoadmap(id);
      setRoadmaps(roadmaps.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Failed to delete roadmap:", error);
      alert("Failed to delete roadmap. Please try again.");
    }
  }

  function handleRoadmapCreated(roadmap: Roadmap) {
    setRoadmaps([roadmap, ...roadmaps]);
    router.push(`/roadmap/${roadmap.id}`);
  }

  return (
    <div className="flex flex-col h-full">
      <SubHeader
        title="Timeline Planner"
        subtitle="Plan and track your goals across time"
        showActionButton={true}
        actionButtonLabel="New Roadmap"
        actionButtonIcon={<Plus className="h-4 w-4 mr-2" />}
        onActionClick={() => setIsCreateModalOpen(true)}
        showSeparator={false}
      />

      <div className={`${containerClasses()} py-4 flex-1 w-full`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading roadmaps...</p>
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Folder className="h-12 w-12 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>
                  No roadmaps yet. Create your first one to get started!
                </EmptyTitle>
                <EmptyDescription>
                  Timeline Planner helps you organize and track your goals across time. Create roadmaps to break down your objectives into manageable steps and monitor your progress towards achieving them.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex flex-col gap-4">
                  <Button onClick={() => setIsCreateModalOpen(true)} size={"lg"}>
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Roadmap
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((roadmap) => (
              <RoadmapCard
                key={roadmap.id}
                roadmap={roadmap}
                onDelete={handleDelete}
              />
            ))}
            <RoadmapCardNew
              onClick={() => setIsCreateModalOpen(true)}
              ariaLabel="Create new roadmap"
            />
          </div>
        )}
      </div>

      <CreateRoadmapSheet
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleRoadmapCreated}
      />
    </div>
  );
}
