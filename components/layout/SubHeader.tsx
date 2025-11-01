"use client";

import React from "react";
import {
  ArrowLeft,
  FlipHorizontal,
  Calendar,
  Target,
  Clock,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { format, endOfYear, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

import { containerClasses } from "@/lib/utils";

interface SubHeaderProps {
  // Navigation
  backUrl?: string;
  onBack?: () => void;

  // Content
  title: string;
  subtitle?: string;
  breadcrumb?: string;

  // Actions (optionnel)
  showActionButton?: boolean;
  actionButtonLabel?: string;
  actionButtonIcon?: React.ReactNode;
  onActionClick?: () => void;
  actionButtonDisabled?: boolean;

  // Multiple actions (new)
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?:
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link";
    size?: "default" | "sm" | "lg" | "icon";
    disabled?: boolean;
    className?: string;
  }>;

  // Scroll to current month
  showScrollToCurrentButton?: boolean;
  onScrollToCurrentClick?: () => void;

  // Compact mode toggle
  showCompactToggle?: boolean;
  isCompactMode?: boolean;
  onCompactToggle?: () => void;

  // New stats props
  totalMonths?: number;
  totalObjectives?: number;
  selectedMonth?: string;
  lastUpdated?: string;
  endYear?: number;
}

export function SubHeader({
  backUrl,
  onBack,
  title,
  subtitle,
  breadcrumb,
  showActionButton = false,
  actionButtonLabel,
  actionButtonIcon,
  onActionClick,
  actionButtonDisabled = false,
  actions = [],
  showScrollToCurrentButton = false,
  onScrollToCurrentClick,
  showCompactToggle = false,
  isCompactMode = false,
  onCompactToggle,
  totalMonths,
  totalObjectives,
  selectedMonth,
  lastUpdated,
  endYear,
}: SubHeaderProps) {
  const router = useRouter();

  const now = new Date();
  const daysLeftInRoadmap = endYear
    ? differenceInDays(endOfYear(new Date(endYear, 0, 1)), now)
    : 0;

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      router.push(backUrl);
    }
  };

  return (
    <div className="border-b bg-card/50 backdrop-blur-sm flex-shrink-0">
      <div className={`${containerClasses()} py-4`}>
        <div className="grid grid-cols-1 gap-1 md:gap-2">
          <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
            {(backUrl || onBack) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackClick}
                className="h-7 w-7 md:h-8 md:w-8 hover:bg-muted/50"
              >
                <ArrowLeft className="h-3 w-3 md:h-3.5 md:w-3.5" />
              </Button>
            )}
            <div className="flex-1 min-w-0 space-y-1">
              {breadcrumb && (
                <p className="text-xs text-muted-foreground/80 font-medium">
                  {breadcrumb}
                </p>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <h1 className="text-lg font-bold text-foreground truncate">
                  {title}
                </h1>
                <Badge
                  variant="outline"
                  className="text-xs w-fit border-muted-foreground/20"
                >
                  {format(new Date(), "MMM d, yyyy")}
                </Badge>
              </div>
              {subtitle && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-1.5 md:gap-2">
            {showCompactToggle && onCompactToggle && (
              <Button
                variant="outline"
                size="icon"
                onClick={onCompactToggle}
                title={
                  isCompactMode ? "Expand objectives" : "Compact objectives"
                }
                className="h-7 w-7 md:h-8 md:w-8 hover:bg-muted/50"
              >
                {isCompactMode ? (
                  <Maximize2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
                ) : (
                  <Minimize2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
                )}
              </Button>
            )}
            {showScrollToCurrentButton && onScrollToCurrentClick && (
              <Button
                variant="outline"
                size="icon"
                onClick={onScrollToCurrentClick}
                title="Scroll to current month"
                className="h-7 w-7 md:h-8 md:w-8 hover:bg-muted/50"
              >
                <FlipHorizontal className="h-3 w-3 md:h-3.5 md:w-3.5" />
              </Button>
            )}

            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "default"}
                size={action.size === "icon" ? "icon" : "sm"}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`${action.className} h-7 md:h-8`}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}

            {showActionButton && onActionClick && (
              <Button
                onClick={onActionClick}
                disabled={actionButtonDisabled}
                size="sm"
                className="h-7 md:h-8 px-3 font-medium"
              >
                {actionButtonIcon}
                {actionButtonLabel}
              </Button>
            )}
          </div>

          {/* Stats Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 pt-4 border-t border-border/50">
            {/* Desktop Stats */}
            <div className="hidden md:flex items-center justify-between flex-1">
              {/* Left */}
              <div className="flex items-center gap-4">
                {totalMonths !== undefined && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 text-primary/60" />
                    <span className="font-medium">{totalMonths} months</span>
                  </div>
                )}

                {totalObjectives !== undefined && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Target className="h-3 w-3 text-primary/60" />
                    <span className="font-medium">
                      {totalObjectives} objectives
                    </span>
                  </div>
                )}
              </div>
              {/* Middle */}
              <div className="flex items-center">
                {selectedMonth && (
                  <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                    <span>{selectedMonth}</span>
                  </div>
                )}
              </div>
              {/* Right */}
              <div className="flex items-center gap-4">
                {endYear && daysLeftInRoadmap > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 text-primary/60" />

                    <span>
                      {daysLeftInRoadmap} days left until {endYear}
                    </span>
                  </div>
                )}
                {lastUpdated && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 text-primary/60" />
                    <span>{new Date(lastUpdated).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Mobile Stats */}
            <div className="flex md:hidden items-center justify-between">
              {/* Left */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {totalMonths !== undefined && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary/60" />
                    <span className="font-medium">{totalMonths}</span>
                  </div>
                )}
                {totalObjectives !== undefined && (
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-primary/60" />
                    <span className="font-medium">{totalObjectives}</span>
                  </div>
                )}
              </div>
              {/* Middle */}
              <div className="flex items-center text-xs">
                {selectedMonth && (
                  <span className="text-primary font-medium truncate max-w-20">
                    {selectedMonth}
                  </span>
                )}
              </div>
              {/* Right */}
              <div className="flex items-center text-xs">
                {lastUpdated && (
                  <span className="text-muted-foreground">
                    {new Date(lastUpdated).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
