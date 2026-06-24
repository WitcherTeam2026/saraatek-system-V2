import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidPanel, LiquidMetric, RechartsAreaChart } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar, CreditCard } from 'lucide-react'
import type { RevenueAnalytics as RevenueAnalyticsType } from '../types'
import { mapError } from '../lib/mapError'

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

function formatCurrency(amount: number): string {
  return `LKR ${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
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

export function RevenueAnalytics() {
  const navigate = useAppStore((s) => s.navigate)
  const [data, setData] = useState<RevenueAnalyticsType | null>(null)
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
    api.reports.revenueAnalytics(startDate, endDate)
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
            <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">Revenue Analytics</h1>
            <p className="text-sm text-text-muted">Revenue trends, growth, and payment methods</p>
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
              label="Total Revenue"
              value={formatCurrency(data.monthly_trend.reduce((sum, m) => sum + m.amount, 0))}
              icon={<DollarSign size={16} />}
              color="text-emerald-400"
            />
            <LiquidMetric
              label="Monthly Average"
              value={formatCurrency(data.avg_monthly)}
              icon={<Calendar size={16} />}
              color="text-blue-400"
            />
            <LiquidMetric
              label="Growth Rate"
              value={`${data.growth_rate >= 0 ? '+' : ''}${data.growth_rate.toFixed(1)}%`}
              icon={data.growth_rate >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              color={data.growth_rate >= 0 ? 'text-emerald-400' : 'text-red-400'}
            />
            <LiquidMetric
              label="Best Month"
              value={data.best_month ? data.best_month.month : '—'}
              icon={<TrendingUp size={16} />}
              color="text-purple-400"
            />
          </motion.div>

          {/* Revenue Chart */}
          <motion.div variants={staggerItem}>
            <LiquidPanel title="Monthly Revenue Trend">
              {data.monthly_trend.length > 0 ? (
                <RechartsAreaChart
                  data={data.monthly_trend.map(m => ({ name: m.month, value: m.amount }))}
                  color="#10b981"
                  height={250}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-sm text-text-muted">No data available</div>
              )}
            </LiquidPanel>
          </motion.div>

          {/* Payment Methods */}
          <motion.div variants={staggerItem}>
            <LiquidPanel title="Revenue by Payment Method">
              {data.by_payment_method.length > 0 ? (
                <div className="space-y-3">
                  {data.by_payment_method.map((method) => {
                    const total = data.monthly_trend.reduce((sum, m) => sum + m.amount, 0)
                    const percentage = total > 0 ? (method.amount / total) * 100 : 0
                    return (
                      <div key={method.method} className="flex items-center gap-4">
                        <div className="flex items-center gap-2 w-32">
                          <CreditCard size={14} className="text-text-muted" />
                          <span className="text-sm text-text-primary capitalize">{method.method.replace('_', ' ')}</span>
                        </div>
                        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-purple"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-right w-32">
                          <span className="text-sm font-mono tabular-nums text-text-primary">{formatCurrency(method.amount)}</span>
                          <span className="text-xs text-text-muted ml-2">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-sm text-text-muted">No payment data</div>
              )}
            </LiquidPanel>
          </motion.div>
        </>
      ) : null}
    </motion.div>
  )
}

export default RevenueAnalytics
