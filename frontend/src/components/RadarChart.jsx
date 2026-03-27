import { motion } from 'framer-motion'
import {
  RadarChart as ReRadar,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const AXIS_LABELS = {
  mfcc_energy: 'MFCC Energy',
  pitch_stability: 'Pitch Stability',
  spectral_brightness: 'Brightness',
  zcr_level: 'ZCR',
  rms_energy: 'RMS Energy',
  chroma_consistency: 'Chroma',
}

export default function RadarChartView({ data, isHuman }) {
  if (!data || Object.keys(data).length === 0) return null

  const chartData = Object.entries(data).map(([key, value]) => ({
    axis: AXIS_LABELS[key] || key,
    value: Math.max(0, Math.min(100, value)),
    fullMark: 100,
  }))

  const color = isHuman ? '#00ff88' : '#ff2d55'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.0, duration: 0.5 }}
      className="glass p-4 space-y-2"
    >
      <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
        Voice Fingerprint
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ReRadar data={chartData} outerRadius="70%">
          <PolarGrid stroke="rgba(255,255,255,0.06)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          />
          <Tooltip
            contentStyle={{
              background: '#0a0a1a',
              border: `1px solid ${color}44`,
              borderRadius: 8,
              fontSize: 11,
              fontFamily: 'JetBrains Mono',
              color: '#e2e8f0',
            }}
            formatter={(v) => [`${v}`, 'Score']}
          />
          <Radar
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.15}
            strokeWidth={2}
            style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
          />
        </ReRadar>
      </ResponsiveContainer>
      <p className="text-xs text-slate-600 font-mono text-center">
        AI voices typically show high brightness + low pitch stability
      </p>
    </motion.div>
  )
}
