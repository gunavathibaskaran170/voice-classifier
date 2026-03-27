import React, { useEffect, useRef } from 'react'

const WaveBars = ({ isRecording = false, audioData = [] }) => {
  const bars = 20

  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {Array.from({ length: bars }).map((_, i) => {
        const height = isRecording
          ? audioData[i]
            ? `${Math.max(10, audioData[i] * 100)}%`
            : `${Math.random() * 60 + 10}%`
          : '15%'

        return (
          <div
            key={i}
            className="w-1.5 rounded-full transition-all duration-75"
            style={{
              height,
              backgroundColor: isRecording ? '#6366f1' : '#4b5563',
              animationDelay: `${i * 50}ms`,
            }}
          />
        )
      })}
    </div>
  )
}

export default WaveBars