"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

interface SleepProps {
  isDarkMode?: boolean
  zoomLevel?: number
}

// ASMR 環境聲選項
const asmrOptions = [
  { id: "whitenoise", name: "White Noise", type: "noise" },
  { id: "water", name: "Flowing Water", type: "sample", url: "water-asmr.mp3" },
  { id: "rain", name: "Rain Sounds", type: "sample", url: "rain-asmr.mp3" },
  { id: "cafe", name: "Cafe Ambience", type: "sample", url: "cafe-asmr.mp3" },
]

// Lofi 音樂選項
const lofiOptions = [
  { id: "study", name: "Study Beats", url: "study-beats.mp3" },
  { id: "chill", name: "Chill Vibes", url: "chill-vibes.mp3" },
  { id: "sleep", name: "Sleep Beats", url: "sleep-beats.mp3" },
]

export function Sleep({ isDarkMode = false, zoomLevel = 1 }: SleepProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [selectedAsmr, setSelectedAsmr] = useState(asmrOptions[0])
  const [selectedLofi, setSelectedLofi] = useState(lofiOptions[0])
  const [activeSound, setActiveSound] = useState<"asmr" | "lofi">("asmr")
  const [sleepTime, setSleepTime] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [audioCache, setAudioCache] = useState<Record<string, string>>({})
  const [audioError, setAudioError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState<Record<string, number>>({})

  // 音頻上下文和節點引用
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // 初始化音頻上下文
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // 只在用戶交互後創建音頻上下文，避免自動播放問題
        const setupAudioContext = () => {
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
            gainNodeRef.current = audioContextRef.current.createGain()
            gainNodeRef.current.gain.value = volume
            gainNodeRef.current.connect(audioContextRef.current.destination)
          }
        }

        // 監聽用戶交互事件
        const interactionEvents = ["click", "touchstart", "keydown"]
        const handleInteraction = () => {
          setupAudioContext()
          // 移除事件監聽器，因為我們只需要設置一次
          interactionEvents.forEach((event) => {
            window.removeEventListener(event, handleInteraction)
          })
        }

        interactionEvents.forEach((event) => {
          window.addEventListener(event, handleInteraction)
        })

        return () => {
          interactionEvents.forEach((event) => {
            window.removeEventListener(event, handleInteraction)
          })
        }
      } catch (error) {
        console.error("Failed to initialize Web Audio API:", error)
        setAudioError("Failed to initialize audio system")
      }
    }

    return () => {
      stopSound()
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        try {
          audioContextRef.current.close()
        } catch (error) {
          console.error("Error closing audio context:", error)
        }
      }
    }
  }, [])

  // 預加載音頻文件
  useEffect(() => {
    const preloadAudio = async () => {
      // 預加載所有 ASMR 和 Lofi 音頻
      const filesToPreload = [
        ...asmrOptions.filter((option) => option.type === "sample").map((option) => option.url as string),
        ...lofiOptions.map((option) => option.url),
      ]

      for (const file of filesToPreload) {
        if (!audioCache[file]) {
          try {
            const response = await fetch(`/api/audio/${file}`)
            if (!response.ok) {
              console.error(`Failed to preload audio: ${file}`, response.statusText)
              continue
            }

            const data = await response.json()
            if (data.status === "error") {
              console.error(`Error in audio API: ${file}`, data.error)
              continue
            }

            // 在客戶端預加載音頻以驗證 URL
            const audio = new Audio()
            audio.crossOrigin = "anonymous"

            // 設置加載事件
            const loadPromise = new Promise<void>((resolve, reject) => {
              audio.oncanplaythrough = () => resolve()
              audio.onerror = (e) => {
                console.error(`Error preloading audio: ${file}`, e)
                reject(new Error(`Failed to preload audio: ${file}`))
              }

              // 設置超時
              const timeout = setTimeout(() => {
                reject(new Error(`Timeout preloading audio: ${file}`))
              }, 5000)

              audio.oncanplaythrough = () => {
                clearTimeout(timeout)
                resolve()
              }
            })

            // 設置音頻源並開始加載
            audio.src = data.url
            audio.load()

            try {
              // 等待加載完成或失敗
              await loadPromise
              // 加載成功，更新緩存
              setAudioCache((prev) => ({ ...prev, [file]: data.url }))
            } catch (loadError) {
              console.error(`Failed to validate audio URL: ${file}`, loadError)
              // 不更新緩存，下次會重試
            }

            // 釋放資源
            audio.src = ""
            audio.load()
          } catch (error) {
            console.error(`Error preloading audio: ${file}`, error)
          }
        }
      }
    }

    preloadAudio()
  }, [audioCache])

  // 處理音量變更
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume
    }
    if (audioElementRef.current) {
      audioElementRef.current.volume = volume
    }
  }, [volume])

  // 處理計時器
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining((prev) => {
          if (prev !== null && prev > 0) {
            return prev - 1
          }
          return null
        })
      }, 1000)
    } else if (timeRemaining === 0) {
      // 時間到，停止音樂
      stopSound()
      setIsPlaying(false)
      setTimeRemaining(null)
      setSleepTime(null)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [timeRemaining])

  // 根據縮放級別計算字體大小
  const getDigitFontSize = () => {
    // 基礎大小為 2xl (24px)
    const baseSizeClass = "text-2xl"

    if (zoomLevel <= 1) {
      return baseSizeClass
    } else if (zoomLevel <= 1.3) {
      return "text-3xl" // 30px
    } else if (zoomLevel <= 1.6) {
      return "text-4xl" // 36px
    } else {
      return "text-5xl" // 48px
    }
  }

  // 生成白噪音
  const createNoiseBuffer = () => {
    if (!audioContextRef.current) return null

    const bufferSize = 2 * audioContextRef.current.sampleRate
    const noiseBuffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate)
    const output = noiseBuffer.getChannelData(0)

    // 生成白噪音
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }

    return noiseBuffer
  }

  // 播放白噪音
  const playWhiteNoise = () => {
    if (!audioContextRef.current || !gainNodeRef.current) {
      // 如果音頻上下文尚未初始化，嘗試初始化它
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        gainNodeRef.current = audioContextRef.current.createGain()
        gainNodeRef.current.gain.value = volume
        gainNodeRef.current.connect(audioContextRef.current.destination)
      } catch (error) {
        console.error("Failed to initialize Web Audio API:", error)
        setAudioError("Could not initialize audio system")
        toast({
          title: "Audio Error",
          description: "Could not initialize audio system. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
    }

    // 確保音頻上下文處於運行狀態
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch((error) => {
        console.error("Error resuming audio context:", error)
        setAudioError("Could not resume audio context")
      })
    }

    // 停止之前的聲音
    stopSound()

    try {
      // 創建噪音緩衝區
      const noiseBuffer = createNoiseBuffer()
      if (!noiseBuffer) {
        setIsLoading(false)
        setAudioError("Could not create noise buffer")
        return
      }

      // 創建和配置源
      noiseSourceRef.current = audioContextRef.current.createBufferSource()
      noiseSourceRef.current.buffer = noiseBuffer
      noiseSourceRef.current.loop = true
      noiseSourceRef.current.connect(gainNodeRef.current)

      // 開始播放
      noiseSourceRef.current.start()
      setIsPlaying(true)
      setIsLoading(false)
      setAudioError(null)
    } catch (error) {
      console.error("Error playing white noise:", error)
      setIsPlaying(false)
      setIsLoading(false)
      setAudioError("Could not play white noise")
      toast({
        title: "Audio Error",
        description: "Could not play white noise. Please try again.",
        variant: "destructive",
      })
    }
  }

  // 獲取音頻 URL
  const getAudioUrl = async (filename: string): Promise<string | null> => {
    // 檢查緩存
    if (audioCache[filename]) {
      return audioCache[filename]
    }

    // 檢查重試次數
    const currentRetries = retryCount[filename] || 0
    if (currentRetries >= 3) {
      setAudioError(`Failed to load audio after multiple attempts: ${filename}`)
      return null
    }

    try {
      // 從 API 獲取 URL
      const response = await fetch(`/api/audio/${filename}`)
      if (!response.ok) {
        console.error(`Failed to fetch audio URL: ${filename}`, response.statusText)
        setAudioError(`Failed to fetch audio: ${filename}`)

        // 增加重試計數
        setRetryCount((prev) => ({ ...prev, [filename]: currentRetries + 1 }))
        return null
      }

      const data = await response.json()
      if (data.status === "error") {
        console.error(`Error in audio API: ${filename}`, data.error)
        setAudioError(`API error: ${data.error}`)

        // 增加重試計數
        setRetryCount((prev) => ({ ...prev, [filename]: currentRetries + 1 }))
        return null
      }

      // 更新緩存
      setAudioCache((prev) => ({ ...prev, [filename]: data.url }))
      // 重置重試計數
      setRetryCount((prev) => ({ ...prev, [filename]: 0 }))

      return data.url
    } catch (error) {
      console.error(`Error fetching audio URL: ${filename}`, error)
      setAudioError(`Network error fetching audio: ${filename}`)

      // 增加重試計數
      setRetryCount((prev) => ({ ...prev, [filename]: currentRetries + 1 }))
      return null
    }
  }

  // 播放音頻樣本
  const playAudioSample = async (filename: string) => {
    setIsLoading(true)
    setAudioError(null)

    // 確保先停止任何正在播放的聲音
    stopSound()

    try {
      // 獲取音頻 URL
      const audioUrl = await getAudioUrl(filename)

      if (!audioUrl) {
        setIsLoading(false)
        toast({
          title: "Audio Error",
          description: `Could not load audio file: ${filename}`,
          variant: "destructive",
        })
        return
      }

      console.log(`Playing audio: ${filename} from URL: ${audioUrl}`)

      // 創建新的音頻元素
      const audio = new Audio()

      // 設置音頻屬性
      audio.crossOrigin = "anonymous" // 添加跨域支持
      audio.preload = "auto"
      audio.volume = volume

      // 設置事件處理程序
      const canPlayHandler = () => {
        console.log(`Audio can play through: ${filename}`)
        setIsLoading(false)
        setIsPlaying(true)
        setAudioError(null)
      }

      const errorHandler = (e: Event) => {
        const errorMessage = (e.target as HTMLAudioElement).error?.message || "Unknown error"
        console.error(`Audio loading error for ${filename}:`, e, errorMessage)
        setIsLoading(false)
        setIsPlaying(false)
        setAudioError(`Error loading audio: ${errorMessage}`)

        // 從緩存中移除無效的 URL
        setAudioCache((prev) => {
          const newCache = { ...prev }
          delete newCache[filename]
          return newCache
        })

        toast({
          title: "Audio Error",
          description: `Could not load audio file: ${filename}. Error: ${errorMessage}`,
          variant: "destructive",
        })
      }

      audio.addEventListener("canplaythrough", canPlayHandler, { once: true })
      audio.addEventListener("error", errorHandler)

      // 設置音頻源
      audio.src = audioUrl
      audio.loop = true

      // 存儲音頻元素引用
      audioElementRef.current = audio

      // 嘗試加載音頻
      audio.load()

      // 設置超時處理
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.error(`Timeout loading audio: ${filename}`)
          audio.removeEventListener("canplaythrough", canPlayHandler)
          audio.removeEventListener("error", errorHandler)

          setIsLoading(false)
          setAudioError(`Timeout loading audio: ${filename}`)

          // 從緩存中移除可能有問題的 URL
          setAudioCache((prev) => {
            const newCache = { ...prev }
            delete newCache[filename]
            return newCache
          })

          toast({
            title: "Audio Error",
            description: `Timeout loading audio file: ${filename}`,
            variant: "destructive",
          })
        }
      }, 10000) // 10秒超時

      // 嘗試播放
      const playPromise = audio.play()

      // 處理播放承諾
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            clearTimeout(timeoutId)
          })
          .catch((error) => {
            clearTimeout(timeoutId)
            console.error(`Error playing audio ${filename}:`, error)
            setIsLoading(false)
            setIsPlaying(false)
            setAudioError(`Error playing audio: ${error.message || "Unknown error"}`)

            // 如果是自動播放策略問題，顯示特定消息
            if (error.name === "NotAllowedError") {
              toast({
                title: "Autoplay Blocked",
                description: "Please interact with the page first to enable audio playback.",
                variant: "destructive",
              })
            } else {
              toast({
                title: "Audio Error",
                description: `Could not play audio: ${error.message || "Unknown error"}`,
                variant: "destructive",
              })
            }
          })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error(`Error setting up audio for ${filename}:`, error)
      setIsLoading(false)
      setIsPlaying(false)
      setAudioError(`Error setting up audio: ${errorMessage}`)

      toast({
        title: "Audio Error",
        description: `Could not set up audio playback: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  // 停止所有聲音
  const stopSound = () => {
    setIsPlaying(false)
    setAudioError(null)

    // 停止噪音源
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop()
        noiseSourceRef.current.disconnect()
      } catch (e) {
        // 忽略已停止的錯誤
        console.log("Noise source already stopped or disconnected")
      }
      noiseSourceRef.current = null
    }

    // 停止音頻元素
    if (audioElementRef.current) {
      try {
        const audio = audioElementRef.current

        // 移除事件監聽器
        audio.oncanplaythrough = null
        audio.onerror = null

        // 暫停並重置
        audio.pause()
        audio.currentTime = 0

        // 釋放資源
        audio.src = ""
        audio.load()
      } catch (e) {
        console.log("Audio element already stopped or error occurred", e)
      }
      audioElementRef.current = null
    }

    // 清除間隔
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // 播放選定的聲音
  const playSelectedSound = () => {
    setIsLoading(true)
    setAudioError(null)

    if (activeSound === "asmr") {
      if (selectedAsmr.type === "noise") {
        playWhiteNoise()
      } else if (selectedAsmr.type === "sample" && selectedAsmr.url) {
        playAudioSample(selectedAsmr.url)
      }
    } else if (activeSound === "lofi" && selectedLofi.url) {
      playAudioSample(selectedLofi.url)
    }
  }

  // 切換播放/暫停
  const togglePlay = () => {
    if (isPlaying) {
      stopSound()
    } else {
      // 確保音頻上下文已啟動（處理自動播放策略）
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch((error) => {
          console.error("Error resuming audio context:", error)
          setAudioError("Could not resume audio context")
        })
      }

      playSelectedSound()
    }
  }

  // 處理 ASMR 選擇變更
  const handleAsmrChange = (value: string) => {
    const selected = asmrOptions.find((option) => option.id === value) || asmrOptions[0]
    setSelectedAsmr(selected)
    setActiveSound("asmr")
    setAudioError(null)

    if (isPlaying) {
      stopSound()
      // 短暫延遲以確保之前的聲音已停止
      setTimeout(() => {
        if (selected.type === "noise") {
          playWhiteNoise()
        } else if (selected.type === "sample" && selected.url) {
          playAudioSample(selected.url)
        }
      }, 100)
    }
  }

  // 處理 Lofi 選擇變更
  const handleLofiChange = (value: string) => {
    const selected = lofiOptions.find((option) => option.id === value) || lofiOptions[0]
    setSelectedLofi(selected)
    setActiveSound("lofi")
    setAudioError(null)

    if (isPlaying) {
      stopSound()
      // 短暫延遲以確保之前的聲音已停止
      setTimeout(() => {
        if (selected.url) {
          playAudioSample(selected.url)
        }
      }, 100)
    }
  }

  // 設置睡眠時間
  const handleSleepTimeSet = (hours: number) => {
    const seconds = hours * 60 * 60
    setSleepTime(hours)
    setTimeRemaining(seconds)

    // 如果聲音沒有播放，自動開始播放
    if (!isPlaying && !isLoading) {
      // 確保音頻上下文已啟動
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch((error) => {
          console.error("Error resuming audio context:", error)
          setAudioError("Could not resume audio context")
        })
      }

      playSelectedSound()
    }
  }

  // 格式化剩餘時間
  const formatTimeRemaining = () => {
    if (timeRemaining === null) return "--:--:--"

    const hours = Math.floor(timeRemaining / 3600)
    const minutes = Math.floor((timeRemaining % 3600) / 60)
    const seconds = timeRemaining % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const digitFontSize = getDigitFontSize()

  // 重試播放
  const handleRetry = () => {
    setAudioError(null)

    // 清除緩存中的所有音頻 URL
    setAudioCache({})

    // 重置重試計數
    setRetryCount({})

    // 嘗試播放
    if (activeSound === "asmr") {
      if (selectedAsmr.type === "noise") {
        playWhiteNoise()
      } else if (selectedAsmr.type === "sample" && selectedAsmr.url) {
        playAudioSample(selectedAsmr.url)
      }
    } else if (activeSound === "lofi" && selectedLofi.url) {
      playAudioSample(selectedLofi.url)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-vclock-muted rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-primary dark:text-vclock-orange">Sleep Lofi</h2>

        {/* 錯誤顯示 */}
        {audioError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 text-sm">
            <p className="font-medium">Audio Error</p>
            <p>{audioError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="mt-2 text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              Retry
            </Button>
          </div>
        )}

        {/* 聲音類型選擇 */}
        <div className="mb-6">
          <div className="flex gap-3">
            <Button
              variant={activeSound === "asmr" ? "default" : "outline"}
              className={
                activeSound === "asmr"
                  ? "flex-1 bg-primary hover:bg-primary/90 dark:bg-vclock-button dark:hover:bg-vclock-buttonHover text-white"
                  : "flex-1 border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-vclock-muted dark:text-vclock-amber dark:hover:bg-vclock-muted/20"
              }
              onClick={() => setActiveSound("asmr")}
            >
              ASMR Sounds
            </Button>
            <Button
              variant={activeSound === "lofi" ? "default" : "outline"}
              className={
                activeSound === "lofi"
                  ? "flex-1 bg-primary hover:bg-primary/90 dark:bg-vclock-button dark:hover:bg-vclock-buttonHover text-white"
                  : "flex-1 border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-vclock-muted dark:text-vclock-amber dark:hover:bg-vclock-muted/20"
              }
              onClick={() => setActiveSound("lofi")}
            >
              Lofi Music
            </Button>
          </div>
        </div>

        {/* ASMR 選擇 */}
        {activeSound === "asmr" && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-vclock-amber mb-3">Select ASMR</h3>
            <Select value={selectedAsmr.id} onValueChange={handleAsmrChange}>
              <SelectTrigger className="w-full bg-white dark:bg-black border-gray-200 dark:border-vclock-muted text-gray-800 dark:text-vclock-orange">
                <SelectValue placeholder="Select ASMR sound" />
              </SelectTrigger>
              <SelectContent>
                {asmrOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Lofi 音樂選擇 */}
        {activeSound === "lofi" && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-vclock-amber mb-3">Select Lofi Music</h3>
            <Select value={selectedLofi.id} onValueChange={handleLofiChange}>
              <SelectTrigger className="w-full bg-white dark:bg-black border-gray-200 dark:border-vclock-muted text-gray-800 dark:text-vclock-orange">
                <SelectValue placeholder="Select Lofi music" />
              </SelectTrigger>
              <SelectContent>
                {lofiOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 音量控制 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-vclock-amber">Volume</h3>
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 0.5)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-vclock-muted/20 text-gray-700 dark:text-gray-300"
            >
              {volume > 0 ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
          <Slider
            value={[volume * 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => setVolume(value[0] / 100)}
            className="mb-2"
          />
        </div>

        {/* 睡眠計時器 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-vclock-amber mb-3">Sleep Timer</h3>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((hour) => (
              <Button
                key={hour}
                variant={sleepTime === hour ? "default" : "outline"}
                className={
                  sleepTime === hour
                    ? "bg-primary hover:bg-primary/90 dark:bg-vclock-button dark:hover:bg-vclock-buttonHover text-white"
                    : "border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-vclock-muted dark:text-vclock-amber dark:hover:bg-vclock-muted/20"
                }
                onClick={() => handleSleepTimeSet(hour)}
              >
                {hour}h
              </Button>
            ))}
          </div>

          {timeRemaining !== null && (
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-vclock-amber mb-1">Time Remaining</p>
              <p className={`${digitFontSize} font-mono text-primary dark:text-vclock-orange`}>
                {formatTimeRemaining()}
              </p>
            </div>
          )}
        </div>

        {/* 播放控制 */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={togglePlay}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 dark:bg-vclock-button dark:hover:bg-vclock-buttonHover text-white px-8"
          >
            {isLoading ? (
              "Loading..."
            ) : isPlaying ? (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Play
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Add default export that re-exports the named export
export default Sleep

