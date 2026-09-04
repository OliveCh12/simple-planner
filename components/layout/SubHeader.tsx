"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { containerClasses } from "@/lib/utils";

interface SubHeaderProps {
  backUrl?: string;
  onBack?: () => void;
  title: string;
  subtitle?: string;
  showActionButton?: boolean;
  actionButtonLabel?: string;
  actionButtonIcon?: React.ReactNode;
  onActionClick?: () => void;
  trailing?: React.ReactNode;
}

export function SubHeader({
  backUrl,
  onBack,
  title,
  subtitle,
  showActionButton = false,
  actionButtonLabel,
  actionButtonIcon,
  onActionClick,
  trailing,
}: SubHeaderProps) {
  const router = useRouter();

  const handleBackClick = () => {
    if (onBack) onBack();
    else if (backUrl) router.push(backUrl);
  };

  return (
    <div className="shrink-0 border-b bg-background/80 backdrop-blur-md">
      <div className={`${containerClasses()} flex h-14 items-center gap-3`}>
        {(backUrl || onBack) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            className="h-8 w-8 shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {trailing}
          {showActionButton && onActionClick && (
            <Button onClick={onActionClick} size="sm" className="h-8">
              {actionButtonIcon}
              {actionButtonLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
