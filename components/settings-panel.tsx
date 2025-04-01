"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

// 可選的時鐘顏色
const clockColors = [
  { value: "default", label: "Default", class: "bg-black dark:bg-vclock-orange" },
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "red", label: "Red", class: "bg-red-500" },
]

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [use12HourFormat, setUse12HourFormat] = useState(true)
  const [showDate, setShowDate] = useState(true)
  const [clockColor, setClockColor] = useState("default")

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("clockSettings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setUse12HourFormat(settings.use12HourFormat ?? true)
      setShowDate(settings.showDate ?? true)
      setClockColor(settings.clockColor ?? "default")
    }
  }, [isOpen])

  const handleSettingChange = (setting: string, value: any) => {
    // Update local state
    if (setting === "use12HourFormat") setUse12HourFormat(value)
    if (setting === "showDate") setShowDate(value)
    if (setting === "clockColor") setClockColor(value)

    // Save to localStorage
    const savedSettings = localStorage.getItem("clockSettings")
    const settings = savedSettings ? JSON.parse(savedSettings) : {}
    settings[setting] = value
    localStorage.setItem("clockSettings", JSON.stringify(settings))

    // Dispatch a custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("clockSettingsChanged", {
        detail: { setting, value },
      }),
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-vclock-muted rounded-lg p-6 shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary dark:text-vclock-orange">Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Clock Color</h3>
            <RadioGroup
              value={clockColor}
              onValueChange={(value) => handleSettingChange("clockColor", value)}
              className="grid grid-cols-5 gap-2"
            >
              {clockColors.map((color) => (
                <div key={color.value} className="flex flex-col items-center space-y-2">
                  <RadioGroupItem value={color.value} id={`color-${color.value}`} className="sr-only" />
                  <Label
                    htmlFor={`color-${color.value}`}
                    className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
                      clockColor === color.value ? "border-primary dark:border-vclock-orange" : "border-transparent"
                    } hover:opacity-90 transition-all ${color.class}`}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{color.label}</span>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-lg text-gray-700 dark:text-gray-300">12-Hour Format (AM/PM)</label>
            <Switch
              checked={use12HourFormat}
              onCheckedChange={(checked) => handleSettingChange("use12HourFormat", checked)}
              className="data-[state=checked]:bg-primary dark:data-[state=checked]:bg-vclock-button"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-lg text-gray-700 dark:text-gray-300">Show Date</label>
            <Switch
              checked={showDate}
              onCheckedChange={(checked) => handleSettingChange("showDate", checked)}
              className="data-[state=checked]:bg-primary dark:data-[state=checked]:bg-vclock-button"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-primary hover:bg-primary/90 dark:bg-vclock-button dark:hover:bg-vclock-buttonHover text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

