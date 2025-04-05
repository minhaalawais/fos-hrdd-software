"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + 10
        return newProgress > 100 ? 100 : newProgress
      })
    }, 200)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-white flex flex-col justify-center items-center z-50">
      <div className="w-24 h-24 rounded-full border-4 border-gray-200 flex justify-center items-center animate-pulse mb-8">
        <Image
          src="/fos_logo.png?height=80&width=80"
          alt="Loading..."
          width={80}
          height={80}
          className="loading-logo"
        />
      </div>

      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <p className="text-gray-500 mt-4 text-sm font-medium">Loading Grievance Portal...</p>
    </div>
  )
}

