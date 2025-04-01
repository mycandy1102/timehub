// Audio context singleton
let audioContext: AudioContext | null = null

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.error("Web Audio API is not supported in this browser", error)
    }
  }
  return audioContext as AudioContext
}

// 更柔和的鬧鐘聲音
export function playAlarmSound(duration = 500, frequency = 440, volume = 0.2, type: OscillatorType = "sine") {
  try {
    const context = getAudioContext()
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    // 使用正弦波而不是方波，聲音更柔和
    oscillator.type = type
    oscillator.frequency.value = frequency

    // 添加一些音調變化，使聲音更悅耳
    const now = context.currentTime
    oscillator.frequency.setValueAtTime(frequency, now)
    oscillator.frequency.linearRampToValueAtTime(frequency * 1.2, now + 0.1)
    oscillator.frequency.linearRampToValueAtTime(frequency, now + 0.2)

    // 添加淡入淡出效果
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.05)
    gainNode.gain.linearRampToValueAtTime(volume, now + duration / 1000 - 0.05)
    gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000)

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    // 開始播放
    oscillator.start()

    // 在指定時間後停止
    setTimeout(() => {
      try {
        oscillator.stop()
      } catch (e) {
        // 忽略已停止的錯誤
      }
    }, duration)

    return {
      stop: () => {
        try {
          // 淡出效果
          const stopTime = context.currentTime
          gainNode.gain.setValueAtTime(gainNode.gain.value, stopTime)
          gainNode.gain.linearRampToValueAtTime(0, stopTime + 0.05)

          // 短暫延遲後停止振盪器
          setTimeout(() => {
            try {
              oscillator.stop()
            } catch (e) {
              // 忽略已停止的錯誤
            }
          }, 60)
        } catch (e) {
          // 忽略已停止的錯誤
        }
      },
    }
  } catch (error) {
    console.error("Error playing alarm sound:", error)
    return { stop: () => {} }
  }
}

export function playAlarmPattern() {
  let isActive = true
  let sounds: { stop: () => void }[] = []
  let mainInterval: NodeJS.Timeout | null = null

  // 創建一個更柔和的鬧鐘聲音模式
  const playPattern = () => {
    if (!isActive) {
      return
    }

    // 清除之前的聲音
    sounds.forEach((sound) => sound.stop())
    sounds = []

    // 創建主要音調
    const mainSound = playAlarmSound(800, 440, 0.2, "sine")
    sounds.push(mainSound)

    // 添加和諧的次要音調
    setTimeout(() => {
      if (isActive) {
        const secondarySound = playAlarmSound(600, 554, 0.15, "sine") // 和諧的音程
        sounds.push(secondarySound)
      }
    }, 200)
  }

  // 開始播放模式
  playPattern()

  // 每 2 秒重複一次，但不使用 setInterval 來避免重複觸發
  const scheduleNextPattern = () => {
    if (isActive) {
      mainInterval = setTimeout(() => {
        playPattern()
        scheduleNextPattern()
      }, 2000)
    }
  }

  scheduleNextPattern()

  return {
    stop: () => {
      isActive = false

      // 停止所有聲音
      sounds.forEach((sound) => sound.stop())
      sounds = []

      // 清除計時器
      if (mainInterval) {
        clearTimeout(mainInterval)
        mainInterval = null
      }
    },
  }
}

