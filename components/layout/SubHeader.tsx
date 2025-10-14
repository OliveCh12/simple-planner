"use client"

import React from "react"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
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
}: SubHeaderProps) {
  const router = useRouter()

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
              <h1 className="text-xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
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
  )
}