"use client"

import { useState, useRef, useEffect } from "react"
import { Moon, AlarmClockIcon as Alarm, ArrowLeft, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SleepCalculatorProps {
  isDarkMode?: boolean
  zoomLevel?: number
}

export function SleepCalculator({ isDarkMode = false, zoomLevel = 1 }: SleepCalculatorProps) {
  const [view, setView] = useState<"main" | "bedtime" | "wakeup">("main")
  const [selectedHour, setSelectedHour] = useState(7)
  const [selectedMinute, setSelectedMinute] = useState(0)
  const [isPM, setIsPM] = useState(true)
  const [bedtimeResults, setBedtimeResults] = useState<string[]>([])
  const [wakeupResults, setWakeupResults] = useState<string[]>([])
  const hourRef = useRef<HTMLDivElement>(null)
  const minuteRef = useRef<HTMLDivElement>(null)
  const ampmRef = useRef<HTMLDivElement>(null)

  // 初始化時間選擇器
  useEffect(() => {
    const now = new Date()
    setSelectedHour(now.getHours() % 12 || 12)
    setSelectedMinute(Math.floor(now.getMinutes() / 5) * 5)
    setIsPM(now.getHours() >= 12)
  }, [])

  // 設置時間選擇器的滾動事件
  useEffect(() => {
    const hourElement = hourRef.current
    const minuteElement = minuteRef.current
    const ampmElement = ampmRef.current

    const handleHourWheel = (e: WheelEvent) => {
      e.preventDefault()
      const direction = e.deltaY > 0 ? 1 : -1
      setSelectedHour((prev) => {
        let newHour = prev + direction
        if (newHour > 12) newHour = 1
        if (newHour < 1) newHour = 12
        return newHour
      })
    }

    const handleMinuteWheel = (e: WheelEvent) => {
      e.preventDefault()
      const direction = e.deltaY > 0 ? 1 : -1
      setSelectedMinute((prev) => {
        let newMinute = prev + direction
        if (newMinute >= 60) newMinute = 0
        if (newMinute < 0) newMinute = 59
        return newMinute
      })
    }

    const handleAMPMWheel = (e: WheelEvent) => {
      e.preventDefault()
      setIsPM((prev) => !prev)
    }

    if (hourElement) {
      hourElement.addEventListener("wheel", handleHourWheel, { passive: false })
    }
    if (minuteElement) {
      minuteElement.addEventListener("wheel", handleMinuteWheel, { passive: false })
    }
    if (ampmElement) {
      ampmElement.addEventListener("wheel", handleAMPMWheel, { passive: false })
    }

    return () => {
      if (hourElement) {
        hourElement.removeEventListener("wheel", handleHourWheel)
      }
      if (minuteElement) {
        minuteElement.removeEventListener("wheel", handleMinuteWheel)
      }
      if (ampmElement) {
        ampmElement.removeEventListener("wheel", handleAMPMWheel)
      }
    }
  }, [])

  // 增加小時
  const incrementHour = () => {
    setSelectedHour((prev) => {
      let newHour = prev + 1
      if (newHour > 12) newHour = 1
      return newHour
    })
  }

  // 減少小時
  const decrementHour = () => {
    setSelectedHour((prev) => {
      let newHour = prev - 1
      if (newHour < 1) newHour = 12
      return newHour
    })
  }

  // 增加分鐘
  const incrementMinute = () => {
    setSelectedMinute((prev) => {
      let newMinute = prev + 1
      if (newMinute >= 60) newMinute = 0
      return newMinute
    })
  }

  // 減少分鐘
  const decrementMinute = () => {
    setSelectedMinute((prev) => {
      let newMinute = prev - 1
      if (newMinute < 0) newMinute = 59
      return newMinute
    })
  }

  // 切換 AM/PM
  const toggleAMPM = () => {
    setIsPM((prev) => !prev)
  }

  // 將時間轉換為分鐘
  const timeToMinutes = (hour: number, minute: number, isPM: boolean) => {
    // 調整12小時制
    if (isPM && hour !== 12) hour += 12
    if (!isPM && hour === 12) hour = 0

    return hour * 60 + minute
  }

  // 將分鐘轉回時間字符串
  const minutesToTime = (minutes: number) => {
    let hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    let period = "AM"

    // 調整為12小時制
    if (hour >= 12) {
      period = "PM"
      if (hour > 12) hour -= 12
    }
    if (hour === 0) hour = 12

    // 格式化
    return `${hour}:${minute.toString().padStart(2, "0")} ${period}`
  }

  // 計算就寢時間
  const calculateBedtime = () => {
    // 獲取選擇的起床時間（分鐘）
    const wakeMinutes = timeToMinutes(selectedHour, selectedMinute, isPM)

    // 計算第一個建議的就寢時間（往回推 9 小時 = 6 個睡眠週期 + 15 分鐘入睡時間）
    const firstBedtimeMinutes = (wakeMinutes - (6 * 90 + 15) + 1440) % 1440

    // 生成 6 個時間點，每個間隔 90 分鐘
    const bedtimes = []
    for (let i = 0; i < 6; i++) {
      const currentMinutes = (firstBedtimeMinutes + i * 90 + 1440) % 1440
      bedtimes.push(minutesToTime(currentMinutes))
    }

    setBedtimeResults(bedtimes)
    setView("bedtime")
  }

  // 計算起床時間
  const calculateWakeup = () => {
    // 獲取當前時間（分鐘）
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentIsPM = currentHour >= 12
    const bedMinutes = timeToMinutes(currentHour % 12 || 12, currentMinute, currentIsPM)

    // 計算第一個建議的起床時間（往前推 9 小時 = 6 個睡眠週期 + 15 分鐘入睡時間）
    const firstWakeupMinutes = (bedMinutes + (6 * 90 + 15)) % 1440

    // 生成 6 個時間點，每個間隔 90 分鐘
    const wakeupTimes = []
    for (let i = 0; i < 6; i++) {
      const currentMinutes = (firstWakeupMinutes + i * 90) % 1440
      wakeupTimes.push(minutesToTime(currentMinutes))
    }

    setWakeupResults(wakeupTimes)
    setView("wakeup")
  }

  // 獲取當前時間的格式化字符串
  const getCurrentTimeString = () => {
    const now = new Date()
    const hour = now.getHours() % 12 || 12
    const minute = now.getMinutes()
    const isPM = now.getHours() >= 12
    return `${hour}:${minute.toString().padStart(2, "0")} ${isPM ? "PM" : "AM"}`
  }

  // 渲染主頁面 - 更緊湊的設計
  const renderMainView = () => (
    <div className="flex flex-col items-center justify-center space-y-4 md:space-y-6">
      <h2 className="text-2xl md:text-3xl font-bold text-primary dark:text-vclock-orange">Sleep Calculator</h2>

      <div className="text-center mb-2 md:mb-4">
        <p className="text-sm md:text-lg text-gray-700 dark:text-vclock-amber mb-2 md:mb-4">
          What time do you want to wake up?
        </p>

        <div className="relative bg-white dark:bg-[#0a2a14] border-4 border-gray-300 dark:border-[#2a6633] rounded-xl p-3 md:p-6 w-full max-w-xs md:max-w-sm mx-auto shadow-lg">
          <div className="flex items-center justify-center">
            {/* 小時選擇器 */}
            <div className="flex flex-col items-center">
              <button
                onClick={incrementHour}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white p-1"
              >
                <ChevronUp className="h-5 w-5" />
              </button>

              <div
                ref={hourRef}
                className="w-16 md:w-20 h-12 md:h-16 flex items-center justify-center text-3xl md:text-5xl font-bold text-gray-800 dark:text-white cursor-ns-resize"
              >
                {selectedHour.toString().padStart(2, "0")}
              </div>

              <button
                onClick={decrementHour}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white p-1"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>

            <div className="text-3xl md:text-4xl mx-1 md:mx-2 text-gray-800 dark:text-white">:</div>

            {/* 分鐘選擇器 */}
            <div className="flex flex-col items-center">
              <button
                onClick={incrementMinute}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white p-1"
              >
                <ChevronUp className="h-5 w-5" />
              </button>

              <div
                ref={minuteRef}
                className="w-16 md:w-20 h-12 md:h-16 flex items-center justify-center text-3xl md:text-5xl font-bold text-gray-800 dark:text-white cursor-ns-resize"
              >
                {selectedMinute.toString().padStart(2, "0")}
              </div>

              <button
                onClick={decrementMinute}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white p-1"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>

            {/* AM/PM 選擇器 */}
            <div
              ref={ampmRef}
              onClick={toggleAMPM}
              className="w-16 md:w-20 h-12 md:h-16 flex items-center justify-center text-xl md:text-3xl font-bold text-gray-800 dark:text-white ml-2 md:ml-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1a4220] rounded-lg transition-colors"
            >
              {isPM ? "PM" : "AM"}
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Scroll or click arrows to change time
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 w-full max-w-md">
        <Button
          onClick={calculateBedtime}
          className="py-3 md:py-4 text-sm md:text-lg bg-primary hover:bg-primary/90 dark:bg-[#e6d9a5] dark:hover:bg-[#d6c98f] text-white dark:text-[#0a0f2a] font-semibold rounded-md"
        >
          Calculate bedtime <Moon className="ml-2 h-4 w-4 md:h-5 md:w-5" />
        </Button>

        <Button
          onClick={calculateWakeup}
          className="py-3 md:py-4 text-sm md:text-lg bg-primary hover:bg-primary/90 dark:bg-[#e6d9a5] dark:hover:bg-[#d6c98f] text-white dark:text-[#0a0f2a] font-semibold rounded-md"
        >
          Calculate wake-up <Alarm className="ml-2 h-4 w-4 md:h-5 md:w-5" />
        </Button>
      </div>
    </div>
  )

  // 渲染就寢時間結果 - 更緊湊的設計
  const renderBedtimeResults = () => {
    const wakeupTimeStr = `${selectedHour}:${selectedMinute.toString().padStart(2, "0")} ${isPM ? "PM" : "AM"}`

    // 將結果分為建議和其他選項
    const suggestedResults = bedtimeResults.slice(0, 2) // 前兩個時間為建議時間
    const otherResults = bedtimeResults.slice(2)

    return (
      <div className="flex flex-col items-center justify-center">
        <h2 className="text-xl md:text-3xl font-bold text-primary dark:text-vclock-orange mb-2 md:mb-4">Bedtime</h2>

        <p className="text-sm md:text-lg text-gray-800 dark:text-white text-center mb-1 md:mb-2">
          To wake up at <span className="font-semibold">{wakeupTimeStr}</span>, sleep at:
        </p>

        {/* 建議時間 - 並排顯示 */}
        <div className="grid grid-cols-2 gap-3 md:gap-6 my-3 md:my-4 w-full max-w-md">
          {suggestedResults.map((time, index) => (
            <div
              key={index}
              className="bg-gray-100 dark:bg-[#1a2042] rounded-lg p-2 md:p-4 flex justify-between items-center shadow-md"
            >
              <div className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white">{time}</div>
              <div className="text-xs md:text-sm text-primary dark:text-[#e6d9a5] font-semibold">SUGGESTED</div>
            </div>
          ))}
        </div>

        {/* 其他時間選項 - 網格布局 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-6 w-full max-w-md">
          {otherResults.map((time, index) => (
            <div key={`other-${index}`} className="bg-gray-100 dark:bg-[#1a2042] rounded-lg p-2 text-center">
              <div className="text-sm md:text-lg font-bold text-gray-800 dark:text-white">{time}</div>
            </div>
          ))}
        </div>

        <p className="text-xs md:text-sm text-gray-700 dark:text-white text-center mb-1">
          These times ensure you wake up between sleep cycles.
        </p>
        <p className="text-xs md:text-sm text-gray-700 dark:text-white text-center mb-4">
          A good night's sleep consists of 5-6 complete cycles.
        </p>

        <Button
          onClick={() => setView("main")}
          className="w-full max-w-xs py-2 md:py-3 text-sm md:text-base bg-primary hover:bg-primary/90 dark:bg-[#e6d9a5] dark:hover:bg-[#d6c98f] text-white dark:text-[#0a0f2a] font-semibold rounded-md"
        >
          Go back <ArrowLeft className="ml-2 h-4 w-4" />
        </Button>
      </div>
    )
  }

  // 渲染起床時間結果 - 更緊湊的設計
  const renderWakeupResults = () => {
    const bedtimeStr = getCurrentTimeString()

    // 將結果分為建議和其他選項
    const suggestedResults = wakeupResults.slice(0, 2) // 前兩個時間為建議時間
    const otherResults = wakeupResults.slice(2)

    return (
      <div className="flex flex-col items-center justify-center">
        <h2 className="text-xl md:text-3xl font-bold text-primary dark:text-vclock-orange mb-2 md:mb-4">
          Wake-up Time
        </h2>

        <p className="text-sm md:text-lg text-gray-800 dark:text-white text-center mb-1 md:mb-2">
          If you go to bed at <span className="font-semibold">{bedtimeStr}</span>, wake up at:
        </p>

        {/* 建議時間 - 並排顯示 */}
        <div className="grid grid-cols-2 gap-3 md:gap-6 my-3 md:my-4 w-full max-w-md">
          {suggestedResults.map((time, index) => (
            <div
              key={index}
              className="bg-gray-100 dark:bg-[#1a2042] rounded-lg p-2 md:p-4 flex justify-between items-center shadow-md"
            >
              <div className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white">{time}</div>
              <div className="text-xs md:text-sm text-primary dark:text-[#e6d9a5] font-semibold">SUGGESTED</div>
            </div>
          ))}
        </div>

        {/* 其他時間選項 - 網格布局 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-6 w-full max-w-md">
          {otherResults.map((time, index) => (
            <div key={`other-${index}`} className="bg-gray-100 dark:bg-[#1a2042] rounded-lg p-2 text-center">
              <div className="text-sm md:text-lg font-bold text-gray-800 dark:text-white">{time}</div>
            </div>
          ))}
        </div>

        <p className="text-xs md:text-sm text-gray-700 dark:text-white text-center mb-1">
          These times ensure you wake up between sleep cycles.
        </p>
        <p className="text-xs md:text-sm text-gray-700 dark:text-white text-center mb-4">
          A good night's sleep consists of 5-6 complete cycles.
        </p>

        <Button
          onClick={() => setView("main")}
          className="w-full max-w-xs py-2 md:py-3 text-sm md:text-base bg-primary hover:bg-primary/90 dark:bg-[#e6d9a5] dark:hover:bg-[#d6c98f] text-white dark:text-[#0a0f2a] font-semibold rounded-md"
        >
          Go back <ArrowLeft className="ml-2 h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white dark:bg-[#0a2a14] border border-gray-200 dark:border-vclock-muted/30 rounded-lg p-3 md:p-6 shadow-lg">
        {view === "main" && renderMainView()}
        {view === "bedtime" && renderBedtimeResults()}
        {view === "wakeup" && renderWakeupResults()}
      </div>
    </div>
  )
}

// Add default export that re-exports the named export
export default SleepCalculator

