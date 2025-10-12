"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubHeader } from "@/components/layout/SubHeader";
import { RoadmapCard } from "@/components/roadmap/RoadmapCard";
import { CreateRoadmapModal } from "@/components/roadmap/CreateRoadmapModal";
import { getAllRoadmaps, deleteRoadmap } from "@/lib/db";
import type { Roadmap } from "@/types";
import RoadmapCardNew from "@/components/roadmap/RoadmapCardNew";

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
    <div>
      <SubHeader
        title="Timeline Planner"
        subtitle="Plan and track your goals across time"
        showActionButton={true}
        actionButtonLabel="New Roadmap"
        actionButtonIcon={<Plus className="h-4 w-4 mr-2" />}
        onActionClick={() => setIsCreateModalOpen(true)}
      />

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading roadmaps...</p>
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No roadmaps yet. Create your first one to get started!
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Roadmap
            </Button>
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
            <RoadmapCardNew onClick={() => setIsCreateModalOpen(true)} ariaLabel="Create new roadmap" />
          </div>
        )}
      </div>

      <CreateRoadmapModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleRoadmapCreated}
      />
    </div>
  );
}
