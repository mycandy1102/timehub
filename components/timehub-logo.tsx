"use client"

export function TimeHubLogo() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-12 h-12 mb-1">
        {/* 標誌設計 - 基於提供的圖片靈感 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-10 h-10">
            {/* 外框 */}
            <div className="absolute top-0 left-0 w-6 h-2 bg-green-500"></div>
            <div className="absolute top-0 left-0 w-2 h-6 bg-green-500"></div>

            <div className="absolute bottom-0 right-0 w-6 h-2 bg-green-500"></div>
            <div className="absolute bottom-0 right-0 w-2 h-6 bg-green-500"></div>

            {/* 箭頭 */}
            <div className="absolute top-1 right-1 w-4 h-4 transform rotate-45">
              <div className="w-full h-1.5 bg-green-500 transform -translate-y-0.5"></div>
              <div className="w-1.5 h-full bg-green-500 absolute right-0 transform -translate-x-0.5"></div>
            </div>
          </div>
        </div>
      </div>
      <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-green-700">
        TimeHub
      </span>
    </div>
  )
}

