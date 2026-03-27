import { motion, AnimatePresence } from 'framer-motion'
import ConfidenceRing from './ConfidenceRing'

const TIER_CONFIG = {
  high: {
    label: '✅ High Confidence',
    bg: 'tier-high-bg',
    border: 'border-green-500/20',
    text: 'tier-high',
    icon: '✅',
  },
  review: {
    label: '❓ Needs Review',
    bg: 'tier-review-bg',
    border: 'border-amber-500/20',
    text: 'tier-review',
    icon: '❓',
  },
  uncertain: {
    label: '⚠️ Uncertain',
    bg: 'tier-uncertain-bg',
    border: 'border-red-500/20',
    text: 'tier-uncertain',
    icon: '⚠️',
  },
}

export default function ResultCard({ result, audioInfo }) {
  if (!result) return null

  const { prediction, icon, confidence, probabilities, decision, audio_info } = result
  const tier = TIER_CONFIG[decision.tier_code] || TIER_CONFIG.high
  const isHuman = result.class_id === 0

  return (
    <AnimatePresence>
      <motion.div
        key="result-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-strong p-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            Analysis Result
          </span>
          {audio_info && (
            <span className="text-xs font-mono text-slate-500">
              {audio_info.duration_sec}s · {audio_info.sample_rate}Hz
            </span>
          )}
        </div>

        {/* Main Prediction */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex flex-col items-center py-4 gap-2"
        >
          <motion.div
            className="text-7xl"
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {icon}
          </motion.div>
          <h2 className={`text-2xl font-bold mt-2 ${isHuman ? 'text-green-400' : 'text-red-400'}`}>
            {prediction}
          </h2>
        </motion.div>

        {/* Confidence Ring + Bar */}
        <div className="flex items-center justify-around flex-wrap gap-4">
          <ConfidenceRing
            confidence={confidence}
            tierCode={decision.tier_code}
            label={decision.tier}
          />

          {/* Probability Bars */}
          <div className="flex flex-col gap-3 flex-1 min-w-[160px]">
            <ProbBar label="Human 🧑" value={probabilities.human} color="#00ff88" />
            <ProbBar label="Machine 🤖" value={probabilities.machine} color="#ff2d55" />
          </div>
        </div>

        {/* Decision Tier Banner */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`rounded-xl p-4 border ${tier.bg} ${tier.border}`}
        >
          <div className={`text-sm font-bold mb-1 ${tier.text}`}>{tier.label}</div>
          <div className="text-xs text-slate-400">{decision.message}</div>
        </motion.div>

        {/* Threshold Guide */}
        <div className="text-xs text-slate-600 font-mono space-y-1 pt-1 border-t border-white/5">
          <div className="text-slate-500 mb-1">Confidence Thresholds:</div>
          <div><span className="text-green-500">≥ 85%</span> → High Confidence</div>
          <div><span className="text-amber-500">65–85%</span> → Needs Review</div>
          <div><span className="text-red-500">&lt; 65%</span> → Uncertain</div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function ProbBar({ label, value, color }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-slate-400">{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}80` }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
        />
      </div>
    </div>
  )
}
