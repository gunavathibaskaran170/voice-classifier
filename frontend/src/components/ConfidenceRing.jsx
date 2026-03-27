import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function ConfidenceRing({ confidence = 0, tierCode = 'high', label = '' }) {
  const [displayVal, setDisplayVal] = useState(0)
  const animRef = useRef(null)

  const colorMap = {
    high: { stroke: '#00ff88', glow: '#00ff8880', text: '#00ff88' },
    review: { stroke: '#ffb800', glow: '#ffb80080', text: '#ffb800' },
    uncertain: { stroke: '#ff2d55', glow: '#ff2d5580', text: '#ff2d55' },
  }

  const colors = colorMap[tierCode] || colorMap.high

  // Animate counter
  useEffect(() => {
    let start = 0
    const end = Math.round(confidence)
    const duration = 1200
    const step = (timestamp) => {
      if (!animRef.current) animRef.current = timestamp
      const progress = Math.min((timestamp - animRef.current) / duration, 1)
      setDisplayVal(Math.round(progress * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    animRef.current = null
    requestAnimationFrame(step)
  }, [confidence])

  const radius = 70
  const stroke = 8
  const normalizedR = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedR
  const offset = circumference - (confidence / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        {/* Background ring */}
        <svg width={radius * 2} height={radius * 2} className="absolute inset-0">
          <circle
            cx={radius} cy={radius} r={normalizedR}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
        </svg>

        {/* Animated progress ring */}
        <motion.svg
          width={radius * 2} height={radius * 2}
          className="absolute inset-0"
          style={{ transform: 'rotate(-90deg)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <defs>
            <filter id="ring-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <motion.circle
            cx={radius} cy={radius} r={normalizedR}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            filter="url(#ring-glow)"
            style={{ filter: `drop-shadow(0 0 6px ${colors.glow})` }}
          />
        </motion.svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold font-mono" style={{ color: colors.text }}>
            {displayVal}<span className="text-lg">%</span>
          </span>
          <span className="text-xs text-slate-400 mt-1">confidence</span>
        </div>
      </div>

      {label && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xs font-mono px-3 py-1 rounded-full border"
          style={{ color: colors.text, borderColor: colors.stroke + '44', background: colors.stroke + '11' }}
        >
          {label}
        </motion.div>
      )}
    </div>
  )
}
