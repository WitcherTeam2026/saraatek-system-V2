import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { StatusBadge } from '../components/StatusBadge'
import { LiquidMetric, LiquidPanel, RechartsAreaChart, LiquidButton } from '../components/liquid'
import { EmptyState } from '../components/EmptyState'
import { ErrorBanner } from '../components/ErrorBanner'
import { Plus, Search, Wrench, Clock, AlertTriangle, CheckCircle2, ArrowRight, TrendingUp, CalendarDays, ShieldCheck } from 'lucide-react'
import type { RepairWithCustomer } from '../types'

function toDateStr(d: Date) { return d.toISOString().split('T')[0] }

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

interface MonthlyData {
  month: string
  amount: number
}

export function Dashboard() {
  const navigate = useAppStore((s) => s.navigate)
  const [counts, setCounts] = useState({ open_repairs: 0, awaiting_approval: 0, repairing: 0, ready_for_collection: 0 })
  const [recentRepairs, setRecentRepairs] = useState<RepairWithCustomer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<RepairWithCustomer[] | null>(null)
  const [revenueToday, setRevenueToday] = useState<number | null>(null)
  const [revenueMonth, setRevenueMonth] = useState<number | null>(null)
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyData[]>([])
  const [warrantyCount, setWarrantyCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)
  const [error, setError] = useState('')

  useEffect(() => {
    mounted.current = true; setLoading(true)
    Promise.all([
      api.repairs.dashboardCounts().catch((e) => { setError('Counts failed: ' + String(e)); return null }),
      api.repairs.list({ sort_by: 'received_at', sort_order: 'desc' }).catch(() => []),
    ]).then(([c, r]) => {
      if (!mounted.current) return
      if (c) setCounts(c)
      setRecentRepairs((r as RepairWithCustomer[]).slice(0, 10))
      setLoading(false)
    })

    const today = toDateStr(new Date())
    const monthStart = toDateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

    api.reports.summary(today, today, false).then((r) => { if (mounted.current) setRevenueToday(r.revenue.total) }).catch(() => {})
    api.reports.summary(monthStart, today, false).then((r) => {
      if (mounted.current) {
        setRevenueMonth(r.revenue.total)
        if (r.revenue.monthly && Array.isArray(r.revenue.monthly)) {
          setMonthlyRevenue(r.revenue.monthly.map((m: { month: string; amount: number }) => ({
            month: m.month,
            amount: m.amount,
          })))
        }
      }
    }).catch(() => {})

    api.repairs.list({ status: ['Completed — Under Warranty'] }).then((r) => { if (mounted.current) setWarrantyCount(r.length) }).catch(() => {})

    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults(null); return }
    const timer = setTimeout(() => {
      api.repairs.list({ search: searchQuery }).then((r) => { if (mounted.current) setSearchResults(r) }).catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Header - no card, just typography */}
      <motion.div variants={staggerItem} className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text-primary tracking-tighter font-display">
            Dashboard
          </h1>
          <p className="text-sm text-text-muted mt-1">What requires your attention right now</p>
        </div>
        <LiquidButton icon={<Plus size={16} />} onClick={() => navigate('new-repair-step1')}>
          New Repair
        </LiquidButton>
      </motion.div>

      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      {/* Metrics Row - fluid, no cards */}
      {loading ? (
        <motion.div variants={staggerItem} className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
          ))}
        </motion.div>
      ) : (
        <motion.div variants={staggerItem} className="grid grid-cols-4 gap-6">
          <LiquidMetric
            label="Open"
            value={counts.open_repairs}
            icon={<Wrench size={16} />}
            color="text-blue-400"
          />
          <LiquidMetric
            label="Awaiting"
            value={counts.awaiting_approval}
            icon={<Clock size={16} />}
            color="text-amber-400"
          />
          <LiquidMetric
            label="Repairing"
            value={counts.repairing}
            icon={<AlertTriangle size={16} />}
            color="text-brand-purple"
          />
          <LiquidMetric
            label="Ready"
            value={counts.ready_for_collection}
            icon={<CheckCircle2 size={16} />}
            color="text-emerald-400"
          />
        </motion.div>
      )}

      {/* Revenue Section - glass panel */}
      <motion.div variants={staggerItem} className="grid grid-cols-12 gap-6">
        {/* Revenue metrics - left side */}
        <div className="col-span-5 grid grid-rows-3 gap-4">
          <LiquidMetric
            label="Revenue Today"
            value={revenueToday === null ? '—' : `LKR ${revenueToday.toLocaleString()}`}
            icon={<TrendingUp size={16} />}
            color="text-emerald-400"
          />
          <LiquidMetric
            label="Revenue This Month"
            value={revenueMonth === null ? '—' : `LKR ${revenueMonth.toLocaleString()}`}
            icon={<CalendarDays size={16} />}
            color="text-blue-400"
          />
          <LiquidMetric
            label="Active Warranties"
            value={warrantyCount}
            icon={<ShieldCheck size={16} />}
            color="text-brand-purple"
          />
        </div>

        {/* Revenue chart - right side */}
        <div className="col-span-7">
          <LiquidPanel title="Revenue Trend">
            {monthlyRevenue.length > 0 ? (
              <RechartsAreaChart data={monthlyRevenue.map(m => ({ name: m.month, value: m.amount }))} color="#7C4DFF" height={160} />
            ) : (
              <div className="h-40 flex items-center justify-center text-sm text-text-muted">No data available</div>
            )}
          </LiquidPanel>
        </div>
      </motion.div>

      {/* Search - full width */}
      <motion.div variants={staggerItem} className="relative">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10" />
          <input
            placeholder="Search by Repair ID or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl pl-11 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          />
        </div>
        {searchResults && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-20 mt-2 w-full rounded-xl overflow-hidden"
            style={{
              background: 'rgba(20, 20, 22, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {searchResults.length === 0 ? (
              <div className="p-4 text-sm text-text-muted text-center">No results found</div>
            ) : (
              searchResults.map((r) => (
                <button
                  key={r.repair.id}
                  onClick={() => navigate('repair-detail', { repairId: r.repair.id })}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                >
                  <div>
                    <span className="text-sm font-medium text-text-primary">{r.repair.id}</span>
                    <span className="text-sm text-text-secondary ml-3">{r.customer_name}</span>
                  </div>
                  <StatusBadge status={r.repair.status} />
                </button>
              ))
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Recent Repairs - clean table without card border */}
      <motion.div variants={staggerItem}>
        <LiquidPanel
          title="Recent Repairs"
          action={
            <button
              onClick={() => navigate('repairs-list')}
              className="text-xs text-brand-purple hover:text-brand-purple-hover font-medium inline-flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </button>
          }
        >
          {recentRepairs.length === 0 ? (
            <EmptyState
              title="No repairs yet"
              description="Create your first repair to begin tracking devices."
              action={
                <LiquidButton size="sm" icon={<Plus size={13} />} onClick={() => navigate('new-repair-step1')}>
                  New Repair
                </LiquidButton>
              }
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Repair ID</th>
                  <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Customer</th>
                  <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Device</th>
                  <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Status</th>
                  <th className="text-left py-2.5 text-[11px] font-medium text-text-muted uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentRepairs.map((r) => (
                  <tr
                    key={r.repair.id}
                    onClick={() => navigate('repair-detail', { repairId: r.repair.id })}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="py-3 pr-3 font-medium text-text-primary text-sm tabular-nums">{r.repair.id}</td>
                    <td className="py-3 pr-3 text-text-secondary text-sm">{r.customer_name}</td>
                    <td className="py-3 pr-3 text-text-secondary text-sm">{r.repair.brand} {r.repair.model}</td>
                    <td className="py-3 pr-3"><StatusBadge status={r.repair.status} /></td>
                    <td className="py-3 text-text-muted text-xs">{r.repair.received_at?.split(' ')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </LiquidPanel>
      </motion.div>
    </motion.div>
  )
}
