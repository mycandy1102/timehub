"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { formatTime } from "@/lib/time-utils"

interface Alarm {
  id: string
  time: string
  enabled: boolean
  label?: string
  triggered?: boolean // 用於標記鬧鐘是否已觸發過
}

interface ClockWithAlarmProps {
  zoomLevel?: number
}

export function ClockWithAlarm({ zoomLevel = 1 }: ClockWithAlarmProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [blinkColon, setBlinkColon] = useState(true)
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [newAlarmTime, setNewAlarmTime] = useState("")
  const [alarmSound, setAlarmSound] = useState<{ stop: () => void } | null>(null)
  const [activeAlarm, setActiveAlarm] = useState<string | null>(null)
  const [soundPlaying, setSoundPlaying] = useState(false)
  const [use12HourFormat, setUse12HourFormat] = useState(true)
  const [showDate, setShowDate] = useState(true)
  const [clockColor, setClockColor] = useState("default")
  const soundIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastDateRef = useRef<string>("")
  const triggeredMinuteRef = useRef<string>("")

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)
      setBlinkColon((prev) => !prev)

      // 檢查日期是否變更（午夜過後），如果是，重置所有鬧鐘的 triggered 狀態
      const currentDate = now.toDateString()
      if (lastDateRef.current && lastDateRef.current !== currentDate) {
        setAlarms((prevAlarms) => prevAlarms.map((alarm) => ({ ...alarm, triggered: false })))
      }
      lastDateRef.current = currentDate
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Load alarms from localStorage
    const savedAlarms = localStorage.getItem("alarms")
    if (savedAlarms) {
      setAlarms(JSON.parse(savedAlarms))
    }

    // Load settings from localStorage
    const savedSettings = localStorage.getItem("clockSettings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setUse12HourFormat(settings.use12HourFormat ?? true)
      setShowDate(settings.showDate ?? true)
      setClockColor(settings.clockColor ?? "default")
    }

    // Listen for settings changes
    const handleSettingsChange = (e: CustomEvent) => {
      const { setting, value } = e.detail
      if (setting === "use12HourFormat") setUse12HourFormat(value)
      if (setting === "showDate") setShowDate(value)
      if (setting === "clockColor") setClockColor(value)
    }

    window.addEventListener("clockSettingsChanged", handleSettingsChange as EventListener)

    return () => {
      if (alarmSound) {
        alarmSound.stop()
      }
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current)
      }
      window.removeEventListener("clockSettingsChanged", handleSettingsChange as EventListener)
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()

      // 檢查是否有鬧鐘應該觸發
      if (!soundPlaying && !activeAlarm) {
        const currentTimeString = formatTime(now)
        const currentMinuteString = `${now.getHours()}:${now.getMinutes()}`

        // 只有當分鐘變化時才檢查鬧鐘
        if (currentMinuteString !== triggeredMinuteRef.current) {
          alarms.forEach((alarm) => {
            // 只有在鬧鐘啟用、時間匹配、且今天尚未觸發過的情況下才觸發鬧鐘
            if (alarm.enabled && alarm.time === currentTimeString && !alarm.triggered) {
              triggerAlarm(alarm.id)
              // 更新當前分鐘
              triggeredMinuteRef.current = currentMinuteString
            }
          })
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [alarms, activeAlarm, soundPlaying])

  useEffect(() => {
    // Save alarms to localStorage when they change
    localStorage.setItem("alarms", JSON.stringify(alarms))
  }, [alarms])

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

  // 根據縮放級別計算字體大小
  const getDigitFontSize = () => {
    // 基礎大小為 7xl (60px)
    const baseSizeClass = "text-7xl"

    if (zoomLevel <= 1) {
      return baseSizeClass
    } else if (zoomLevel <= 1.3) {
      return "text-8xl" // 72px
    } else if (zoomLevel <= 1.6) {
      return "text-9xl" // 96px
    } else {
      return "text-[10rem]" // 160px
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

  // Format date in the style of vClock
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }
  const formattedDate = currentTime
    .toLocaleDateString("en-US", dateOptions)
    .replace(",", "")
    .toUpperCase()
    .replace(/(\d+)(ST|ND|RD|TH)/, "$1")
    .replace(/\s+/g, " - ")

  const addAlarm = () => {
    if (!newAlarmTime) return

    const newAlarm: Alarm = {
      id: Date.now().toString(),
      time: newAlarmTime,
      enabled: true,
      triggered: false,
    }

    setAlarms([...alarms, newAlarm])
    setNewAlarmTime("")
  }

  const toggleAlarm = (id: string) => {
    setAlarms(
      alarms.map((alarm) =>
        alarm.id === id
          ? { ...alarm, enabled: !alarm.enabled, triggered: false } // 重新啟用時重置 triggered 狀態
          : alarm,
      ),
    )
  }

  const deleteAlarm = (id: string) => {
    setAlarms(alarms.filter((alarm) => alarm.id !== id))
  }

  const triggerAlarm = (id: string) => {
    setActiveAlarm(id)
    setSoundPlaying(true)

    // 標記該鬧鐘已被觸發
    setAlarms(alarms.map((alarm) => (alarm.id === id ? { ...alarm, triggered: true } : alarm)))

    // 創建一個單次的聲音模式，不再使用間隔重複播放
    import("@/lib/audio-utils").then(({ playAlarmPattern }) => {
      const sound = playAlarmPattern()
      setAlarmSound(sound)
    })
  }

  const stopAlarm = () => {
    // 確保徹底停止所有聲音
    if (alarmSound) {
      alarmSound.stop()
      setAlarmSound(null)
    }

    // 清除任何可能的間隔計時器
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current)
      soundIntervalRef.current = null
    }

    setActiveAlarm(null)
    setSoundPlaying(false)
  }

  const digitFontSize = getDigitFontSize()

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Clock Display */}
      <div className="flex flex-col items-center justify-center mb-10">
        {activeAlarm && (
          <div className="mb-6 p-6 bg-white dark:bg-black border-2 border-primary dark:border-vclock-orange rounded-lg flex flex-col items-center justify-between w-full max-w-md">
            <div className="flex items-center mb-4">
              <Bell className="h-8 w-8 mr-3 animate-bounce text-primary dark:text-vclock-orange" />
              <span className="text-2xl font-bold text-primary dark:text-vclock-orange">Alarm!</span>
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90 dark:bg-vclock-button dark:hover:bg-vclock-buttonHover text-white border-none"
              onClick={stopAlarm}
            >
              Stop Alarm
            </Button>
          </div>
        )}

        {/* Digital Clock Display - Updated with zoom level */}
        <div className="flex items-center justify-center mb-6">
          {/* Hours */}
          <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-lg mx-1">
            <div className={`${digitFontSize} font-digital tracking-wider ${getColorClass()}`}>{hoursStr}</div>
            <div className="absolute inset-0 pointer-events-none blur-sm opacity-30 dark:opacity-40 flex items-center justify-center">
              <div className={`${digitFontSize} font-digital tracking-wider ${getColorClass()}`}>{hoursStr}</div>
            </div>
          </div>

          {/* Colon */}
          <div
            className={`text-5xl md:text-6xl font-bold mx-1 text-gray-500 dark:text-gray-400 flex flex-col ${blinkColon ? "opacity-100" : "opacity-30"} transition-opacity duration-100`}
          >
            <span className="mb-2">•</span>
            <span>•</span>
          </div>

          {/* Minutes */}
          <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-lg mx-1">
            <div className={`${digitFontSize} font-digital tracking-wider ${getColorClass()}`}>{minutes}</div>
            <div className="absolute inset-0 pointer-events-none blur-sm opacity-30 dark:opacity-40 flex items-center justify-center">
              <div className={`${digitFontSize} font-digital tracking-wider ${getColorClass()}`}>{minutes}</div>
            </div>
          </div>

          {/* Colon */}
          <div
            className={`text-5xl md:text-6xl font-bold mx-1 text-gray-500 dark:text-gray-400 flex flex-col ${blinkColon ? "opacity-100" : "opacity-30"} transition-opacity duration-100`}
          >
            <span className="mb-2">•</span>
            <span>•</span>
          </div>

          {/* Seconds */}
          <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-lg mx-1">
            <div className={`${digitFontSize} font-digital tracking-wider ${getColorClass()}`}>{seconds}</div>
            <div className="absolute inset-0 pointer-events-none blur-sm opacity-30 dark:opacity-40 flex items-center justify-center">
              <div className={`${digitFontSize} font-digital tracking-wider ${getColorClass()}`}>{seconds}</div>
            </div>
          </div>

          {/* AM/PM */}
          {use12HourFormat && (
            <div className="ml-4 text-3xl md:text-4xl font-bold text-gray-600 dark:text-gray-300 self-center">
              {ampm}
            </div>
          )}
        </div>

        {/* Date Display */}
        {showDate && (
          <div className="text-xl md:text-2xl font-digital tracking-wider text-gray-600 dark:text-gray-300 mb-8">
            {formattedDate}
          </div>
        )}
      </div>

      {/* Alarm Section */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-vclock-muted rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-primary dark:text-vclock-orange">Set Alarm</h2>

        <div className="flex gap-3 mb-8">
          <Input
            type="time"
            value={newAlarmTime}
            onChange={(e) => setNewAlarmTime(e.target.value)}
            className="flex-1 bg-white dark:bg-black border-gray-200 dark:border-vclock-muted text-gray-800 dark:text-vclock-orange focus:border-primary dark:focus:border-vclock-orange"
          />
          <Button
            onClick={addAlarm}
            className="bg-primary hover:bg-primary/90 dark:bg-vclock-button dark:hover:bg-vclock-buttonHover text-white border-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary/80 dark:text-vclock-amber mb-2">Alarms</h3>

          {alarms.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-vclock-muted py-4">No alarms set</p>
          ) : (
            alarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`flex items-center justify-between p-4 border border-gray-200 dark:border-vclock-muted rounded-lg bg-white dark:bg-black/50 ${alarm.triggered && alarm.enabled ? "border-primary dark:border-vclock-orange" : ""}`}
              >
                <div className="font-mono text-xl text-primary dark:text-vclock-orange">
                  {alarm.time}
                  {alarm.triggered && alarm.enabled && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-vclock-muted">(Triggered today)</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={alarm.enabled}
                    onCheckedChange={() => toggleAlarm(alarm.id)}
                    className="data-[state=checked]:bg-primary dark:data-[state=checked]:bg-vclock-button"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAlarm(alarm.id)}
                    className="hover:bg-gray-100 dark:hover:bg-vclock-muted/20 text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

