"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CircleAlert } from "lucide-react";
import { ITEM_SAVE_EVENT, type ItemSaveDetail } from "@/hooks/useSaveItem";
import { flashHint } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Quiet confirmation after each write to this item; errors stay a little longer. */
export function SaveIndicator({ itemId }: { itemId: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState<"saved" | "error">("saved");

  useEffect(() => {
    let cancel: (() => void) | undefined;
    const onSave = (event: Event) => {
      const detail = (event as CustomEvent<ItemSaveDetail>).detail;
      if (detail.id !== itemId || !ref.current) return;
      setState(detail.ok ? "saved" : "error");
      cancel?.();
      cancel = flashHint(ref.current, detail.ok ? 1100 : 2600);
    };
    window.addEventListener(ITEM_SAVE_EVENT, onSave);
    return () => {
      cancel?.();
      window.removeEventListener(ITEM_SAVE_EVENT, onSave);
    };
  }, [itemId]);

  return (
    <span
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none inline-flex items-center gap-1 text-[11px] opacity-0",
        state === "error" ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {state === "error" ? <CircleAlert className="size-3" /> : <Check className="size-3" />}
      {state === "error" ? "Not saved" : "Saved"}
    </span>
  );
}
