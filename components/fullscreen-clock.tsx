"use client"

import { useState, useEffect } from "react"
import { Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FullscreenClockProps {
  onMinimize: () => void
}

export function FullscreenClock({ onMinimize }: FullscreenClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [blinkColon, setBlinkColon] = useState(true)
  const [use12HourFormat, setUse12HourFormat] = useState(true)
  const [clockColor, setClockColor] = useState("default")

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      setBlinkColon((prev) => !prev)
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

  // Format time parts separately for styling
  let hours = currentTime.getHours()
  let ampm = "AM"

  if (use12HourFormat) {
    ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12
    hours = hours ? hours : 12 // Convert 0 to 12 for 12-hour format
  }

  const hoursStr = hours.toString().padStart(2, "0")
  const minutes = currentTime.getMinutes().toString().padStart(2, "0")
  const seconds = currentTime.getSeconds().toString().padStart(2, "0")

  return (
    <div className="fixed inset-0 bg-white dark:bg-black z-50 flex flex-col items-center justify-center">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMinimize}
        className="absolute top-4 right-4 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Minimize2 className="h-6 w-6" />
      </Button>

      <div className="flex items-center justify-center">
        {/* Hours */}
        <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-lg mx-2">
          <div className={`text-9xl md:text-[10rem] font-digital tracking-wider ${getColorClass()}`}>{hoursStr}</div>
          <div className="absolute inset-0 pointer-events-none blur-sm opacity-30 dark:opacity-40 flex items-center justify-center">
            <div className={`text-9xl md:text-[10rem] font-digital tracking-wider ${getColorClass()}`}>{hoursStr}</div>
          </div>
        </div>

        {/* Colon */}
        <div
          className={`text-7xl md:text-8xl font-bold mx-2 text-gray-500 dark:text-gray-400 flex flex-col ${blinkColon ? "opacity-100" : "opacity-30"} transition-opacity duration-100`}
        >
          <span className="mb-3">•</span>
          <span>•</span>
        </div>

        {/* Minutes */}
        <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-lg mx-2">
          <div className={`text-9xl md:text-[10rem] font-digital tracking-wider ${getColorClass()}`}>{minutes}</div>
          <div className="absolute inset-0 pointer-events-none blur-sm opacity-30 dark:opacity-40 flex items-center justify-center">
            <div className={`text-9xl md:text-[10rem] font-digital tracking-wider ${getColorClass()}`}>{minutes}</div>
          </div>
        </div>

        {/* Colon */}
        <div
          className={`text-7xl md:text-8xl font-bold mx-2 text-gray-500 dark:text-gray-400 flex flex-col ${blinkColon ? "opacity-100" : "opacity-30"} transition-opacity duration-100`}
        >
          <span className="mb-3">•</span>
          <span>•</span>
        </div>

        {/* Seconds */}
        <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-lg mx-2">
          <div className={`text-9xl md:text-[10rem] font-digital tracking-wider ${getColorClass()}`}>{seconds}</div>
          <div className="absolute inset-0 pointer-events-none blur-sm opacity-30 dark:opacity-40 flex items-center justify-center">
            <div className={`text-9xl md:text-[10rem] font-digital tracking-wider ${getColorClass()}`}>{seconds}</div>
          </div>
        </div>

        {/* AM/PM */}
        {use12HourFormat && (
          <div className="ml-6 text-5xl md:text-6xl font-bold text-gray-600 dark:text-gray-300 self-center">{ampm}</div>
        )}
      </div>
    </div>
  )
}

