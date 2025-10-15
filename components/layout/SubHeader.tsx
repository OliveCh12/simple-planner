"use client"

import React from "react"
import { ArrowLeft, FlipHorizontal } from "lucide-react"
import { format, endOfYear, differenceInDays, startOfYear } from "date-fns"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

import { containerClasses } from "@/lib/utils"

interface SubHeaderProps {
  // Navigation
  backUrl?: string
  onBack?: () => void
  
  // Content
  title: string
  subtitle?: string
  breadcrumb?: string
  
  // Actions (optionnel)
  showActionButton?: boolean
  actionButtonLabel?: string
  actionButtonIcon?: React.ReactNode
  onActionClick?: () => void
  actionButtonDisabled?: boolean

  // Multiple actions (new)
  actions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: () => void
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    disabled?: boolean
    className?: string
  }>

  // Scroll to current month
  showScrollToCurrentButton?: boolean
  onScrollToCurrentClick?: () => void
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
}: SubHeaderProps) {
  const router = useRouter()

  const now = new Date()
  const startOfYearDate = startOfYear(now)
  const endOfYearDate = endOfYear(now)
  const totalDaysInYear = differenceInDays(endOfYearDate, startOfYearDate)
  const daysPassed = differenceInDays(now, startOfYearDate)
  const yearProgress = (daysPassed / totalDaysInYear) * 100
  const daysLeft = differenceInDays(endOfYearDate, now)

  const handleBackClick = () => {
    if (onBack) {
      onBack()
    } else if (backUrl) {
      router.push(backUrl)
    }
  }

  return (
    <div className="border-b bg-card flex-shrink-0">
      <div className={`${containerClasses()} py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {(backUrl || onBack) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackClick}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              {breadcrumb && (
                <p className="text-xs text-muted-foreground">{breadcrumb}</p>
              )}
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold">{title}</h1>
                <Badge variant="outline" className="text-xs">
                  {format(new Date(), 'MMM d, yyyy')}
                </Badge>
              </div>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">
                  {subtitle}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex-1 max-w-xs">
                  <Progress value={yearProgress} className="h-2" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {daysLeft} days left in {now.getFullYear()}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showScrollToCurrentButton && onScrollToCurrentClick && (
              <Button
                variant="outline"
                size="icon"
                onClick={onScrollToCurrentClick}
                title="Scroll to current month"
              >
                <FlipHorizontal className="h-4 w-4" />
              </Button>
            )}
            
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "default"}
                size={action.size || "default"}
                onClick={action.onClick}
                disabled={action.disabled}
                className={action.className}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
            
            {showActionButton && onActionClick && (
              <Button
                onClick={onActionClick}
                disabled={actionButtonDisabled}
              >
                {actionButtonIcon}
                {actionButtonLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}