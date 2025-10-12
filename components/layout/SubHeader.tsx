"use client"

import React, { useEffect, useState } from "react"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname, useParams } from "next/navigation"
import { useRoadmap } from "@/hooks/useRoadmap"
import { useRoadmapStore } from "@/store/roadmapStore"
import { useUIStore } from "@/store/uiStore"
import { getCurrentMonthKey } from "@/lib/date-utils"

export function SubHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  
  // Determine which page we're on
  const isHomePage = pathname === '/'
  const isRoadmapPage = pathname?.startsWith('/roadmap/') && !pathname?.includes('/objective/')
  const isObjectivePage = pathname?.includes('/objective/')
  
  // Get roadmap data if we're on a roadmap-related page
  const roadmapId = params?.roadmapId as string | undefined
  const { roadmap } = useRoadmap(roadmapId || '')
  const { selectedMonthKey } = useRoadmapStore()
  const { openCreateObjectiveModal } = useUIStore()
  const [objectiveTitle, setObjectiveTitle] = useState<string>('')
  
  // Get objective data if we're on an objective page
  useEffect(() => {
    if (isObjectivePage && roadmap && params?.id) {
      const objectiveId = params.id as string
      for (const month of Object.values(roadmap.months)) {
        const found = month.objectives.find(obj => obj.id === objectiveId)
        if (found) {
          setObjectiveTitle(found.title)
          break
        }
      }
    }
  }, [isObjectivePage, roadmap, params?.id])
  
  // Don't show SubHeader on home page
  if (isHomePage) {
    return null
  }
  
  // Render for Roadmap page
  if (isRoadmapPage && roadmap) {
    return (
      <div className="border-b bg-card flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{roadmap.title}</h1>
                {roadmap.description && (
                  <p className="text-sm text-muted-foreground">
                    {roadmap.description}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={() => openCreateObjectiveModal()}
              disabled={!selectedMonthKey}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Objective
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  // Render for Objective page
  if (isObjectivePage && roadmap) {
    return (
      <div className="border-b bg-card flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/roadmap/${roadmapId}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-xs text-muted-foreground">{roadmap.title}</p>
                <h1 className="text-xl font-bold">
                  {objectiveTitle || 'Loading...'}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Default fallback (shouldn't reach here but just in case)
  return null
}