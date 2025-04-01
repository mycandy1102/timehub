"use client"

import { useState, useEffect } from "react"
import { Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MiniClockProps {
  onMaximize: () => void
}

export function MiniClock({ onMaximize }: MiniClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [use12HourFormat, setUse12HourFormat] = useState(true)
  const [clockColor, setClockColor] = useState("default")

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Load settings from localStorage
    const savedSettings = localStorage.getItem("clockSettings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setUse12HourFormat(settings.use12HourFormat ?? true)
      setClockColor(settings.clockColor ?? "default")
    }

    // Listen for settings changes
    const handleSettingsChange = (e: CustomEvent) => {
      const { setting, value } = e.detail
      if (setting === "use12HourFormat") setUse12HourFormat(value)
      if (setting === "clockColor") setClockColor(value)
    }

    window.addEventListener("clockSettingsChanged", handleSettingsChange as EventListener)

    return () => {
      clearInterval(timer)
      window.removeEventListener("clockSettingsChanged", handleSettingsChange as EventListener)
    }
  }, [])

  // Get color class based on selected color
  const getColorClass = () => {
    switch (clockColor) {
      case "blue":
        return "text-blue-500"
      case "green":
        return "text-green-500"
      case "purple":
        return "text-purple-500"
      case "red":
        return "text-red-500"
      default:
        return "text-black dark:text-white"
    }
  }

  // Format time
  let hours = currentTime.getHours()
  let ampm = ""

  if (use12HourFormat) {
    ampm = hours >= 12 ? " PM" : " AM"
    hours = hours % 12
    hours = hours ? hours : 12 // Convert 0 to 12 for 12-hour format
  }

  const hoursStr = hours.toString().padStart(2, "0")
  const minutes = currentTime.getMinutes().toString().padStart(2, "0")

  const timeString = `${hoursStr}:${minutes}${ampm}`

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-3 shadow-lg flex items-center">
        <div className={`text-xl font-digital ${getColorClass()}`}>{timeString}</div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onMaximize}
          className="ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

