import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidPanel } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { ArrowLeft } from 'lucide-react'
import type { JournalEntryWithItems } from '../types'

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

export function JournalDetail() {
  const navigate = useAppStore((s) => s.navigate)
  const selectedEntryId = useAppStore((s) => s.selectedEntryId)
  const [entry, setEntry] = useState<JournalEntryWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedEntryId) { setLoading(false); return }
    mounted.current = true
    setLoading(true)
    api.accounting.getJournalEntry(selectedEntryId)
      .then((r) => { if (mounted.current) setEntry(r) })
      .catch((e) => setError(String(e)))
      .finally(() => { if (mounted.current) setLoading(false) })
    return () => { mounted.current = false }
  }, [selectedEntryId])

  const totalDebit = entry?.items.reduce((sum, i) => sum + i.debit, 0) ?? 0
  const totalCredit = entry?.items.reduce((sum, i) => sum + i.credit, 0) ?? 0

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
          onClick={() => navigate('ledger')}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={18} className="text-text-muted" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">Journal Entry</h1>
          <p className="text-sm text-text-muted">Transaction details</p>
        </div>
      </motion.div>

      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map((i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
          ))}
        </div>
      ) : !entry ? (
        <div className="h-64 flex items-center justify-center text-sm text-text-muted">
          Journal entry not found
        </div>
      ) : (
        <>
          {/* Entry Info */}
          <motion.div variants={staggerItem}>
            <LiquidPanel title="Entry Information">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Date</label>
                  <span className="text-sm text-text-primary">{entry.entry.entry_date}</span>
                </div>
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Description</label>
                  <span className="text-sm text-text-primary">{entry.entry.description}</span>
                </div>
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Source</label>
                  <span className="text-sm text-text-primary capitalize">{entry.entry.source_type || 'Manual'}</span>
                </div>
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Created</label>
                  <span className="text-sm text-text-primary">{entry.entry.created_at}</span>
                </div>
              </div>
            </LiquidPanel>
          </motion.div>

          {/* Journal Items */}
          <motion.div variants={staggerItem}>
            <LiquidPanel title="Journal Items">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Account</th>
                      <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Note</th>
                      <th className="text-right py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Debit</th>
                      <th className="text-right py-2.5 text-[11px] font-medium text-text-muted uppercase tracking-wider">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.items.map((item) => (
                      <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-text-muted">{item.account_code}</span>
                            <span className="text-sm text-text-primary">{item.account_name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-text-muted text-xs">{item.note || '—'}</td>
                        <td className="py-3 pr-3 text-right font-mono text-xs tabular-nums text-blue-400">
                          {item.debit > 0 ? formatCurrency(item.debit) : '—'}
                        </td>
                        <td className="py-3 text-right font-mono text-xs tabular-nums text-amber-400">
                          {item.credit > 0 ? formatCurrency(item.credit) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/10">
                      <td colSpan={2} className="py-3 pr-3 text-sm font-semibold text-text-primary">Total</td>
                      <td className="py-3 pr-3 text-right font-mono text-sm font-semibold tabular-nums text-blue-400">{formatCurrency(totalDebit)}</td>
                      <td className="py-3 text-right font-mono text-sm font-semibold tabular-nums text-amber-400">{formatCurrency(totalCredit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Balance Check */}
              <div className={`mt-4 flex items-center justify-between py-2 px-4 rounded-lg ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                <span className="text-xs font-medium text-text-primary">
                  {Math.abs(totalDebit - totalCredit) < 0.01 ? 'Entry is balanced' : 'Entry is NOT balanced'}
                </span>
                <span className="text-xs font-mono text-text-muted">
                  Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                </span>
              </div>
            </LiquidPanel>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}

export default JournalDetail
