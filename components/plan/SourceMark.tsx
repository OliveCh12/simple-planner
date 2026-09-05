"use client";

import { Cloud, HardDrive, Lock } from "lucide-react";
import { providerInfo } from "@/lib/sync/providers";
import { cn } from "@/lib/utils";
import type { CalendarSource } from "@/types";

const ICONS = {
  local: HardDrive,
  google: Cloud,
  icloud: Cloud,
  caldav: Cloud,
} as const;

export function SourceMark({
  source,
  className,
}: {
  source?: CalendarSource;
  className?: string;
}) {
  const info = providerInfo(source?.provider);
  const Icon = source?.access === "readonly" ? Lock : ICONS[info.id];
  if (info.id === "local" && source?.access !== "readonly") return null;
  return (
    <span
      title={source?.access === "readonly" ? `${info.short} · read-only` : info.short}
      className={cn("inline-flex text-muted-foreground", className)}
    >
      <Icon className="size-3" />
      <span className="sr-only">{info.label}</span>
    </span>
  );
}
