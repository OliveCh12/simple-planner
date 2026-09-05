"use client";

import { Suspense } from "react";
import { PlanSpace } from "@/components/planspace/PlanSpace";
import { Spinner } from "@/components/ui/spinner";

export default function PlanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="text-muted-foreground" />
        </div>
      }
    >
      <PlanSpace />
    </Suspense>
  );
}
