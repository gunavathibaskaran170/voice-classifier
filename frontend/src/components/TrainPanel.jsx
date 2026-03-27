import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

function MetricBadge({ label, value, unit = '%', color = '#00f0ff' }) {
  return (
    <div className="glass p-3 text-center rounded-xl">
      <div className="text-xs text-slate-500 font-mono mb-1">{label}</div>
      <div className="text-xl font-bold font-mono" style={{ color }}>
        {value}{unit}
      </div>
    </div>
  )
}

export default function TrainPanel() {
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get('/api/metrics')
      .then(r => setMetrics(r.data))
      .catch(() => setError('Run train.py first to see metrics.'))
  }, [])

  if (error) {
    return (
      <div className="glass p-4 text-sm text-slate-500 font-mono text-center">
        {error}
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="glass p-4 text-sm text-slate-500 font-mono text-center animate-pulse">
        Loading metrics...
      </div>
    )
  }

  const cm = metrics.confusion_matrix || [[0,0],[0,0]]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
        Model Performance
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-2 gap-2">
        <MetricBadge label="Accuracy" value={metrics.accuracy} color="#00ff88" />
        <MetricBadge label="Precision" value={metrics.precision} color="#00f0ff" />
        <MetricBadge label="Recall" value={metrics.recall} color="#bf00ff" />
        <MetricBadge label="F1 Score" value={metrics.f1} color="#ffb800" />
      </div>

      {/* Cross-val */}
      <div className="glass p-3 text-xs font-mono text-slate-400 space-y-1">
        <div className="text-slate-500">Cross-Validation (5-fold)</div>
        <div>
          <span style={{ color: '#00f0ff' }}>{metrics.cv_mean}%</span>
          <span className="text-slate-600"> ± {metrics.cv_std}%</span>
        </div>
      </div>

      {/* Confusion Matrix */}
      <div className="glass p-3 space-y-2">
        <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
          Confusion Matrix
        </div>
        <div className="grid grid-cols-3 gap-1 text-xs font-mono text-center">
          <div />
          <div className="text-slate-500 py-1">Pred Human</div>
          <div className="text-slate-500 py-1">Pred Machine</div>
          <div className="text-slate-500 flex items-center justify-end pr-2">Actual H</div>
          <div className="bg-green-500/10 border border-green-500/20 rounded p-2 text-green-400 font-bold">
            {cm[0][0]}
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded p-2 text-red-400">
            {cm[0][1]}
          </div>
          <div className="text-slate-500 flex items-center justify-end pr-2">Actual M</div>
          <div className="bg-red-500/10 border border-red-500/20 rounded p-2 text-red-400">
            {cm[1][0]}
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded p-2 text-green-400 font-bold">
            {cm[1][1]}
          </div>
        </div>
      </div>

      {/* Dataset + Model info */}
      <div className="glass p-3 text-xs font-mono space-y-1 text-slate-500">
        <div><span className="text-slate-400">Model:</span> {metrics.model}</div>
        <div>
          <span className="text-slate-400">Dataset:</span>{' '}
          Human: {metrics.dataset?.human ?? '?'} · Machine: {metrics.dataset?.machine ?? '?'}
        </div>
        <div><span className="text-slate-400">Features:</span> {metrics.feature_count} dimensions</div>
        <div>
          <span className="text-slate-400">Train/Test:</span>{' '}
          {metrics.train_samples} / {metrics.test_samples}
        </div>
      </div>
    </motion.div>
  )
}
