import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import WaveAnimation from './components/WaveAnimation'
import WaveBars from './components/WaveBars'
import ResultCard from './components/ResultCard'
import SpectrogramView from './components/SpectrogramView'
import RadarChartView from './components/RadarChart'
import TrainPanel from './components/TrainPanel'

const API = '/api'

// ── Tab IDs ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'upload', label: '📁 Upload File' },
  { id: 'record', label: '🎤 Live Record' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioURL, setAudioURL] = useState(null)
  const [showSidebar, setShowSidebar] = useState(true)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const recordedBlobRef = useRef(null)

  // ── File Upload ───────────────────────────────────────────────────────────────
  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) {
      setUploadedFile(accepted[0])
      setResult(null)
      setError(null)
      setAudioURL(URL.createObjectURL(accepted[0]))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/wav': ['.wav'] },
    multiple: false,
  })

  const handleUploadPredict = async () => {
    if (!uploadedFile) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', uploadedFile)
      const { data } = await axios.post(`${API}/predict/upload`, form)
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Prediction failed. Check backend.')
    } finally {
      setLoading(false)
    }
  }

  // ── Live Recording ────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      setError(null)
      setResult(null)
      setAudioURL(null)
      recordedBlobRef.current = null
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus' }
        : {}
      const mr = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mr

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        recordedBlobRef.current = blob
        setAudioURL(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
      }

      mr.start(100)
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(t => {
          if (t >= 9) {
            stopRecording()
            return t
          }
          return t + 1
        })
      }, 1000)
    } catch (e) {
      setError('Microphone access denied. Please allow mic permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      clearInterval(timerRef.current)
      setIsRecording(false)
      setRecordingTime(0)
    }
  }

  const handleRecordPredict = async () => {
    if (!recordedBlobRef.current) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', recordedBlobRef.current, 'recording.webm')
      const { data } = await axios.post(`${API}/predict/record`, form)
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Prediction failed. Check backend.')
    } finally {
      setLoading(false)
    }
  }

  const predClass = result
    ? (result.class_id === 0 ? 'human' : 'machine')
    : null

  return (
    <div className="min-h-screen grid-bg relative overflow-hidden">
      {/* 3D Background */}
      <div className="fixed inset-0 z-0" style={{ height: '100vh' }}>
        <WaveAnimation isActive={isRecording || loading} predictionClass={predClass} />
      </div>

      {/* Gradient overlays */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,240,255,0.06) 0%, transparent 70%)',
        }} />
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 80% 100%, rgba(191,0,255,0.05) 0%, transparent 70%)',
        }} />

      {/* Layout */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* ── NAVBAR ── */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-white/5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, #00f0ff22, #bf00ff22)', border: '1px solid #00f0ff44' }}>
              🎙️
            </div>
            <div>
              <div className="text-sm font-bold neon-text font-mono tracking-wider">VoiceID</div>
              <div className="text-xs text-slate-600">Human vs AI Classifier</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <StatusDot />
            <button
              onClick={() => setShowSidebar(s => !s)}
              className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 glass rounded-lg"
            >
              {showSidebar ? 'Hide' : 'Show'} Stats
            </button>
          </motion.div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 flex gap-0 overflow-hidden">

          {/* Center Panel */}
          <div className="flex-1 flex flex-col items-center justify-start p-6 overflow-y-auto">

            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-8 mt-4"
            >
              <h1 className="text-4xl font-bold mb-2"
                style={{
                  background: 'linear-gradient(135deg, #00f0ff, #bf00ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                Voice Authenticity Detector
              </h1>
              <p className="text-slate-500 text-sm font-mono">
                Classify audio as <span className="text-green-400">Human Voice</span> or{' '}
                <span className="text-red-400">AI-Generated Voice</span> using XGBoost + Random Forest
              </p>
            </motion.div>

            {/* Tab Switcher */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex gap-1 p-1 rounded-xl mb-6 w-full max-w-md"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setResult(null); setError(null) }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  style={activeTab === tab.id ? {
                    background: 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(191,0,255,0.15))',
                    border: '1px solid rgba(0,240,255,0.3)',
                    boxShadow: '0 0 20px rgba(0,240,255,0.1)',
                  } : {}}
                >
                  {tab.label}
                </button>
              ))}
            </motion.div>

            {/* Input Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-lg space-y-4"
            >
              <AnimatePresence mode="wait">
                {activeTab === 'upload' ? (
                  <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <UploadTab
                      getRootProps={getRootProps}
                      getInputProps={getInputProps}
                      isDragActive={isDragActive}
                      uploadedFile={uploadedFile}
                      audioURL={audioURL}
                      loading={loading}
                      onPredict={handleUploadPredict}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="record" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <RecordTab
                      isRecording={isRecording}
                      recordingTime={recordingTime}
                      audioURL={audioURL}
                      hasRecording={!!recordedBlobRef.current}
                      loading={loading}
                      onStart={startRecording}
                      onStop={stopRecording}
                      onPredict={handleRecordPredict}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 rounded-xl text-sm font-mono text-red-400"
                    style={{ background: 'rgba(255,45,85,0.08)', border: '1px solid rgba(255,45,85,0.2)' }}
                  >
                    ⚠️ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass p-6 flex flex-col items-center gap-3"
                  >
                    <WaveBars isActive color="#00f0ff" barCount={20} />
                    <div className="text-sm font-mono text-slate-400 animate-pulse">
                      Extracting features & analyzing...
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result */}
              {!loading && result && (
                <div className="space-y-4">
                  <ResultCard result={result} />
                  <SpectrogramView data={result.spectrogram} />
                  <RadarChartView data={result.radar} isHuman={result.class_id === 0} />
                </div>
              )}
            </motion.div>
          </div>

          {/* ── SIDEBAR ── */}
          <AnimatePresence>
            {showSidebar && (
              <motion.aside
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                className="w-80 border-l border-white/5 p-5 overflow-y-auto hidden md:block"
                style={{ background: 'rgba(0,0,0,0.3)' }}
              >
                <TrainPanel />

                {/* How it works */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-5 glass p-4 space-y-3"
                >
                  <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                    Feature Pipeline
                  </div>
                  {[
                    ['MFCC', '40 coefficients × mean+std = 80D'],
                    ['Mel Spectrogram', '128 bands × mean+std = 256D'],
                    ['Chroma', '12 bins × mean+std = 24D'],
                    ['Spectral Contrast', '7 bands × mean+std = 14D'],
                    ['Pitch (F0)', 'mean + std via pYIN = 2D'],
                    ['Tonnetz', '6 dims × mean+std = 12D'],
                    ['ZCR + RMS', '2D each = 4D'],
                  ].map(([name, desc]) => (
                    <div key={name} className="flex gap-2 text-xs">
                      <span className="text-cyan-400 font-mono shrink-0">{name}</span>
                      <span className="text-slate-600">{desc}</span>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-white/5 text-xs font-mono">
                    <span className="text-slate-500">Total: </span>
                    <span className="text-cyan-400">~394 dimensions</span>
                  </div>
                </motion.div>

                {/* Decision guide */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-4 glass p-4 space-y-2"
                >
                  <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
                    Decision Thresholds
                  </div>
                  <div className="text-xs font-mono space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-green-400">≥ 85%</span>
                      <span className="text-slate-500">High Confidence</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-amber-400">65–85%</span>
                      <span className="text-slate-500">Needs Review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-red-400">&lt; 65%</span>
                      <span className="text-slate-500">Uncertain</span>
                    </div>
                  </div>
                </motion.div>
              </motion.aside>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="text-center py-3 text-xs text-slate-700 font-mono border-t border-white/5">
          VoiceID · XGBoost + RF Ensemble · MFCC · Mel Spectrogram · Pitch · Chroma
        </footer>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UploadTab({ getRootProps, getInputProps, isDragActive, uploadedFile, audioURL, loading, onPredict }) {
  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className="glass p-8 text-center cursor-pointer transition-all duration-300 rounded-2xl"
        style={{
          border: isDragActive
            ? '2px dashed #00f0ff'
            : '2px dashed rgba(255,255,255,0.1)',
          boxShadow: isDragActive ? '0 0 30px rgba(0,240,255,0.2)' : 'none',
        }}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">{isDragActive ? '📂' : '📁'}</div>
        <div className="text-sm font-medium text-slate-300">
          {isDragActive ? 'Drop it here!' : 'Drag & drop a .wav file'}
        </div>
        <div className="text-xs text-slate-600 mt-1">or click to browse</div>
      </div>

      {uploadedFile && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-3 flex items-center justify-between text-xs font-mono"
        >
          <span className="text-cyan-400 truncate">🎵 {uploadedFile.name}</span>
          <span className="text-slate-500 shrink-0 ml-2">
            {(uploadedFile.size / 1024).toFixed(0)} KB
          </span>
        </motion.div>
      )}

      {audioURL && (
        <audio controls src={audioURL} className="w-full rounded-xl" style={{ filter: 'invert(0.85) hue-rotate(180deg)' }} />
      )}

      <button
        onClick={onPredict}
        disabled={!uploadedFile || loading}
        className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {loading ? '⏳ Analyzing...' : '🔍 Analyze Voice'}
      </button>
    </div>
  )
}

function RecordTab({ isRecording, recordingTime, audioURL, hasRecording, loading, onStart, onStop, onPredict }) {
  return (
    <div className="space-y-4">
      <div className="glass p-8 flex flex-col items-center gap-4 rounded-2xl">
        <WaveBars isActive={isRecording} color={isRecording ? '#ff2d55' : '#00f0ff'} barCount={28} />

        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs font-mono text-red-400"
          >
            ● REC {recordingTime}s / 9s max
          </motion.div>
        )}

        {!isRecording ? (
          <button
            onClick={onStart}
            disabled={loading}
            className="btn-record disabled:opacity-30"
          >
            ⏺️ Start Recording
          </button>
        ) : (
          <button
            onClick={onStop}
            className="btn-record recording"
          >
            ⏹️ Stop Recording
          </button>
        )}

        <div className="text-xs text-slate-600 font-mono text-center">
          Speak clearly for 3–9 seconds · WAV format preferred
        </div>
      </div>

      {audioURL && !isRecording && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <audio controls src={audioURL} className="w-full rounded-xl" style={{ filter: 'invert(0.85) hue-rotate(180deg)' }} />
          <button
            onClick={onPredict}
            disabled={!hasRecording || loading}
            className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Analyzing...' : '🔍 Analyze Recording'}
          </button>
        </motion.div>
      )}
    </div>
  )
}

function StatusDot() {
  const [online, setOnline] = useState(null)

  useEffect(() => {
    axios.get('/api/health')
      .then(r => setOnline(r.data.model_loaded))
      .catch(() => setOnline(false))
  }, [])

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <div
        className={`w-2 h-2 rounded-full ${online === true ? 'bg-green-400' : online === false ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'}`}
        style={{ boxShadow: online === true ? '0 0 6px #00ff88' : '' }}
      />
      <span className="text-slate-500">
        {online === true ? 'Model Ready' : online === false ? 'No Model' : 'Connecting...'}
      </span>
    </div>
  )
}
