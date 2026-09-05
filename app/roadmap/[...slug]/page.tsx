"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Legacy `/roadmap/:id` URLs, kept as a redirect to `/plan/:id`. */
export default function LegacyRoadmapRedirect() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params.slug) ? params.slug : [];
  const roadmapId = slug[0] ?? "";
  const section = slug[1];
  const itemId = slug[2];

  useEffect(() => {
    if (!roadmapId) {
      router.replace("/");
      return;
    }
    if (itemId && (section === "objective" || section === "item")) {
      router.replace(`/plan/${roadmapId}/item/${itemId}`);
      return;
    }
    router.replace(`/plan/${roadmapId}`);
  }, [itemId, roadmapId, router, section]);

  return (
    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      Opening calendar…
    </div>
  );
}
