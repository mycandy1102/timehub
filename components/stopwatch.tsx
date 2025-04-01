"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatMilliseconds } from "@/lib/time-utils"

interface StopwatchProps {
  isDarkMode?: boolean
  zoomLevel?: number
}

interface Lap {
  id: number
  time: number
  total: number
}

export function Stopwatch({ isDarkMode = false, zoomLevel = 1 }: StopwatchProps) {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [laps, setLaps] = useState<Lap[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const lapStartTimeRef = useRef<number>(0)

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - time
      intervalRef.current = setInterval(() => {
        setTime(Date.now() - startTimeRef.current)
      }, 10)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  // 根據縮放級別計算字體大小，但限制最大縮放
  const getDigitFontSize = () => {
    // 限制最大縮放級別為 1.3 (第二級)
    const limitedZoom = Math.min(zoomLevel, 1.3)

    // 基礎大小為 5xl (48px)
    if (limitedZoom <= 1) {
      return "text-5xl"
    } else {
      return "text-6xl" // 60px (最大)
    }
  }

  const startStopwatch = () => {
    if (!isRunning) {
      if (time === 0) {
        lapStartTimeRef.current = Date.now()
      }
      setIsRunning(true)
    } else {
      setIsRunning(false)
    }
  }

  const resetStopwatch = () => {
    setIsRunning(false)
    setTime(0)
    setLaps([])
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const addLap = () => {
    if (!isRunning) return

    const now = Date.now()
    const lapTime = now - lapStartTimeRef.current
    lapStartTimeRef.current = now

    const newLap: Lap = {
      id: laps.length + 1,
      time: lapTime,
      total: time,
    }

    setLaps([newLap, ...laps])
  }

  // Format time parts separately for styling
  const minutes = Math.floor(time / 60000)
    .toString()
    .padStart(2, "0")
  const seconds = Math.floor((time % 60000) / 1000)
    .toString()
    .padStart(2, "0")
  const milliseconds = Math.floor((time % 1000) / 10)
    .toString()
    .padStart(2, "0")

  const digitFontSize = getDigitFontSize()

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-vclock-muted rounded-lg p-6 shadow-lg">
        <div className="text-center mb-6">
          <div className="mb-8">
            <div
              className={`${digitFontSize} font-mono tracking-wider flex items-center justify-center text-primary dark:text-vclock-orange`}
            >
              <span className="inline-block transform transition-transform hover:scale-105">{minutes}</span>
              <span className="mx-1">:</span>
              <span className="inline-block transform transition-transform hover:scale-105">{seconds}</span>
              <span className="mx-1">.</span>
              <span className="inline-block transform transition-transform hover:scale-105">{milliseconds}</span>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button
              onClick={startStopwatch}
              className="bg-primary hover:bg-primary/90 dark:bg-vclock-button dark:hover:bg-vclock-buttonHover text-white border-none"
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={resetStopwatch}
              disabled={time === 0}
              className="border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-vclock-muted dark:text-vclock-amber dark:hover:bg-vclock-muted/20"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              variant="secondary"
              onClick={addLap}
              disabled={!isRunning}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-vclock-muted/20 dark:text-vclock-amber dark:hover:bg-vclock-muted/40 border-none"
            >
              <Flag className="h-4 w-4 mr-2" />
              Lap
            </Button>
          </div>
        </div>

        {laps.length > 0 && (
          <div>
            <h3 className="font-medium mb-3 text-gray-700 dark:text-vclock-amber">Laps</h3>
            <ScrollArea className="h-[150px] border border-gray-200 dark:border-vclock-muted/30 rounded-md">
              <div className="space-y-1 p-2">
                {laps.map((lap) => (
                  <div
                    key={lap.id}
                    className="flex justify-between p-2 border-b border-gray-200 dark:border-vclock-muted/20 text-sm"
                  >
                    <div className="text-gray-700 dark:text-vclock-amber">Lap {lap.id}</div>
                    <div className="font-mono text-primary dark:text-vclock-orange">{formatMilliseconds(lap.time)}</div>
                    <div className="font-mono text-gray-500 dark:text-vclock-muted">
                      {formatMilliseconds(lap.total)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}

// Add default export that re-exports the named export
export default Stopwatch

