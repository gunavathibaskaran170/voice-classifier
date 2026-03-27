import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

// Maps a dB value (roughly -80..0) to a color (dark→neon)
function dbToColor(val) {
  const norm = Math.max(0, Math.min(1, (val + 80) / 80))
  if (norm < 0.25) return `rgb(${Math.round(norm * 4 * 20)}, 0, ${Math.round(30 + norm * 4 * 50)})`
  if (norm < 0.5) {
    const t = (norm - 0.25) * 4
    return `rgb(${Math.round(20 + t * 0)}, ${Math.round(t * 100)}, ${Math.round(80 + t * 175)})`
  }
  if (norm < 0.75) {
    const t = (norm - 0.5) * 4
    return `rgb(0, ${Math.round(100 + t * 155)}, ${Math.round(255 - t * 255)})`
  }
  const t = (norm - 0.75) * 4
  return `rgb(${Math.round(t * 255)}, 255, 0)`
}

export default function SpectrogramView({ data }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!data || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const rows = data.length
    const cols = data[0]?.length || 0
    canvas.width = cols
    canvas.height = rows

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = dbToColor(data[rows - 1 - r][c])
        ctx.fillRect(c, r, 1, 1)
      }
    }
  }, [data])

  if (!data) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="glass p-4 space-y-2"
    >
      <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
        Mel Spectrogram
      </div>
      <div className="relative rounded-lg overflow-hidden" style={{ height: 120 }}>
        <canvas
          ref={canvasRef}
          className="spectrogram-canvas w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />
        {/* Frequency axis label */}
        <div className="absolute left-2 top-1 text-xs text-white/30 font-mono">High</div>
        <div className="absolute left-2 bottom-1 text-xs text-white/30 font-mono">Low</div>
        <div className="absolute right-2 bottom-1 text-xs text-white/30 font-mono">Time →</div>
      </div>
      <div className="flex justify-between text-xs text-slate-600 font-mono">
        <span>Mel Frequency Bands</span>
        <span>Power (dB)</span>
      </div>
    </motion.div>
  )
}
