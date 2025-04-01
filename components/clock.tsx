"use client"

import { useState, useEffect } from "react"

export function Clock() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [blinkColon, setBlinkColon] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      setBlinkColon((prev) => !prev)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Format time parts separately for styling
  const hours = currentTime.getHours().toString().padStart(2, "0")
  const minutes = currentTime.getMinutes().toString().padStart(2, "0")
  const seconds = currentTime.getSeconds().toString().padStart(2, "0")
  const ampm = currentTime.getHours() >= 12 ? "PM" : "AM"

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

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto">
      <div className="relative mb-8">
        <div className="text-8xl md:text-9xl font-mono tracking-wider flex items-center justify-center dark:text-vclock-orange relative">
          <span className="inline-block transform transition-transform hover:scale-105 shadow-digital">{hours}</span>
          <span className={`mx-2 ${blinkColon ? "opacity-100" : "opacity-30"} transition-opacity duration-100`}>:</span>
          <span className="inline-block transform transition-transform hover:scale-105 shadow-digital">{minutes}</span>
          <span className={`mx-2 ${blinkColon ? "opacity-100" : "opacity-30"} transition-opacity duration-100`}>:</span>
          <span className="inline-block transform transition-transform hover:scale-105 shadow-digital">{seconds}</span>
          <span className="text-3xl md:text-4xl ml-4 mt-auto mb-2 dark:text-vclock-amber">{ampm}</span>
        </div>
        <div className="absolute inset-0 pointer-events-none blur-sm opacity-30 dark:opacity-40 dark:text-vclock-orange text-8xl md:text-9xl font-mono tracking-wider flex items-center justify-center">
          <span>{hours}</span>
          <span className="mx-2">:</span>
          <span>{minutes}</span>
          <span className="mx-2">:</span>
          <span>{seconds}</span>
        </div>
      </div>

      <div className="text-xl md:text-2xl font-mono tracking-wider dark:text-vclock-amber animate-flicker">
        {formattedDate}
      </div>

      <button className="mt-8 px-6 py-3 bg-vclock-button hover:bg-vclock-buttonHover text-white rounded-md transition-colors transform hover:scale-105 active:scale-95">
        Set Alarm
      </button>
    </div>
  )
}

