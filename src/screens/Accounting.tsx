import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidPanel, LiquidMetric } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { BookOpen, TrendingUp, Scale, Settings, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { AccountBalance } from '../types'

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

export function Accounting() {
  const navigate = useAppStore((s) => s.navigate)
  const [balances, setBalances] = useState<AccountBalance[]>([])
  const [hasOpening, setHasOpening] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.accounting.getBalances().catch(() => []),
      api.accounting.hasOpeningBalances().catch(() => true),
    ]).then(([b, has]) => {
      setBalances(b)
      setHasOpening(has)
      setLoading(false)
    })
  }, [])

  const cash = balances.find((b) => b.code === '1000')?.balance ?? 0
  const bank = balances.find((b) => b.code === '1100')?.balance ?? 0
  const inventory = balances.find((b) => b.code === '1300')?.balance ?? 0
  const receivable = balances.find((b) => b.code === '1200')?.balance ?? 0
  const payable = balances.find((b) => b.code === '2000')?.balance ?? 0
  const equity = balances.find((b) => b.code === '3000')?.balance ?? 0
  const revenue = balances.find((b) => b.code === '4000')?.balance ?? 0
  const cogs = balances.find((b) => b.code === '5000')?.balance ?? 0

  const totalAssets = cash + bank + inventory + receivable
  const totalLiabilities = payable
  const totalEquity = equity + (revenue - cogs)

  const menuItems = [
    {
      icon: <BookOpen size={20} />,
      title: 'Ledger',
      description: 'View account transaction history',
      color: 'text-blue-400',
      onClick: () => navigate('ledger'),
    },
    {
      icon: <TrendingUp size={20} />,
      title: 'Profit & Loss',
      description: 'Revenue minus cost of goods sold',
      color: 'text-emerald-400',
      onClick: () => navigate('profit-loss'),
    },
    {
      icon: <Scale size={20} />,
      title: 'Balance Sheet',
      description: 'Assets = Liabilities + Equity',
      color: 'text-purple-400',
      onClick: () => navigate('balance-sheet'),
    },
    {
      icon: <Settings size={20} />,
      title: 'Opening Balances',
      description: 'Set starting account balances',
      color: 'text-amber-400',
      onClick: () => navigate('opening-balances'),
    },
  ]

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">Accounting</h1>
        <p className="text-sm text-text-muted">Double-entry bookkeeping for your repair shop</p>
      </motion.div>

      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      {/* Warning if no opening balances */}
      {!loading && !hasOpening && (
        <motion.div variants={staggerItem} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle size={16} className="text-amber-400" />
          <span className="text-sm text-amber-400">Set opening balances before recording transactions.</span>
          <button
            onClick={() => navigate('opening-balances')}
            className="ml-auto text-xs text-amber-400 hover:text-amber-300 underline"
          >
            Set now
          </button>
        </motion.div>
      )}

      {/* Quick Balances */}
      {loading ? (
        <motion.div variants={staggerItem} className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
          ))}
        </motion.div>
      ) : (
        <motion.div variants={staggerItem} className="grid grid-cols-4 gap-4">
          <LiquidMetric label="Cash" value={formatCurrency(cash)} color="text-blue-400" />
          <LiquidMetric label="Bank" value={formatCurrency(bank)} color="text-blue-400" />
          <LiquidMetric label="Inventory" value={formatCurrency(inventory)} color="text-blue-400" />
          <LiquidMetric label="Payable" value={formatCurrency(payable)} color="text-red-400" />
        </motion.div>
      )}

      {/* Menu */}
      <motion.div variants={staggerItem}>
        <LiquidPanel title="Modules">
          <div className="grid grid-cols-2 gap-4">
            {menuItems.map((item) => (
              <button
                key={item.title}
                onClick={item.onClick}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.02] transition-all border border-transparent hover:border-white/5 text-left group"
              >
                <div className={`p-3 rounded-xl bg-white/5 ${item.color}`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-text-primary group-hover:text-brand-purple transition-colors">{item.title}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{item.description}</p>
                </div>
                <ArrowRight size={16} className="text-text-muted group-hover:text-brand-purple transition-colors" />
              </button>
            ))}
          </div>
        </LiquidPanel>
      </motion.div>

      {/* Balance Summary */}
      {!loading && (
        <motion.div variants={staggerItem}>
          <LiquidPanel title="Balance Summary">
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-[10px] font-medium text-blue-400 uppercase tracking-wider mb-2">Assets</h3>
                <div className="text-2xl font-mono font-bold tabular-nums text-blue-400">{formatCurrency(totalAssets)}</div>
              </div>
              <div>
                <h3 className="text-[10px] font-medium text-red-400 uppercase tracking-wider mb-2">Liabilities</h3>
                <div className="text-2xl font-mono font-bold tabular-nums text-red-400">{formatCurrency(totalLiabilities)}</div>
              </div>
              <div>
                <h3 className="text-[10px] font-medium text-purple-400 uppercase tracking-wider mb-2">Equity</h3>
                <div className="text-2xl font-mono font-bold tabular-nums text-purple-400">{formatCurrency(totalEquity)}</div>
              </div>
            </div>
            <div className={`mt-4 pt-4 border-t border-white/5 flex items-center gap-2 ${Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? 'text-emerald-400' : 'text-red-400'}`}>
              {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? (
                <>
                  <CheckCircle2 size={14} />
                  <span className="text-xs">Balance Sheet is balanced</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={14} />
                  <span className="text-xs">Balance Sheet is out of balance by {formatCurrency(Math.abs(totalAssets - (totalLiabilities + totalEquity)))}</span>
                </>
              )}
            </div>
          </LiquidPanel>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Accounting
