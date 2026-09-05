import { cn } from "@/lib/utils";

interface CalendarDotProps {
  color?: string;
  className?: string;
}

/** The small color mark that identifies a calendar across the app. */
export function CalendarDot({ color, className }: CalendarDotProps) {
  return (
    <span
      aria-hidden
      className={cn("size-2.5 shrink-0 rounded-full", !color && "bg-primary", className)}
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}
