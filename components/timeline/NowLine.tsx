"use client";

interface NowLineProps {
  x: number;
  totalWidth: number;
}

export function NowLine({ x, totalWidth }: NowLineProps) {
  if (x < 0 || x > totalWidth) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 z-20 w-px bg-now"
      style={{ left: x }}
    />
  );
}
