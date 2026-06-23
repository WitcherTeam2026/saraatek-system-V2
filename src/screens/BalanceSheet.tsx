import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidPanel, LiquidMetric } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { ArrowLeft, Landmark, CreditCard, Scale } from 'lucide-react'
import type { BalanceSheetReport } from '../types'

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

export function BalanceSheet() {
  const navigate = useAppStore((s) => s.navigate)
  const [report, setReport] = useState<BalanceSheetReport | null>(null)
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!asOfDate) return
    mounted.current = true
    setLoading(true)
    api.accounting.getBalanceSheet(asOfDate)
      .then((r) => { if (mounted.current) setReport(r) })
      .catch((e) => setError(String(e)))
      .finally(() => { if (mounted.current) setLoading(false) })
    return () => { mounted.current = false }
  }, [asOfDate])

  const isBalanced = report ? Math.abs(report.total_assets - (report.total_liabilities + report.total_equity)) < 0.01 : true

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
            <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">Balance Sheet</h1>
            <p className="text-sm text-text-muted">Assets = Liabilities + Equity</p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">As of</span>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-text-primary"
          />
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
              label="Total Assets"
              value={formatCurrency(report.total_assets)}
              icon={<Landmark size={16} />}
              color="text-blue-400"
            />
            <LiquidMetric
              label="Total Liabilities"
              value={formatCurrency(report.total_liabilities)}
              icon={<CreditCard size={16} />}
              color="text-red-400"
            />
            <LiquidMetric
              label="Total Equity"
              value={formatCurrency(report.total_equity)}
              icon={<Scale size={16} />}
              color="text-purple-400"
            />
          </motion.div>

          {/* Balance Sheet */}
          <motion.div variants={staggerItem}>
            <LiquidPanel title={`Balance Sheet — As of ${asOfDate}`}>
              <div className="grid grid-cols-2 gap-8">
                {/* Assets */}
                <div>
                  <h3 className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-3">Assets</h3>
                  {report.assets.length === 0 ? (
                    <p className="text-sm text-text-muted pl-4">No assets recorded</p>
                  ) : (
                    <div className="space-y-1">
                      {report.assets.map((item) => (
                        <div key={item.code} className="flex items-center justify-between py-2 px-4 rounded-lg hover:bg-white/[0.02]">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-text-muted w-12">{item.code}</span>
                            <span className="text-sm text-text-primary">{item.name}</span>
                          </div>
                          <span className="text-sm font-mono tabular-nums text-blue-400">{formatCurrency(item.balance)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between py-2 px-4 border-t border-white/5">
                        <span className="text-sm font-semibold text-text-primary">Total Assets</span>
                        <span className="text-sm font-mono font-semibold tabular-nums text-blue-400">{formatCurrency(report.total_assets)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Liabilities */}
                <div>
                  <h3 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-3">Liabilities</h3>
                  {report.liabilities.length === 0 ? (
                    <p className="text-sm text-text-muted pl-4">No liabilities recorded</p>
                  ) : (
                    <div className="space-y-1">
                      {report.liabilities.map((item) => (
                        <div key={item.code} className="flex items-center justify-between py-2 px-4 rounded-lg hover:bg-white/[0.02]">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-text-muted w-12">{item.code}</span>
                            <span className="text-sm text-text-primary">{item.name}</span>
                          </div>
                          <span className="text-sm font-mono tabular-nums text-red-400">{formatCurrency(item.balance)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between py-2 px-4 border-t border-white/5">
                        <span className="text-sm font-semibold text-text-primary">Total Liabilities</span>
                        <span className="text-sm font-mono font-semibold tabular-nums text-red-400">{formatCurrency(report.total_liabilities)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Equity */}
              <div className="mt-6 pt-6 border-t border-white/5">
                <h3 className="text-xs font-medium text-purple-400 uppercase tracking-wider mb-3">Equity</h3>
                {report.equity.length === 0 ? (
                  <p className="text-sm text-text-muted pl-4">No equity recorded</p>
                ) : (
                  <div className="space-y-1">
                    {report.equity.map((item) => (
                      <div key={item.code} className="flex items-center justify-between py-2 px-4 rounded-lg hover:bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-text-muted w-12">{item.code}</span>
                          <span className="text-sm text-text-primary">{item.name}</span>
                        </div>
                        <span className="text-sm font-mono tabular-nums text-purple-400">{formatCurrency(item.balance)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-2 px-4 border-t border-white/5">
                      <span className="text-sm font-semibold text-text-primary">Total Equity</span>
                      <span className="text-sm font-mono font-semibold tabular-nums text-purple-400">{formatCurrency(report.total_equity)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Balance Check */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className={`flex items-center justify-between py-3 px-4 rounded-xl ${isBalanced ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <div className="flex items-center gap-3">
                    <Scale size={18} className={isBalanced ? 'text-emerald-400' : 'text-red-400'} />
                    <span className="text-sm font-semibold text-text-primary">
                      {isBalanced ? 'Balance Sheet is Balanced' : 'Balance Sheet is NOT Balanced'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-text-muted uppercase tracking-wider block">Assets</span>
                      <span className="text-sm font-mono tabular-nums text-blue-400">{formatCurrency(report.total_assets)}</span>
                    </div>
                    <span className="text-text-muted">=</span>
                    <div className="text-right">
                      <span className="text-[10px] text-text-muted uppercase tracking-wider block">L + E</span>
                      <span className="text-sm font-mono tabular-nums text-purple-400">{formatCurrency(report.total_liabilities + report.total_equity)}</span>
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

export default BalanceSheet
