"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, containerClasses } from "@/lib/utils";

interface SubHeaderProps {
  backUrl?: string;
  title: string;
  subtitle?: string;
  /** Right-aligned actions. */
  children?: React.ReactNode;
}

export function SubHeader({ backUrl, title, subtitle, children }: SubHeaderProps) {
  return (
    <div className="shrink-0 border-b bg-background/80 backdrop-blur-md">
      <div className={cn(containerClasses(), "flex h-12 items-center gap-3")}>
        {backUrl && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="-ml-2 shrink-0" asChild>
                <Link href={backUrl} aria-label="Back">
                  <ArrowLeft />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back</TooltipContent>
          </Tooltip>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}
