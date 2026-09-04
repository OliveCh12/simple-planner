"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Legacy `/roadmap/:id` URLs, kept as a redirect to `/plan/:id`. */
export default function LegacyRoadmapRedirect() {
  const params = useParams();
  const router = useRouter();
  const roadmapId = Array.isArray(params.slug) ? params.slug[0] : "";

  useEffect(() => {
    router.replace(roadmapId ? `/plan/${roadmapId}` : "/");
  }, [roadmapId, router]);

  return (
    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      Opening plan…
    </div>
  );
}
