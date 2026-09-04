"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/uiStore";

export function Toast() {
  const toast = useUIStore((s) => s.toast);
  const clearToast = useUIStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => clearToast(), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div
      role="status"
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md border px-4 py-2 text-sm shadow-lg ${
        toast.variant === "error"
          ? "border-destructive/40 bg-destructive text-destructive-foreground"
          : "border-border bg-card text-foreground"
      }`}
    >
      {toast.message}
    </div>
  );
}
