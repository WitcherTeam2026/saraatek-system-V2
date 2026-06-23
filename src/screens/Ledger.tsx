import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidPanel } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { ArrowLeft } from 'lucide-react'
import type { Account, LedgerEntry, AccountBalance } from '../types'

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

export function Ledger() {
  const navigate = useAppStore((s) => s.navigate)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [balances, setBalances] = useState<AccountBalance[]>([])
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null)
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingLedger, setLoadingLedger] = useState(false)
  const mounted = useRef(true)
  const [error, setError] = useState('')

  useEffect(() => {
    mounted.current = true
    setLoading(true)
    Promise.all([
      api.accounting.listAccounts().catch(() => []),
      api.accounting.getBalances().catch(() => []),
    ]).then(([a, b]) => {
      if (!mounted.current) return
      setAccounts(a)
      setBalances(b)
      setLoading(false)
    })
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (!selectedAccount) { setLedgerEntries([]); return }
    setLoadingLedger(true)
    api.accounting.getLedger(selectedAccount, startDate || undefined, endDate || undefined)
      .then((entries) => { if (mounted.current) setLedgerEntries(entries) })
      .catch((e) => setError(String(e)))
      .finally(() => { if (mounted.current) setLoadingLedger(false) })
  }, [selectedAccount, startDate, endDate])

  const getBalance = (accountId: number) => {
    const b = balances.find((b) => b.account_id === accountId)
    return b?.balance ?? 0
  }

  const accountTypeColors: Record<string, string> = {
    asset: 'text-blue-400',
    liability: 'text-red-400',
    equity: 'text-purple-400',
    income: 'text-emerald-400',
    cogs: 'text-amber-400',
    expense: 'text-orange-400',
  }

  const grouped = accounts.reduce((acc, a) => {
    if (!acc[a.account_type]) acc[a.account_type] = []
    acc[a.account_type].push(a)
    return acc
  }, {} as Record<string, Account[]>)

  const typeOrder = ['asset', 'liability', 'equity', 'income', 'cogs', 'expense']
  const typeLabels: Record<string, string> = {
    asset: 'Assets',
    liability: 'Liabilities',
    equity: 'Equity',
    income: 'Income',
    cogs: 'Cost of Goods Sold',
    expense: 'Expenses',
  }

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
          onClick={() => navigate('accounting')}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={18} className="text-text-muted" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">Ledger</h1>
          <p className="text-sm text-text-muted">View account transaction history</p>
        </div>
      </motion.div>

      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      <div className="grid grid-cols-12 gap-6">
        {/* Account List */}
        <motion.div variants={staggerItem} className="col-span-4">
          <LiquidPanel title="Chart of Accounts">
            {loading ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
                ))}
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {typeOrder.map((type) => {
                  const items = grouped[type]
                  if (!items || items.length === 0) return null
                  return (
                    <div key={type}>
                      <h3 className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2 px-2">
                        {typeLabels[type]}
                      </h3>
                      <div className="space-y-0.5">
                        {items.map((account) => {
                          const balance = getBalance(account.id)
                          const isSelected = selectedAccount === account.id
                          return (
                            <button
                              key={account.id}
                              onClick={() => setSelectedAccount(account.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                                isSelected
                                  ? 'bg-brand-purple/10 border border-brand-purple/20'
                                  : 'hover:bg-white/[0.02] border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-text-muted w-10">{account.code}</span>
                                <span className="text-sm text-text-primary">{account.name}</span>
                              </div>
                              <span className={`text-xs font-mono tabular-nums ${accountTypeColors[type]}`}>
                                {balance >= 0 ? formatCurrency(balance) : `(${formatCurrency(balance)})`}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </LiquidPanel>
        </motion.div>

        {/* Ledger View */}
        <motion.div variants={staggerItem} className="col-span-8">
          <LiquidPanel
            title={selectedAccount ? `Account Ledger — ${accounts.find((a) => a.id === selectedAccount)?.name || ''}` : 'Select an account'}
            action={
              selectedAccount ? (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-text-primary"
                  />
                  <span className="text-text-muted text-xs">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-text-primary"
                  />
                </div>
              ) : undefined
            }
          >
            {!selectedAccount ? (
              <div className="h-64 flex items-center justify-center text-sm text-text-muted">
                Select an account from the left to view its ledger
              </div>
            ) : loadingLedger ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
                ))}
              </div>
            ) : ledgerEntries.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-text-muted">
                No transactions found for this period
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Date</th>
                      <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Description</th>
                      <th className="text-right py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Debit</th>
                      <th className="text-right py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Credit</th>
                      <th className="text-right py-2.5 text-[11px] font-medium text-text-muted uppercase tracking-wider">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerEntries.map((entry, i) => (
                      <tr
                        key={i}
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => navigate('journal-detail', { entryId: entry.entry_id })}
                      >
                        <td className="py-3 pr-3 text-text-secondary text-xs tabular-nums">{entry.date}</td>
                        <td className="py-3 pr-3 text-text-primary text-sm">{entry.description}</td>
                        <td className="py-3 pr-3 text-right font-mono text-xs tabular-nums text-blue-400">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                        </td>
                        <td className="py-3 pr-3 text-right font-mono text-xs tabular-nums text-amber-400">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                        </td>
                        <td className={`py-3 text-right font-mono text-xs tabular-nums ${entry.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {entry.balance >= 0 ? formatCurrency(entry.balance) : `(${formatCurrency(entry.balance)})`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </LiquidPanel>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Ledger
