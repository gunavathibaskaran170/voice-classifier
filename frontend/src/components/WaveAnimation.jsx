import { useEffect, useRef } from 'react'

export default function WaveAnimation({ isActive = false, predictionClass = null }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  const colorRGB = predictionClass === 'human'
    ? '0, 255, 136'
    : predictionClass === 'machine'
    ? '255, 45, 85'
    : '0, 240, 255'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const waves = Array.from({ length: 4 }, (_, i) => ({
      amplitude: 40 + i * 20,
      frequency: 0.008 - i * 0.001,
      speed: 0.4 + i * 0.15,
      offset: i * Math.PI * 0.5,
      opacity: 0.06 - i * 0.01,
    }))

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.4 + 0.1,
    }))

    let t = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const speed = isActive ? 2 : 1
      const amp = isActive ? 1.6 : 1
      t += 0.008 * speed

      waves.forEach(w => {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(${colorRGB}, ${w.opacity})`
        ctx.lineWidth = 1.5
        for (let x = 0; x <= canvas.width; x += 4) {
          const y =
            canvas.height / 2 +
            Math.sin(x * w.frequency + t * w.speed + w.offset) * w.amplitude * amp +
            Math.sin(x * w.frequency * 0.5 + t * w.speed * 0.7) * w.amplitude * 0.4 * amp
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
      })

      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${colorRGB}, ${p.opacity})`
        ctx.fill()
      })

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [isActive, colorRGB])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  )
}
