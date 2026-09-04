"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PropertyChipProps extends React.ComponentProps<typeof Button> {
  tone?: "plain" | "status";
}

export function PropertyChip({ className, tone = "plain", ...props }: PropertyChipProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      className={cn(
        "h-8 max-w-full gap-1 px-2 font-medium whitespace-normal text-foreground/80 hover:bg-accent hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground sm:h-6 sm:px-1.5 sm:whitespace-nowrap",
        tone === "status" && "bg-secondary/70 hover:bg-secondary",
        className
      )}
      {...props}
    />
  );
}
