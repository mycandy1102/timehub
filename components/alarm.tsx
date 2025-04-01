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
}

export function Alarm() {
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [newAlarmTime, setNewAlarmTime] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [alarmSound, setAlarmSound] = useState<{ stop: () => void } | null>(null)
  const [activeAlarm, setActiveAlarm] = useState<string | null>(null)
  const [soundPlaying, setSoundPlaying] = useState(false)
  const soundIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const triggeredAlarmsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Load alarms from localStorage
    const savedAlarms = localStorage.getItem("alarms")
    if (savedAlarms) {
      setAlarms(JSON.parse(savedAlarms))
    }

    return () => {
      if (alarmSound) {
        alarmSound.stop()
      }
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)

      // Check if any alarms should trigger
      if (!soundPlaying) {
        const currentTimeString = formatTime(now)
        alarms.forEach((alarm) => {
          // Only trigger if alarm is enabled, time matches, and it hasn't been triggered yet in this minute
          if (
            alarm.enabled &&
            alarm.time === currentTimeString &&
            !triggeredAlarmsRef.current.has(alarm.id) &&
            !activeAlarm
          ) {
            triggerAlarm(alarm.id)
            // Add to triggered alarms
            triggeredAlarmsRef.current.add(alarm.id)
          }
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [alarms, activeAlarm, soundPlaying])

  // Reset triggered alarms when the minute changes
  useEffect(() => {
    const resetTriggeredAlarms = () => {
      const now = new Date()
      // Only reset when the minute changes
      if (now.getSeconds() === 0) {
        triggeredAlarmsRef.current.clear()
      }
    }

    const timer = setInterval(resetTriggeredAlarms, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Save alarms to localStorage when they change
    localStorage.setItem("alarms", JSON.stringify(alarms))
  }, [alarms])

  const addAlarm = () => {
    if (!newAlarmTime) return

    const newAlarm: Alarm = {
      id: Date.now().toString(),
      time: newAlarmTime,
      enabled: true,
    }

    setAlarms([...alarms, newAlarm])
    setNewAlarmTime("")
  }

  const toggleAlarm = (id: string) => {
    setAlarms(alarms.map((alarm) => (alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm)))
  }

  const deleteAlarm = (id: string) => {
    setAlarms(alarms.filter((alarm) => alarm.id !== id))
  }

  const triggerAlarm = (id: string) => {
    setActiveAlarm(id)
    setSoundPlaying(true)

    // Create a repeating sound pattern that continues until stopped
    import("@/lib/audio-utils").then(({ playAlarmPattern }) => {
      const sound = playAlarmPattern()
      setAlarmSound(sound)
    })
  }

  const stopAlarm = () => {
    if (alarmSound) {
      alarmSound.stop()
      setAlarmSound(null)
    }
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current)
      soundIntervalRef.current = null
    }
    setActiveAlarm(null)
    setSoundPlaying(false)

    // Keep the current alarm in the triggered list to prevent it from firing again
    // until the next minute
    if (activeAlarm) {
      triggeredAlarmsRef.current.add(activeAlarm)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {activeAlarm && (
        <div className="mb-6 p-6 bg-black border-2 border-vclock-orange rounded-lg flex flex-col items-center justify-between">
          <div className="flex items-center mb-4">
            <Bell className="h-8 w-8 mr-3 animate-bounce text-vclock-orange" />
            <span className="text-2xl font-bold text-vclock-orange">Alarm!</span>
          </div>
          <Button
            className="w-full bg-vclock-button hover:bg-vclock-buttonHover text-white border-none"
            onClick={stopAlarm}
          >
            Stop Alarm
          </Button>
        </div>
      )}

      <div className="bg-black border border-vclock-muted rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-vclock-orange">Set Alarm</h2>

        <div className="flex gap-3 mb-8">
          <Input
            type="time"
            value={newAlarmTime}
            onChange={(e) => setNewAlarmTime(e.target.value)}
            className="flex-1 bg-black border-vclock-muted text-vclock-orange focus:border-vclock-orange focus:ring-vclock-orange"
          />
          <Button onClick={addAlarm} className="bg-vclock-button hover:bg-vclock-buttonHover text-white border-none">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-vclock-amber mb-2">Alarms</h3>

          {alarms.length === 0 ? (
            <p className="text-center text-vclock-muted py-4">No alarms set</p>
          ) : (
            alarms.map((alarm) => (
              <div
                key={alarm.id}
                className="flex items-center justify-between p-4 border border-vclock-muted rounded-lg bg-black/50"
              >
                <div className="font-mono text-xl text-vclock-orange">{alarm.time}</div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={alarm.enabled}
                    onCheckedChange={() => toggleAlarm(alarm.id)}
                    className="data-[state=checked]:bg-vclock-button"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAlarm(alarm.id)}
                    className="hover:bg-vclock-muted/20 text-red-500"
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

