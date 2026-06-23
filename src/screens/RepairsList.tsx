import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { StatusBadge } from '../components/StatusBadge'
import { Button } from '../components/Button'
import { ErrorBanner } from '../components/ErrorBanner'
import { DataTable } from '../components/DataTable'
import { Plus, X, ArrowUpDown } from 'lucide-react'
import type { RepairWithCustomer } from '../types'
import { displayPhone } from '../lib/phone'

const statusFilters = [
  { value: '', label: 'All Statuses' },
  { value: 'Received', label: 'Received' },
  { value: 'Awaiting Approval', label: 'Awaiting Approval' },
  { value: 'Repairing', label: 'Repairing' },
  { value: 'Ready for Collection', label: 'Ready for Collection' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Completed — Under Warranty', label: 'Warranty' },
  { value: 'Declined', label: 'Declined' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Closed', label: 'Closed' },
]

export function RepairsList() {
  const navigate = useAppStore((s) => s.navigate)
  const [repairs, setRepairs] = useState<RepairWithCustomer[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerTypeFilter, setCustomerTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)
  const [error, setError] = useState('')

  const loadRepairs = async () => {
    setLoading(true)
    try {
      const data = await api.repairs.list({
        search: search || undefined,
        status: statusFilter ? [statusFilter] : undefined,
        customer_type: customerTypeFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sort_by: 'received_at',
        sort_order: sortOrder,
      })
      if (mounted.current) setRepairs(data)
    } catch (e) { if (mounted.current) setError('Failed to load: ' + String(e)) }
    finally { if (mounted.current) setLoading(false) }
  }

  useEffect(() => { if (mounted.current) loadRepairs() }, [statusFilter, customerTypeFilter, dateFrom, dateTo, sortOrder])
  useEffect(() => { const t = setTimeout(() => { if (mounted.current) loadRepairs() }, 300); return () => clearTimeout(t) }, [search])

  const hasFilters = dateFrom || dateTo || customerTypeFilter || statusFilter

  const columns = [
    { key: 'id', label: 'Repair ID', render: (r: RepairWithCustomer) => <span className="font-medium text-text-primary text-xs tabular-nums">{r.repair.id}</span>, sortable: true },
    { key: 'customer', label: 'Customer', render: (r: RepairWithCustomer) => <span className="text-text-secondary text-xs">{r.customer_name}</span>, sortable: true },
    { key: 'phone', label: 'Phone', render: (r: RepairWithCustomer) => <span className="text-text-muted text-xs">{displayPhone(r.customer_phone)}</span> },
    { key: 'device', label: 'Device', render: (r: RepairWithCustomer) => <span className="text-text-secondary text-xs">{r.repair.brand} {r.repair.model}</span> },
    { key: 'status', label: 'Status', render: (r: RepairWithCustomer) => <StatusBadge status={r.repair.status} />, sortable: true },
    { key: 'date', label: 'Date', render: (r: RepairWithCustomer) => <span className="text-text-muted text-xs">{r.repair.received_at?.split(' ')[0]}</span>, sortable: true },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">All Repairs</h1>
          <p className="text-sm text-text-muted mt-0.5">{repairs.length} repair(s) found</p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => navigate('new-repair-step1')}>New Repair</Button>
      </div>
      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      <DataTable columns={columns} data={repairs} loading={loading}
        emptyTitle="No repairs found" emptyDescription="Create a new repair to get started."
        emptyAction={<Button size="sm" icon={<Plus size={13} />} onClick={() => navigate('new-repair-step1')}>New Repair</Button>}
        onRowClick={(r) => navigate('repair-detail', { repairId: r.repair.id })}
        onSort={() => setSortOrder((o) => o === 'desc' ? 'asc' : 'desc')}
        searchable searchPlaceholder="Search ID, customer, phone..." searchValue={search}
        onSearchChange={setSearch}
        filters={
          <>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-bg-surface border border-border-subtle rounded-md px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-brand/40 focus:ring-1 focus:ring-accent-brand/20">
              {statusFilters.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}
            </select>
            <select value={customerTypeFilter} onChange={(e) => setCustomerTypeFilter(e.target.value)}
              className="bg-bg-surface border border-border-subtle rounded-md px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-brand/40 focus:ring-1 focus:ring-accent-brand/20">
              <option value="">All Types</option>
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="bg-bg-surface border border-border-subtle rounded-md px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-brand/40 focus:ring-1 focus:ring-accent-brand/20" title="From" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="bg-bg-surface border border-border-subtle rounded-md px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-brand/40 focus:ring-1 focus:ring-accent-brand/20" title="To" />
            {hasFilters && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); setCustomerTypeFilter(''); setStatusFilter('') }}
                className="inline-flex items-center gap-1 text-xs text-accent-brand hover:text-accent-brand-hover font-medium"><X size={12} /> Clear</button>
            )}
            <button onClick={() => setSortOrder((o) => o === 'desc' ? 'asc' : 'desc')}
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary font-medium px-2 py-2 rounded-md hover:bg-bg-hover transition-colors">
              <ArrowUpDown size={12} />{sortOrder === 'desc' ? 'Newest' : 'Oldest'}
            </button>
          </>
        }
      />
    </div>
  )
}
