import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { StatusBadge } from '../components/StatusBadge'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { ErrorBanner } from '../components/ErrorBanner'
import type { RepairWithCustomer } from '../types'

const statusFilters = [
  { value: '', label: 'All Statuses' },
  { value: 'Received', label: 'Received' },
  { value: 'Awaiting Approval', label: 'Awaiting Approval' },
  { value: 'Repairing', label: 'Repairing' },
  { value: 'Ready for Collection', label: 'Ready for Collection' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Declined', label: 'Declined' },
  { value: 'Cancelled', label: 'Cancelled' },
]

export function RepairsList() {
  const navigate = useAppStore((s) => s.navigate)
  const [repairs, setRepairs] = useState<RepairWithCustomer[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)
  const [error, setError] = useState('')

  const loadRepairs = async () => {
    setLoading(true)
    try {
      const data = await api.repairs.list({
        search: search || undefined,
        status: statusFilter ? [statusFilter] : undefined,
        sort_by: 'received_at',
        sort_order: 'desc',
      })
      if (mounted.current) setRepairs(data)
    } catch (e) {
      if (mounted.current) setError('Failed to load repairs: ' + String(e))
    } finally {
      if (mounted.current) setLoading(false)
    }
  }

  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  useEffect(() => { if (mounted.current) loadRepairs() }, [statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => { if (mounted.current) loadRepairs() }, 300)
    return () => clearTimeout(timer)
  }, [search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">All Repairs</h1>
        <Button onClick={() => navigate('new-repair-step1')}>+ New Repair</Button>
      </div>
      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      <div className="flex gap-4">
        <Input
          placeholder="Search by ID, customer name, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-bg-elevated border border-border-default rounded-xl px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
        >
          {statusFilters.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      <Card className={loading ? 'opacity-50' : ''}>
        {repairs.length === 0 && !loading ? (
          <div className="text-center py-12 text-text-muted">No repairs found.</div>
        ) : repairs.length === 0 && loading ? (
          <div className="text-center py-12 text-text-muted">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted border-b border-border-default">
                <th className="text-left py-2 font-medium">Repair ID</th>
                <th className="text-left py-2 font-medium">Customer</th>
                <th className="text-left py-2 font-medium">Phone</th>
                <th className="text-left py-2 font-medium">Device</th>
                <th className="text-left py-2 font-medium">Status</th>
                <th className="text-left py-2 font-medium">Technician</th>
                <th className="text-left py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {repairs.map((r) => (
                <tr
                  key={r.repair.id}
                  onClick={() => navigate('repair-detail', { repairId: r.repair.id })}
                  className="border-b border-border-default hover:bg-bg-elevated/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 font-medium text-text-primary">{r.repair.id}</td>
                  <td className="py-3 text-text-secondary">{r.customer_name}</td>
                  <td className="py-3 text-text-muted">{r.customer_phone}</td>
                  <td className="py-3 text-text-secondary">{r.repair.brand} {r.repair.model}</td>
                  <td className="py-3"><StatusBadge status={r.repair.status} /></td>
                  <td className="py-3 text-text-secondary">{r.technician_name || '-'}</td>
                  <td className="py-3 text-text-muted">{r.repair.received_at?.split(' ')[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
