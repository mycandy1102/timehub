import { type NextRequest, NextResponse } from "next/server"

// 這個API路由將提供音頻文件
export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
  const name = params.name

  // 使用更可靠的音頻源
  const audioMap: Record<string, string> = {
    // Lofi 音樂 - 使用更可靠的音頻源
    "study-beats.mp3": "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
    "chill-vibes.mp3": "https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3",
    "sleep-beats.mp3": "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3",

    // ASMR 環境聲 - 使用更可靠的音頻源
    "rain-asmr.mp3": "https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3",
    "water-asmr.mp3": "https://assets.mixkit.co/sfx/preview/mixkit-forest-stream-ambience-loop-2316.mp3",
    "cafe-asmr.mp3": "https://assets.mixkit.co/sfx/preview/mixkit-restaurant-crowd-talking-ambience-447.mp3",
  }

  const audioUrl = audioMap[name]

  if (!audioUrl) {
    console.error(`Audio not found: ${name}`)
    return new NextResponse("Audio not found", { status: 404 })
  }

  // 直接返回音頻 URL，不進行驗證
  return NextResponse.json({
    url: audioUrl,
    status: "success",
  })
}

