"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ObjectiveRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const roadmapId = typeof params.roadmapId === "string" ? params.roadmapId : "";

  useEffect(() => {
    if (roadmapId) router.replace(`/roadmap/${roadmapId}`);
    else router.replace("/");
  }, [roadmapId, router]);

  return (
    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      Opening timeline…
    </div>
  );
}
