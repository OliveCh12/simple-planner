"use client";

import { cn } from "@/lib/utils";

interface ProgressDonutProps {
  done: number;
  total: number;
  className?: string;
}

export function ProgressDonut({ done, total, className }: ProgressDonutProps) {
  const size = 36;
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total === 0 ? 0 : Math.min(1, done / total);
  const offset = circumference * (1 - progress);

  return (
    <span className={cn("relative inline-flex size-9 shrink-0 items-center justify-center", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-foreground"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-[10px] font-medium tabular-nums leading-none">
        {done}/{total}
      </span>
      <span className="sr-only">
        {done} of {total} done
      </span>
    </span>
  );
}
