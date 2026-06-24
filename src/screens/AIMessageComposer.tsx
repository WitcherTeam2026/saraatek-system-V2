import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidButton, LiquidPanel } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { ArrowLeft, Copy, RefreshCw, MessageSquare, Mail } from 'lucide-react'
import type { RepairWithCustomer } from '../types'
import { mapError } from '../lib/mapError'

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

export function AIMessageComposer() {
  const navigate = useAppStore((s) => s.navigate)
  const selectedRepairId = useAppStore((s) => s.selectedRepairId)
  const [repairs, setRepairs] = useState<RepairWithCustomer[]>([])
  const [selectedRepair, setSelectedRepair] = useState<string>(selectedRepairId || '')
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp')
  const [mode, setMode] = useState<'template' | 'custom'>('template')
  const [customGoal, setCustomGoal] = useState('')
  const [generatedMessage, setGeneratedMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingRepairs, setLoadingRepairs] = useState(true)
  const mounted = useRef(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    mounted.current = true
    api.repairs.list({ sort_by: 'received_at', sort_order: 'desc' })
      .then((r) => { if (mounted.current) setRepairs(r.slice(0, 50)) })
      .catch(() => {})
      .finally(() => { if (mounted.current) setLoadingRepairs(false) })
    return () => { mounted.current = false }
  }, [])

  const handleGenerate = async () => {
    if (!selectedRepair) return
    setLoading(true)
    setError('')
    setGeneratedMessage('')
    try {
      const result = await api.ai.draftMessage(
        selectedRepair,
        mode,
        channel,
        mode === 'custom' ? customGoal : undefined
      )
      setGeneratedMessage(result)
    } catch (e) {
      setError(mapError(e))
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectedRepairData = repairs.find((r) => r.repair.id === selectedRepair)

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center gap-4">
        <button
          onClick={() => navigate('dashboard')}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={18} className="text-text-muted" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">AI Message Composer</h1>
          <p className="text-sm text-text-muted">Draft messages to customers using AI</p>
        </div>
      </motion.div>

      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      <div className="grid grid-cols-12 gap-6">
        {/* Settings Panel */}
        <motion.div variants={staggerItem} className="col-span-5">
          <LiquidPanel title="Message Settings">
            <div className="space-y-4">
              {/* Repair Selection */}
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Select Repair</label>
                {loadingRepairs ? (
                  <div className="h-10 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
                ) : (
                  <select
                    value={selectedRepair}
                    onChange={(e) => setSelectedRepair(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30"
                  >
                    <option value="">Select a repair...</option>
                    {repairs.map((r) => (
                      <option key={r.repair.id} value={r.repair.id}>
                        {r.repair.id} — {r.customer_name} ({r.repair.brand} {r.repair.model || ''})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Channel */}
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Channel</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChannel('whatsapp')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                      channel === 'whatsapp'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-text-muted border border-transparent hover:bg-white/10'
                    }`}
                  >
                    <MessageSquare size={14} />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => setChannel('email')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                      channel === 'email'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-white/5 text-text-muted border border-transparent hover:bg-white/10'
                    }`}
                  >
                    <Mail size={14} />
                    Email
                  </button>
                </div>
              </div>

              {/* Mode */}
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('template')}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      mode === 'template'
                        ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30'
                        : 'bg-white/5 text-text-muted border border-transparent hover:bg-white/10'
                    }`}
                  >
                    Ready Collection
                  </button>
                  <button
                    onClick={() => setMode('custom')}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      mode === 'custom'
                        ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30'
                        : 'bg-white/5 text-text-muted border border-transparent hover:bg-white/10'
                    }`}
                  >
                    Custom Goal
                  </button>
                </div>
              </div>

              {/* Custom Goal Input */}
              {mode === 'custom' && (
                <div>
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">What should the message say?</label>
                  <textarea
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="e.g. Inform customer about delay, request additional info..."
                    className="w-full px-3 py-2 rounded-lg text-sm text-text-primary placeholder:text-text-muted/60 bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30 resize-none h-24"
                  />
                </div>
              )}

              {/* Repair Info */}
              {selectedRepairData && (
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Repair Context</h4>
                  <div className="space-y-1 text-xs">
                    <p className="text-text-primary"><span className="text-text-muted">Customer:</span> {selectedRepairData.customer_name}</p>
                    <p className="text-text-primary"><span className="text-text-muted">Device:</span> {selectedRepairData.repair.brand} {selectedRepairData.repair.model || 'N/A'}</p>
                    <p className="text-text-primary"><span className="text-text-muted">Status:</span> {selectedRepairData.repair.status}</p>
                    <p className="text-text-primary"><span className="text-text-muted">Problem:</span> {selectedRepairData.repair.reported_problem}</p>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <LiquidButton
                onClick={handleGenerate}
                loading={loading}
                disabled={!selectedRepair}
                className="w-full"
              >
                {loading ? 'Generating...' : 'Generate Message'}
              </LiquidButton>
            </div>
          </LiquidPanel>
        </motion.div>

        {/* Generated Message */}
        <motion.div variants={staggerItem} className="col-span-7">
          <LiquidPanel
            title="Generated Message"
            action={
              generatedMessage ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:bg-white/5 transition-colors"
                  >
                    <Copy size={12} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:bg-white/5 transition-colors"
                  >
                    <RefreshCw size={12} />
                    Regenerate
                  </button>
                </div>
              ) : undefined
            }
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-brand-purple/30 border-t-brand-purple rounded-full animate-spin mb-4" />
                <p className="text-sm text-text-muted">AI is drafting your message...</p>
              </div>
            ) : generatedMessage ? (
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                <pre className="text-sm text-text-primary whitespace-pre-wrap font-sans leading-relaxed">
                  {generatedMessage}
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  {channel === 'whatsapp' ? (
                    <MessageSquare size={20} className="text-emerald-400" />
                  ) : (
                    <Mail size={20} className="text-blue-400" />
                  )}
                </div>
                <p className="text-sm text-text-muted mb-1">Select a repair and click Generate</p>
                <p className="text-xs text-text-muted/60">AI will draft a message based on the repair context</p>
              </div>
            )}
          </LiquidPanel>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default AIMessageComposer
