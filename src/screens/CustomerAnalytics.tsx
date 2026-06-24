import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidPanel, LiquidMetric } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { ArrowLeft, Users, UserPlus, Repeat, TrendingUp } from 'lucide-react'
import type { CustomerAnalytics as CustomerAnalyticsType } from '../types'
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

export function CustomerAnalytics() {
  const navigate = useAppStore((s) => s.navigate)
  const [data, setData] = useState<CustomerAnalyticsType | null>(null)
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
    api.reports.customerAnalytics(startDate, endDate)
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
            <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">Customer Analytics</h1>
            <p className="text-sm text-text-muted">Customer retention, repeat rate, and top customers</p>
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
              label="Total Customers"
              value={data.total_customers}
              icon={<Users size={16} />}
              color="text-blue-400"
            />
            <LiquidMetric
              label="New Customers"
              value={data.new_customers}
              icon={<UserPlus size={16} />}
              color="text-emerald-400"
            />
            <LiquidMetric
              label="Repeat Rate"
              value={`${data.repeat_rate.toFixed(1)}%`}
              icon={<Repeat size={16} />}
              color="text-purple-400"
            />
            <LiquidMetric
              label="Avg Repairs/Customer"
              value={data.avg_repairs_per_customer.toFixed(2)}
              icon={<TrendingUp size={16} />}
              color="text-amber-400"
            />
          </motion.div>

          {/* Top Customers */}
          <motion.div variants={staggerItem}>
            <LiquidPanel title="Top Customers by Spending">
              {data.top_customers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">#</th>
                        <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Name</th>
                        <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Phone</th>
                        <th className="text-right py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Repairs</th>
                        <th className="text-right py-2.5 text-[11px] font-medium text-text-muted uppercase tracking-wider">Total Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_customers.map((customer, i) => (
                        <tr key={customer.phone} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 pr-3 text-text-muted text-xs">{i + 1}</td>
                          <td className="py-3 pr-3 text-text-primary text-sm font-medium">{customer.name}</td>
                          <td className="py-3 pr-3 text-text-secondary text-xs">{customer.phone}</td>
                          <td className="py-3 pr-3 text-right font-mono text-xs tabular-nums text-blue-400">{customer.repair_count}</td>
                          <td className="py-3 text-right font-mono text-xs tabular-nums text-emerald-400">{formatCurrency(customer.total_spent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-sm text-text-muted">No customer data</div>
              )}
            </LiquidPanel>
          </motion.div>

          {/* Customer Breakdown */}
          <motion.div variants={staggerItem}>
            <LiquidPanel title="Customer Breakdown">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold tabular-nums text-blue-400">{data.total_customers}</div>
                  <div className="text-xs text-text-muted mt-1">Total Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold tabular-nums text-emerald-400">{data.repeat_customers}</div>
                  <div className="text-xs text-text-muted mt-1">Repeat Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold tabular-nums text-purple-400">{data.repeat_rate.toFixed(1)}%</div>
                  <div className="text-xs text-text-muted mt-1">Retention Rate</div>
                </div>
              </div>
            </LiquidPanel>
          </motion.div>
        </>
      ) : null}
    </motion.div>
  )
}

export default CustomerAnalytics
