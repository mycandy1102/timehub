"use client"

import { useState, useEffect, useRef } from "react"
import { AlarmClock, TimerIcon, ClockIcon as StopwatchIcon, Settings, Moon } from "lucide-react"
import { ClockWithAlarm } from "@/components/clock-with-alarm"
import { ThemeToggle } from "@/components/theme-toggle"
import { SettingsPanel } from "@/components/settings-panel"
import { TimeHubLogo } from "@/components/timehub-logo"
import { ViewControls } from "@/components/view-controls"

// Add dynamic import with suspense for audio-related components
import dynamic from "next/dynamic"

// Fix the dynamic imports to correctly handle default exports
const Timer = dynamic(() => import("@/components/timer"), {
  ssr: false,
})

const Stopwatch = dynamic(() => import("@/components/stopwatch"), {
  ssr: false,
})

const SleepCalculator = dynamic(() => import("@/components/sleep-calculator"), {
  ssr: false,
})

// 字體大小階段
const FONT_SIZE_LEVELS = [1, 1.3, 1.6, 2]

export default function Home() {
  const [activeTab, setActiveTab] = useState("clock")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fontSizeLevel, setFontSizeLevel] = useState(0) // 0 = 基礎大小
  const fullscreenRef = useRef<HTMLDivElement>(null)

  // 檢查是否處於全屏模式
  const checkFullscreen = () => {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    )
  }

  useEffect(() => {
    // Check if user prefers dark mode
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const isDark = document.documentElement.classList.contains("dark") || prefersDark
    setIsDarkMode(isDark)

    if (isDark) {
      document.documentElement.classList.add("dark")
    }

    // 監聽全屏變化事件
    const handleFullscreenChange = () => {
      setIsFullscreen(checkFullscreen())
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)

    // 監聽 ESC 鍵退出全屏
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isFullscreen])

  const toggleTheme = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)

    if (newMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  // 處理字體放大
  const handleZoomIn = () => {
    if (fontSizeLevel < FONT_SIZE_LEVELS.length - 1) {
      setFontSizeLevel((prev) => prev + 1)
    }
  }

  // 處理字體縮小
  const handleZoomOut = () => {
    if (fontSizeLevel > 0) {
      setFontSizeLevel((prev) => prev - 1)
    }
  }

  // 進入全屏模式
  const enterFullscreen = () => {
    if (fullscreenRef.current) {
      try {
        if (fullscreenRef.current.requestFullscreen) {
          fullscreenRef.current.requestFullscreen().catch((err) => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`)
          })
        } else if ((fullscreenRef.current as any).webkitRequestFullscreen) {
          ;(fullscreenRef.current as any).webkitRequestFullscreen()
        } else if ((fullscreenRef.current as any).mozRequestFullScreen) {
          ;(fullscreenRef.current as any).mozRequestFullScreen()
        } else if ((fullscreenRef.current as any).msRequestFullscreen) {
          ;(fullscreenRef.current as any).msRequestFullscreen()
        }
      } catch (error) {
        console.error("Failed to enter fullscreen mode:", error)
      }
    }
  }

  // 退出全屏模式
  const exitFullscreen = () => {
    try {
      // 檢查是否真的處於全屏模式
      if (checkFullscreen()) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch((err) => {
            console.error(`Error attempting to exit fullscreen: ${err.message}`)
          })
        } else if ((document as any).webkitExitFullscreen) {
          ;(document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          ;(document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          ;(document as any).msExitFullscreen()
        }
      }
    } catch (error) {
      console.error("Failed to exit fullscreen mode:", error)
      // 如果退出全屏失敗，至少更新狀態
      setIsFullscreen(false)
    }
  }

  // 處理全屏切換
  const handleFullscreen = () => {
    if (!isFullscreen) {
      enterFullscreen()
    } else {
      exitFullscreen()
    }
  }

  // 獲取當前字體縮放級別
  const getCurrentZoomLevel = () => {
    return FONT_SIZE_LEVELS[fontSizeLevel]
  }

  // 渲染當前活動的組件
  const renderActiveComponent = () => {
    const zoomLevel = getCurrentZoomLevel()

    switch (activeTab) {
      case "clock":
        return <ClockWithAlarm zoomLevel={zoomLevel} />
      case "timer":
        return <Timer isDarkMode={isDarkMode} zoomLevel={zoomLevel} />
      case "stopwatch":
        return <Stopwatch isDarkMode={isDarkMode} zoomLevel={zoomLevel} />
      case "sleep":
        return <SleepCalculator isDarkMode={isDarkMode} zoomLevel={zoomLevel} />
      default:
        return <ClockWithAlarm zoomLevel={zoomLevel} />
    }
  }

  return (
    <div
      ref={fullscreenRef}
      className="min-h-screen flex bg-white dark:bg-vclock-background transition-colors duration-300"
    >
      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Sidebar */}
      <div className="w-24 border-r border-gray-200 dark:border-vclock-muted flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-vclock-muted flex justify-center">
          <TimeHubLogo />
        </div>

        <nav className="flex-1">
          <button
            onClick={() => setActiveTab("clock")}
            className={`w-full p-4 flex flex-col items-center gap-2 transition-colors ${
              activeTab === "clock"
                ? "bg-gray-100 dark:bg-vclock-muted/20 text-primary dark:text-vclock-orange"
                : "hover:bg-gray-100 dark:hover:bg-vclock-muted/10 text-gray-700 dark:text-gray-300"
            }`}
          >
            <AlarmClock className="h-6 w-6" />
            <span className="text-xs">Alarm Clock</span>
          </button>

          <button
            onClick={() => setActiveTab("timer")}
            className={`w-full p-4 flex flex-col items-center gap-2 transition-colors ${
              activeTab === "timer"
                ? "bg-gray-100 dark:bg-vclock-muted/20 text-primary dark:text-vclock-orange"
                : "hover:bg-gray-100 dark:hover:bg-vclock-muted/10 text-gray-700 dark:text-gray-300"
            }`}
          >
            <TimerIcon className="h-6 w-6" />
            <span className="text-xs">Timer</span>
          </button>

          <button
            onClick={() => setActiveTab("stopwatch")}
            className={`w-full p-4 flex flex-col items-center gap-2 transition-colors ${
              activeTab === "stopwatch"
                ? "bg-gray-100 dark:bg-vclock-muted/20 text-primary dark:text-vclock-orange"
                : "hover:bg-gray-100 dark:hover:bg-vclock-muted/10 text-gray-700 dark:text-gray-300"
            }`}
          >
            <StopwatchIcon className="h-6 w-6" />
            <span className="text-xs">Stopwatch</span>
          </button>

          <button
            onClick={() => setActiveTab("sleep")}
            className={`w-full p-4 flex flex-col items-center gap-2 transition-colors ${
              activeTab === "sleep"
                ? "bg-gray-100 dark:bg-vclock-muted/20 text-primary dark:text-vclock-orange"
                : "hover:bg-gray-100 dark:hover:bg-vclock-muted/10 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Moon className="h-6 w-6" />
            <span className="text-xs">Sleep Calculator</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-vclock-muted flex justify-center">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-vclock-muted/10">
            <ThemeToggle isDarkMode={isDarkMode} />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-vclock-muted/10 ml-1"
          >
            <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar with control buttons */}
        <div className="flex justify-end p-4 border-b border-gray-200 dark:border-vclock-muted">
          <ViewControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFullscreen={handleFullscreen}
            canZoomOut={fontSizeLevel > 0}
          />
        </div>

        <div className="flex-1 p-6 flex items-center justify-center">{renderActiveComponent()}</div>
      </div>
    </div>
  )
}

