import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidPanel, LiquidMetric } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { ArrowLeft, ShieldCheck, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { WarrantyAnalytics as WarrantyAnalyticsType } from '../types'
import { mapError } from '../lib/mapError'

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

function getPresetRange(preset: string): { start: string; end: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  switch (preset) {
    case 'this_month':
      return {
        start: `${year}-${String(month + 1).padStart(2, '0')}-01`,
        end: now.toISOString().split('T')[0],
      }
    case 'last_month': {
      const lastMonth = month === 0 ? 11 : month - 1
      const lastYear = month === 0 ? year - 1 : year
      const daysInLastMonth = new Date(lastYear, lastMonth + 1, 0).getDate()
      return {
        start: `${lastYear}-${String(lastMonth + 1).padStart(2, '0')}-01`,
        end: `${lastYear}-${String(lastMonth + 1).padStart(2, '0')}-${daysInLastMonth}`,
      }
    }
    case 'this_quarter': {
      const quarterStart = Math.floor(month / 3) * 3
      return {
        start: `${year}-${String(quarterStart + 1).padStart(2, '0')}-01`,
        end: now.toISOString().split('T')[0],
      }
    }
    case 'this_year':
      return { start: `${year}-01-01`, end: now.toISOString().split('T')[0] }
    case 'last_year':
      return { start: `${year - 1}-01-01`, end: `${year - 1}-12-31` }
    default:
      return { start: now.toISOString().split('T')[0], end: now.toISOString().split('T')[0] }
  }
}

const statusColors: Record<string, string> = {
  'Active': 'bg-emerald-500',
  'Expired': 'bg-red-500',
}

export function WarrantyAnalytics() {
  const navigate = useAppStore((s) => s.navigate)
  const [data, setData] = useState<WarrantyAnalyticsType | null>(null)
  const [preset, setPreset] = useState('this_year')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const range = getPresetRange(preset)
    setStartDate(range.start)
    setEndDate(range.end)
  }, [preset])

  useEffect(() => {
    if (!startDate || !endDate) return
    mounted.current = true
    setLoading(true)
    api.reports.warrantyAnalytics(startDate, endDate)
      .then((r) => { if (mounted.current) setData(r) })
      .catch((e) => setError(mapError(e)))
      .finally(() => { if (mounted.current) setLoading(false) })
    return () => { mounted.current = false }
  }, [startDate, endDate])

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('analytics')}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={18} className="text-text-muted" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">Warranty Analytics</h1>
            <p className="text-sm text-text-muted">Warranty claims, coverage, and duration</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['this_month', 'last_month', 'this_quarter', 'this_year', 'last_year'].map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                preset === p
                  ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30'
                  : 'text-text-muted hover:bg-white/5 border border-transparent'
              }`}
            >
              {p.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      </motion.div>

      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      {loading ? (
        <motion.div variants={staggerItem} className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
          ))}
        </motion.div>
      ) : data ? (
        <>
          {/* Metrics */}
          <motion.div variants={staggerItem} className="grid grid-cols-4 gap-4">
            <LiquidMetric
              label="Total Warranties"
              value={data.total_warranties}
              icon={<ShieldCheck size={16} />}
              color="text-blue-400"
            />
            <LiquidMetric
              label="Active"
              value={data.active_warranties}
              icon={<CheckCircle2 size={16} />}
              color="text-emerald-400"
            />
            <LiquidMetric
              label="Claims"
              value={data.claims}
              icon={<AlertTriangle size={16} />}
              color="text-amber-400"
            />
            <LiquidMetric
              label="Avg Duration"
              value={`${data.avg_warranty_duration_days.toFixed(0)} days`}
              icon={<Clock size={16} />}
              color="text-purple-400"
            />
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Claim Rate */}
            <motion.div variants={staggerItem}>
              <LiquidPanel title="Claim Rate">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 128 128" className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke={data.claim_rate > 20 ? '#ef4444' : data.claim_rate > 10 ? '#f59e0b' : '#10b981'}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(data.claim_rate / 100) * 351.86} 351.86`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-mono font-bold tabular-nums text-text-primary">{data.claim_rate.toFixed(1)}%</div>
                        <div className="text-[10px] text-text-muted uppercase tracking-wider">Claim Rate</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-xs text-text-muted">
                      {data.claim_rate > 20 ? 'High claim rate — investigate' : data.claim_rate > 10 ? 'Moderate claim rate' : 'Low claim rate — healthy'}
                    </p>
                  </div>
                </div>
              </LiquidPanel>
            </motion.div>

            {/* Warranty Status */}
            <motion.div variants={staggerItem}>
              <LiquidPanel title="Warranty Status">
                {data.by_status.length > 0 ? (
                  <div className="space-y-4">
                    {data.by_status.map((status) => {
                      const total = data.by_status.reduce((sum, s) => sum + s.count, 0)
                      const percentage = total > 0 ? (status.count / total) * 100 : 0
                      const colorClass = statusColors[status.status] || 'bg-gray-500'
                      return (
                        <div key={status.status}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${colorClass}`} />
                              <span className="text-sm text-text-primary">{status.status}</span>
                            </div>
                            <span className="text-sm font-mono tabular-nums text-text-muted">{status.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${colorClass}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-sm text-text-muted">No data</div>
                )}
              </LiquidPanel>
            </motion.div>
          </div>

          {/* Summary */}
          <motion.div variants={staggerItem}>
            <LiquidPanel title="Summary">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center py-4">
                  <div className="text-2xl font-mono font-bold tabular-nums text-blue-400">{data.total_warranties}</div>
                  <div className="text-xs text-text-muted mt-1">Total Issued</div>
                </div>
                <div className="text-center py-4">
                  <div className="text-2xl font-mono font-bold tabular-nums text-emerald-400">{data.active_warranties}</div>
                  <div className="text-xs text-text-muted mt-1">Currently Active</div>
                </div>
                <div className="text-center py-4">
                  <div className="text-2xl font-mono font-bold tabular-nums text-red-400">{data.expired_warranties}</div>
                  <div className="text-xs text-text-muted mt-1">Expired</div>
                </div>
                <div className="text-center py-4">
                  <div className="text-2xl font-mono font-bold tabular-nums text-amber-400">{data.claims}</div>
                  <div className="text-xs text-text-muted mt-1">Claims Made</div>
                </div>
              </div>
            </LiquidPanel>
          </motion.div>
        </>
      ) : null}
    </motion.div>
  )
}

export default WarrantyAnalytics
