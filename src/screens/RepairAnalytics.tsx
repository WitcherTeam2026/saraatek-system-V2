import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidPanel, LiquidMetric } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { ArrowLeft, Wrench, Clock, Smartphone, AlertTriangle } from 'lucide-react'
import type { RepairAnalytics as RepairAnalyticsType } from '../types'

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
  'Received': 'bg-blue-500',
  'Diagnosed': 'bg-amber-500',
  'Awaiting Approval': 'bg-orange-500',
  'Repairing': 'bg-purple-500',
  'Completed': 'bg-emerald-500',
  'Completed — Under Warranty': 'bg-emerald-500',
  'Cancelled': 'bg-red-500',
}

export function RepairAnalytics() {
  const navigate = useAppStore((s) => s.navigate)
  const [data, setData] = useState<RepairAnalyticsType | null>(null)
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
    api.reports.repairAnalytics(startDate, endDate)
      .then((r) => { if (mounted.current) setData(r) })
      .catch((e) => setError(String(e)))
      .finally(() => { if (mounted.current) setLoading(false) })
    return () => { mounted.current = false }
  }, [startDate, endDate])

  const maxBrandCount = data ? Math.max(...data.by_brand.map(b => b.count), 1) : 1
  const maxIssueCount = data ? Math.max(...data.common_issues.map(i => i.count), 1) : 1

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
            <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">Repair Analytics</h1>
            <p className="text-sm text-text-muted">Device brands, repair duration, and common issues</p>
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
              label="Total Repairs"
              value={data.total_repairs}
              icon={<Wrench size={16} />}
              color="text-blue-400"
            />
            <LiquidMetric
              label="Avg Duration"
              value={`${data.avg_duration_days.toFixed(1)} days`}
              icon={<Clock size={16} />}
              color="text-amber-400"
            />
            <LiquidMetric
              label="Device Types"
              value={data.by_device_type.length}
              icon={<Smartphone size={16} />}
              color="text-purple-400"
            />
            <LiquidMetric
              label="Unique Issues"
              value={data.common_issues.length}
              icon={<AlertTriangle size={16} />}
              color="text-red-400"
            />
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Top Brands */}
            <motion.div variants={staggerItem}>
              <LiquidPanel title="Top Brands">
                {data.by_brand.length > 0 ? (
                  <div className="space-y-3">
                    {data.by_brand.map((brand) => (
                      <div key={brand.brand} className="flex items-center gap-4">
                        <span className="text-sm text-text-primary w-24 truncate">{brand.brand}</span>
                        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${(brand.count / maxBrandCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono tabular-nums text-text-muted w-12 text-right">{brand.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-sm text-text-muted">No data</div>
                )}
              </LiquidPanel>
            </motion.div>

            {/* Device Types */}
            <motion.div variants={staggerItem}>
              <LiquidPanel title="Device Types">
                {data.by_device_type.length > 0 ? (
                  <div className="space-y-3">
                    {data.by_device_type.map((dt) => {
                      const total = data.by_device_type.reduce((sum, d) => sum + d.count, 0)
                      const percentage = total > 0 ? (dt.count / total) * 100 : 0
                      return (
                        <div key={dt.device_type} className="flex items-center gap-4">
                          <span className="text-sm text-text-primary w-24 truncate capitalize">{dt.device_type}</span>
                          <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-purple-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono tabular-nums text-text-muted w-16 text-right">{percentage.toFixed(1)}%</span>
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

          {/* Common Issues */}
          <motion.div variants={staggerItem}>
            <LiquidPanel title="Common Issues">
              {data.common_issues.length > 0 ? (
                <div className="space-y-3">
                  {data.common_issues.map((issue) => (
                    <div key={issue.issue} className="flex items-center gap-4">
                      <span className="text-sm text-text-primary flex-1 truncate">{issue.issue}</span>
                      <div className="w-48 h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: `${(issue.count / maxIssueCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono tabular-nums text-text-muted w-12 text-right">{issue.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-sm text-text-muted">No data</div>
              )}
            </LiquidPanel>
          </motion.div>

          {/* Status Distribution */}
          <motion.div variants={staggerItem}>
            <LiquidPanel title="Status Distribution">
              {data.by_status.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {data.by_status.map((status) => {
                    const total = data.by_status.reduce((sum, s) => sum + s.count, 0)
                    const percentage = total > 0 ? (status.count / total) * 100 : 0
                    const colorClass = statusColors[status.status] || 'bg-gray-500'
                    return (
                      <div key={status.status} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02]">
                        <div className={`w-2 h-2 rounded-full ${colorClass}`} />
                        <span className="text-xs text-text-primary">{status.status}</span>
                        <span className="text-xs font-mono tabular-nums text-text-muted">{status.count}</span>
                        <span className="text-[10px] text-text-muted">({percentage.toFixed(1)}%)</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-sm text-text-muted">No data</div>
              )}
            </LiquidPanel>
          </motion.div>
        </>
      ) : null}
    </motion.div>
  )
}

export default RepairAnalytics
