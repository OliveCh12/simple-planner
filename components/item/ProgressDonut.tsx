"use client";

import { cn } from "@/lib/utils";

interface ProgressDonutProps {
  done: number;
  total: number;
  /** Outer diameter in px. */
  size?: number;
  stroke?: number;
  /** Print `done/total` inside the ring. Only readable from ~32px up. */
  label?: boolean;
  /** Ring color; defaults to the foreground. */
  color?: string;
  className?: string;
}

export function ProgressDonut({
  done,
  total,
  size = 36,
  stroke = 3.5,
  label = true,
  color,
  className,
}: ProgressDonutProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total === 0 ? 0 : Math.min(1, done / total);
  const offset = circumference * (1 - progress);

  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-foreground/12"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={cn("transition-[stroke-dashoffset] duration-500", !color && "stroke-foreground")}
          style={color ? { stroke: color } : undefined}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {label && (
        <span className="absolute text-[10px] font-medium tabular-nums leading-none">
          {done}/{total}
        </span>
      )}
      <span className="sr-only">
        {done} of {total} done
      </span>
    </span>
  );
}
