"use client";

import { Trash2 } from "lucide-react";
import { useDroppable } from "@dnd-kit/react";
import { cn } from "@/lib/utils";

export function RemoveDropZone({ isDragging }: { isDragging: boolean }) {
  const { ref, isDropTarget } = useDroppable({ id: "remove-zone" });

  return (
    <div
      ref={ref}
      data-dropzone="remove-zone"
      aria-hidden={!isDragging}
      className={cn(
        "pointer-events-none fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-lg transition-all",
        isDragging ? "pointer-events-auto opacity-100" : "translate-y-2 opacity-0",
        isDropTarget
          ? "scale-105 border-destructive bg-destructive text-white"
          : "border-border bg-card/95 text-muted-foreground backdrop-blur"
      )}
    >
      <Trash2 className="size-4" />
      {isDropTarget ? "Release to delete" : "Drop to delete"}
    </div>
  );
}
