"use client"

import { Minus, Plus, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ViewControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onFullscreen: () => void
  canZoomOut: boolean
}

export function ViewControls({ onZoomIn, onZoomOut, onFullscreen, canZoomOut }: ViewControlsProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className="rounded-full w-8 h-8 border-gray-300 dark:border-gray-700"
      >
        <Minus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onZoomIn}
        className="rounded-full w-8 h-8 border-gray-300 dark:border-gray-700"
      >
        <Plus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onFullscreen}
        className="rounded-full w-8 h-8 border-gray-300 dark:border-gray-700"
      >
        <Maximize2 className="h-4 w-4 text-gray-700 dark:text-gray-300" />
      </Button>
    </div>
  )
}

