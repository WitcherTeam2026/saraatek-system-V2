import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidButton, LiquidPanel } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { Account, AccountBalance } from '../types'

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

export function OpeningBalances() {
  const navigate = useAppStore((s) => s.navigate)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [balances, setBalances] = useState<AccountBalance[]>([])
  const [hasExisting, setHasExisting] = useState(false)
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [values, setValues] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const mounted = useRef(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    mounted.current = true
    setLoading(true)
    Promise.all([
      api.accounting.listAccounts().catch(() => []),
      api.accounting.getBalances().catch(() => []),
      api.accounting.hasOpeningBalances().catch(() => false),
    ]).then(([a, b, existing]) => {
      if (!mounted.current) return
      setAccounts(a)
      setBalances(b)
      setHasExisting(existing)
      // Pre-fill existing balances
      const initial: Record<number, string> = {}
      b.forEach((bal) => {
        if (bal.balance !== 0) {
          initial[bal.account_id] = String(bal.balance)
        }
      })
      setValues(initial)
      setLoading(false)
    })
    return () => { mounted.current = false }
  }, [])

  const handleChange = (accountId: number, value: string) => {
    setValues((prev) => ({ ...prev, [accountId]: value }))
  }

  const totalDebits = Object.entries(values).reduce((sum, [id, val]) => {
    const account = accounts.find((a) => a.id === Number(id))
    const num = parseFloat(val) || 0
    if (account && ['asset', 'cogs', 'expense'].includes(account.account_type) && num > 0) {
      return sum + num
    }
    if (account && !['asset', 'cogs', 'expense'].includes(account.account_type) && num < 0) {
      return sum + Math.abs(num)
    }
    return sum
  }, 0)

  const totalCredits = Object.entries(values).reduce((sum, [id, val]) => {
    const account = accounts.find((a) => a.id === Number(id))
    const num = parseFloat(val) || 0
    if (account && ['asset', 'cogs', 'expense'].includes(account.account_type) && num < 0) {
      return sum + Math.abs(num)
    }
    if (account && !['asset', 'cogs', 'expense'].includes(account.account_type) && num > 0) {
      return sum + num
    }
    return sum
  }, 0)

  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

  const handleSave = async () => {
    const items = Object.entries(values)
      .filter(([, val]) => val && parseFloat(val) !== 0)
      .map(([id, val]) => ({
        account_id: Number(id),
        balance: parseFloat(val) || 0,
      }))

    if (items.length === 0) {
      setError('No balances to save')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.accounting.saveOpeningBalances(items, entryDate)
      setSuccess('Opening balances saved successfully')
      setHasExisting(true)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete opening balances? This cannot be undone.')) return
    setSaving(true)
    setError('')
    try {
      await api.accounting.deleteOpeningBalances()
      setHasExisting(false)
      setValues({})
      setSuccess('Opening balances deleted')
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
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
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('accounting')}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={18} className="text-text-muted" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">Opening Balances</h1>
            <p className="text-sm text-text-muted">Set starting balances for each account</p>
          </div>
        </div>
      </motion.div>

      {error && <ErrorBanner message={error} onClose={() => setError('')} />}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
        >
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span className="text-sm text-emerald-400">{success}</span>
        </motion.div>
      )}

      {hasExisting && (
        <motion.div variants={staggerItem} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle size={16} className="text-amber-400" />
          <span className="text-sm text-amber-400">Opening balances already recorded. Delete and re-enter to change.</span>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Date */}
          <motion.div variants={staggerItem} className="flex items-center gap-4">
            <span className="text-sm text-text-muted">Entry Date:</span>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              disabled={hasExisting}
              className="text-sm px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-text-primary disabled:opacity-50"
            />
          </motion.div>

          {/* Balance Inputs */}
          <motion.div variants={staggerItem}>
            <LiquidPanel title="Enter Balances">
              <div className="space-y-6">
                {typeOrder.map((type) => {
                  const items = grouped[type]
                  if (!items || items.length === 0) return null
                  return (
                    <div key={type}>
                      <h3 className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-3">{typeLabels[type]}</h3>
                      <div className="space-y-2">
                        {items.map((account) => {
                          const existingBalance = balances.find((b) => b.account_id === account.id)?.balance ?? 0
                          return (
                            <div key={account.id} className="flex items-center gap-4 py-2 px-4 rounded-lg hover:bg-white/[0.02]">
                              <span className="text-xs font-mono text-text-muted w-12">{account.code}</span>
                              <span className="text-sm text-text-primary flex-1">{account.name}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-text-muted">LKR</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={values[account.id] ?? ''}
                                  onChange={(e) => handleChange(account.id, e.target.value)}
                                  disabled={hasExisting}
                                  placeholder="0.00"
                                  className="w-32 text-right text-sm px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-text-primary font-mono tabular-nums disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-brand-purple/30"
                                />
                              </div>
                              {existingBalance !== 0 && (
                                <span className="text-[10px] text-text-muted w-20 text-right">
                                  Current: {formatCurrency(existingBalance)}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Totals */}
              <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Total Debits</span>
                  <span className="font-mono tabular-nums text-blue-400">{formatCurrency(totalDebits)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Total Credits</span>
                  <span className="font-mono tabular-nums text-amber-400">{formatCurrency(totalCredits)}</span>
                </div>
                <div className={`flex items-center justify-between text-sm py-2 px-3 rounded-lg ${isBalanced ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  <span className="font-medium text-text-primary">Difference</span>
                  <span className={`font-mono font-medium tabular-nums ${isBalanced ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(Math.abs(totalDebits - totalCredits))}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center gap-3">
                <LiquidButton
                  onClick={handleSave}
                  loading={saving}
                  disabled={hasExisting || !isBalanced}
                >
                  Save Opening Balances
                </LiquidButton>
                {hasExisting && (
                  <LiquidButton
                    onClick={handleDelete}
                    loading={saving}
                    variant="danger"
                  >
                    Delete & Re-enter
                  </LiquidButton>
                )}
              </div>
            </LiquidPanel>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}

export default OpeningBalances
