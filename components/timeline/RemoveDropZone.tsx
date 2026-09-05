"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function RemoveDropZone({ active, hot }: { active: boolean; hot: boolean }) {
  return (
    <div
      data-dropzone="remove-zone"
      aria-hidden={!active}
      className={cn(
        "pointer-events-none fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-lg transition-[opacity,transform,background-color,border-color,color] duration-150 ease-out",
        active ? "opacity-100" : "translate-y-2 opacity-0",
        hot
          ? "scale-105 border-destructive bg-destructive text-white"
          : "border-border bg-card/95 text-muted-foreground backdrop-blur"
      )}
    >
      <Trash2 className="size-4" />
      {hot ? "Release to delete" : "Drop to delete"}
    </div>
  );
}
