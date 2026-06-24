import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidPanel, LiquidMetric } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import type { ProfitLossReport } from '../types'
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
  return `LKR ${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

export function ProfitLoss() {
  const navigate = useAppStore((s) => s.navigate)
  const [report, setReport] = useState<ProfitLossReport | null>(null)
  const [preset, setPreset] = useState('this_month')
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
    api.accounting.getProfitLoss(startDate, endDate)
      .then((r) => { if (mounted.current) setReport(r) })
      .catch((e) => setError(mapError(e)))
      .finally(() => { if (mounted.current) setLoading(false) })
    return () => { mounted.current = false }
  }, [startDate, endDate])

  const profitMargin = report && report.total_revenue > 0
    ? ((report.gross_profit / report.total_revenue) * 100).toFixed(1)
    : '0.0'

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
            onClick={() => navigate('accounting')}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={18} className="text-text-muted" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">Profit & Loss</h1>
            <p className="text-sm text-text-muted">Revenue minus cost of goods sold</p>
          </div>
        </div>

        {/* Period Selector */}
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

      {/* Metrics */}
      {loading ? (
        <motion.div variants={staggerItem} className="grid grid-cols-3 gap-6">
          {[1,2,3].map((i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
          ))}
        </motion.div>
      ) : report ? (
        <>
          <motion.div variants={staggerItem} className="grid grid-cols-3 gap-6">
            <LiquidMetric
              label="Total Revenue"
              value={formatCurrency(report.total_revenue)}
              icon={<TrendingUp size={16} />}
              color="text-emerald-400"
            />
            <LiquidMetric
              label="Cost of Parts"
              value={formatCurrency(report.total_cogs)}
              icon={<TrendingDown size={16} />}
              color="text-amber-400"
            />
            <LiquidMetric
              label="Gross Profit"
              value={formatCurrency(report.gross_profit)}
              icon={report.gross_profit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              color={report.gross_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}
            />
          </motion.div>

          {/* P&L Statement */}
          <motion.div variants={staggerItem}>
            <LiquidPanel title={`P&L Statement — ${startDate} to ${endDate}`}>
              <div className="space-y-6">
                {/* Revenue Section */}
                <div>
                  <h3 className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-3">Revenue</h3>
                  {report.revenue.length === 0 ? (
                    <p className="text-sm text-text-muted pl-4">No revenue recorded</p>
                  ) : (
                    <div className="space-y-1">
                      {report.revenue.map((item) => (
                        <div key={item.code} className="flex items-center justify-between py-2 px-4 rounded-lg hover:bg-white/[0.02]">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-text-muted w-12">{item.code}</span>
                            <span className="text-sm text-text-primary">{item.name}</span>
                          </div>
                          <span className="text-sm font-mono tabular-nums text-emerald-400">{formatCurrency(item.balance)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between py-2 px-4 border-t border-white/5">
                        <span className="text-sm font-medium text-text-primary">Total Revenue</span>
                        <span className="text-sm font-mono font-medium tabular-nums text-emerald-400">{formatCurrency(report.total_revenue)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* COGS Section */}
                <div>
                  <h3 className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-3">Cost of Goods Sold</h3>
                  {report.cogs.length === 0 ? (
                    <p className="text-sm text-text-muted pl-4">No parts cost recorded</p>
                  ) : (
                    <div className="space-y-1">
                      {report.cogs.map((item) => (
                        <div key={item.code} className="flex items-center justify-between py-2 px-4 rounded-lg hover:bg-white/[0.02]">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-text-muted w-12">{item.code}</span>
                            <span className="text-sm text-text-primary">{item.name}</span>
                          </div>
                          <span className="text-sm font-mono tabular-nums text-amber-400">{formatCurrency(item.balance)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between py-2 px-4 border-t border-white/5">
                        <span className="text-sm font-medium text-text-primary">Total COGS</span>
                        <span className="text-sm font-mono font-medium tabular-nums text-amber-400">{formatCurrency(report.total_cogs)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Gross Profit */}
                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.02]">
                    <span className="text-base font-semibold text-text-primary">Gross Profit</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-text-muted">Margin: {profitMargin}%</span>
                      <span className={`text-lg font-mono font-bold tabular-nums ${report.gross_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {report.gross_profit >= 0 ? '' : '-'}{formatCurrency(report.gross_profit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </LiquidPanel>
          </motion.div>
        </>
      ) : null}
    </motion.div>
  )
}

export default ProfitLoss
