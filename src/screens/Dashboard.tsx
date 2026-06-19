import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { StatusBadge } from '../components/StatusBadge'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { ErrorBanner } from '../components/ErrorBanner'
import type { RepairWithCustomer } from '../types'

export function Dashboard() {
  const navigate = useAppStore((s) => s.navigate)
  const [counts, setCounts] = useState({ open_repairs: 0, awaiting_approval: 0, repairing: 0, ready_for_collection: 0 })
  const [recentRepairs, setRecentRepairs] = useState<RepairWithCustomer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<RepairWithCustomer[] | null>(null)
  const mounted = useRef(true)
  const [error, setError] = useState('')

  useEffect(() => {
    mounted.current = true
    api.repairs.dashboardCounts().then((c) => { if (mounted.current) setCounts(c) }).catch((e) => setError('Failed to load counts: ' + String(e)))
    api.repairs.list({ sort_by: 'received_at', sort_order: 'desc' }).then((r) => { if (mounted.current) setRecentRepairs(r.slice(0, 10)) }).catch((e) => setError('Failed to load repairs: ' + String(e)))
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults(null); return }
    const timer = setTimeout(() => {
      api.repairs.list({ search: searchQuery }).then((r) => { if (mounted.current) setSearchResults(r) }).catch((e) => setError('Search failed: ' + String(e)))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const countCards = [
    { label: 'Open Repairs', value: counts.open_repairs, color: 'text-blue-400' },
    { label: 'Awaiting Approval', value: counts.awaiting_approval, color: 'text-amber-400' },
    { label: 'Repairing', value: counts.repairing, color: 'text-brand-purple' },
    { label: 'Ready for Collection', value: counts.ready_for_collection, color: 'text-purple-400' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <Button onClick={() => navigate('new-repair-step1')}>+ New Repair</Button>
      </div>
      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      <div className="grid grid-cols-4 gap-4">
        {countCards.map((card) => (
          <Card key={card.label}>
            <div className="text-sm text-text-secondary">{card.label}</div>
            <div className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</div>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Input
          placeholder="Search by Repair ID or phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchResults && (
          <div className="absolute z-10 mt-1 w-full bg-bg-elevated border border-border-default rounded-xl shadow-xl max-h-60 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-3 text-sm text-text-muted">No results found</div>
            ) : (
              searchResults.map((r: RepairWithCustomer) => (
                <button
                  key={r.repair.id}
                  onClick={() => navigate('repair-detail', { repairId: r.repair.id })}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-surface transition-colors text-left"
                >
                  <div>
                    <span className="text-sm font-medium text-text-primary">{r.repair.id}</span>
                    <span className="text-sm text-text-secondary ml-2">{r.customer_name}</span>
                  </div>
                  <StatusBadge status={r.repair.status} />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Repairs</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-muted border-b border-border-default">
              <th className="text-left py-2 font-medium">Repair ID</th>
              <th className="text-left py-2 font-medium">Customer</th>
              <th className="text-left py-2 font-medium">Device</th>
              <th className="text-left py-2 font-medium">Status</th>
              <th className="text-left py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {recentRepairs.map((r) => (
              <tr
                key={r.repair.id}
                onClick={() => navigate('repair-detail', { repairId: r.repair.id })}
                className="border-b border-border-default hover:bg-bg-elevated/50 cursor-pointer transition-colors"
              >
                <td className="py-3 font-medium text-text-primary">{r.repair.id}</td>
                <td className="py-3 text-text-secondary">{r.customer_name}</td>
                <td className="py-3 text-text-secondary">{r.repair.brand} {r.repair.model}</td>
                <td className="py-3"><StatusBadge status={r.repair.status} /></td>
                <td className="py-3 text-text-muted">{r.repair.received_at?.split(' ')[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
