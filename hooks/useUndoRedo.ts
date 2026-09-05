"use client";

import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useHistoryStore } from "@/store/historyStore";

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/** Undo and redo with a labelled toast, shared by every board. */
export function useUndoRedo() {
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const canUndo = useHistoryStore((s) => s.past.length > 0);
  const canRedo = useHistoryStore((s) => s.future.length > 0);
  const undoLabel = useHistoryStore((s) => s.past[s.past.length - 1]?.label);
  const redoLabel = useHistoryStore((s) => s.future[s.future.length - 1]?.label);

  const runUndo = useCallback(async () => {
    const label = await undo();
    if (label) toast(`Undone: ${label}`, { duration: 1800 });
  }, [undo]);
  const runRedo = useCallback(async () => {
    const label = await redo();
    if (label) toast(`Redone: ${label}`, { duration: 1800 });
  }, [redo]);

  return { runUndo, runRedo, canUndo, canRedo, undoLabel, redoLabel };
}

/** ⌘Z / ⇧⌘Z / Ctrl+Y anywhere outside a text field. */
export function useUndoKeys(runUndo: () => Promise<void>, runRedo: () => Promise<void>): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod || event.altKey || isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === "z") {
        event.preventDefault();
        void (event.shiftKey ? runRedo() : runUndo());
      } else if (key === "y" && event.ctrlKey) {
        event.preventDefault();
        void runRedo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [runRedo, runUndo]);
}
