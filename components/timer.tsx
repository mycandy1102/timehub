"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { formatTimeFromSeconds } from "@/lib/time-utils"

interface TimerProps {
  isDarkMode?: boolean
  zoomLevel?: number
}

export function Timer({ isDarkMode = false, zoomLevel = 1 }: TimerProps) {
  const [duration, setDuration] = useState(300) // 5 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [alarmSound, setAlarmSound] = useState<{ stop: () => void } | null>(null)
  const soundIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (alarmSound) {
        alarmSound.stop()
      }
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isRunning) return

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer finished
          clearInterval(intervalRef.current as NodeJS.Timeout)
          setIsRunning(false)
          setIsFinished(true)

          // 播放鬧鐘聲音，但不使用重複模式
          import("@/lib/audio-utils").then(({ playAlarmPattern }) => {
            const sound = playAlarmPattern()
            setAlarmSound(sound)
          })

          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  // 根據縮放級別計算字體大小
  const getDigitFontSize = () => {
    // 基礎大小為 6xl (60px)
    const baseSizeClass = "text-6xl"

    if (zoomLevel <= 1) {
      return baseSizeClass
    } else if (zoomLevel <= 1.3) {
      return "text-7xl" // 72px
    } else if (zoomLevel <= 1.6) {
      return "text-8xl" // 96px
    } else {
      return "text-9xl" // 128px
    }
  }

  const startTimer = () => {
    if (timeLeft === 0) setTimeLeft(duration)
    setIsRunning(true)
    setIsFinished(false)
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRunning(false)
    setTimeLeft(duration)
    setIsFinished(false)
    if (alarmSound) {
      alarmSound.stop()
    }
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current)
      soundIntervalRef.current = null
    }
  }

  const handleDurationChange = (value: number[]) => {
    const newDuration = value[0]
    setDuration(newDuration)
    if (!isRunning) setTimeLeft(newDuration)
  }

  const stopAlarm = () => {
    setIsFinished(false)
    if (alarmSound) {
      alarmSound.stop()
      setAlarmSound(null)
    }
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current)
      soundIntervalRef.current = null
    }
  }

  // Format time parts separately for styling
  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0")
  const seconds = (timeLeft % 60).toString().padStart(2, "0")

  const digitFontSize = getDigitFontSize()

  return (
    <div className="w-full max-w-md mx-auto">
      {isFinished && (
        <div className="mb-6 p-6 bg-white dark:bg-black border-2 border-primary dark:border-vclock-orange rounded-lg flex flex-col items-center justify-between">
          <div className="flex items-center mb-4">
            <Bell className="h-8 w-8 mr-3 animate-bounce text-primary dark:text-vclock-orange" />
            <span className="text-2xl font-bold text-primary dark:text-vclock-orange">Time's up!</span>
          </div>
          <Button
            className="w-full bg-primary hover:bg-primary/90 dark:bg-vclock-button dark:hover:bg-vclock-buttonHover text-white border-none"
            onClick={stopAlarm}
          >
            Stop Alarm
          </Button>
        </div>
      )}

      <div className="bg-white dark:bg-black border border-gray-200 dark:border-vclock-muted rounded-lg p-6 shadow-lg">
        <div className="text-center mb-8">
          <div className="mb-6">
            <div
              className={`${digitFontSize} font-mono tracking-wider flex items-center justify-center text-primary dark:text-vclock-orange`}
            >
              <span className="inline-block transform transition-transform hover:scale-105">{minutes}</span>
              <span className="mx-2">:</span>
              <span className="inline-block transform transition-transform hover:scale-105">{seconds}</span>
            </div>
          </div>

          {!isRunning && !isFinished && (
            <div className="mb-8">
              <p className="text-sm text-gray-600 dark:text-vclock-amber mb-3">Set timer duration</p>
              <Slider
                value={[duration]}
                min={30}
                max={3600}
                step={30}
                onValueChange={handleDurationChange}
                className="mb-2"
              />
              <div className="text-sm text-gray-600 dark:text-vclock-amber">{formatTimeFromSeconds(duration)}</div>
            </div>
          )}

          <div className="flex justify-center gap-4 mt-6">
            {!isRunning ? (
              <Button
                onClick={startTimer}
                disabled={isFinished}
                className="bg-primary hover:bg-primary/90 dark:bg-vclock-button dark:hover:bg-vclock-buttonHover text-white border-none"
              >
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            ) : (
              <Button
                onClick={pauseTimer}
                className="bg-primary hover:bg-primary/90 dark:bg-vclock-button dark:hover:bg-vclock-buttonHover text-white border-none"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            <Button
              variant="outline"
              onClick={resetTimer}
              className="border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-vclock-muted dark:text-vclock-amber dark:hover:bg-vclock-muted/20"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add default export that re-exports the named export
export default Timer

