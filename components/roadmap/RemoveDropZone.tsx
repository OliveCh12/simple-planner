"use client";

import { Trash2 } from "lucide-react";
import { useDroppable } from "@dnd-kit/react";

export function RemoveDropZone({ isDragging }: { isDragging: boolean }) {
  const { ref, isDropTarget } = useDroppable({ id: "remove-zone" });

  return (
    <div
      ref={ref}
      data-dropzone="remove-zone"
      aria-hidden={!isDragging}
      className={`pointer-events-none fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-lg transition-all ${
        isDragging ? "pointer-events-auto opacity-100" : "opacity-0"
      } ${
        isDropTarget
          ? "scale-105 border-destructive bg-destructive text-destructive-foreground"
          : "border-border bg-card/95 text-muted-foreground backdrop-blur"
      }`}
    >
      <Trash2 className="h-4 w-4" />
      {isDropTarget ? "Release to delete" : "Drop to delete"}
    </div>
  );
}
