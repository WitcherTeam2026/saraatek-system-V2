import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import type { ReportsSummary } from '../types'

type Preset = 'this-month' | 'last-month' | 'last-3-months' | 'this-year' | 'custom'

function getPresetRange(preset: Preset): { start: string; end: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (preset) {
    case 'this-month':
      return { start: `${y}-${String(m + 1).padStart(2, '0')}-01`, end: now.toISOString().split('T')[0] }
    case 'last-month': {
      const first = new Date(y, m - 1, 1)
      const last = new Date(y, m, 0)
      return { start: first.toISOString().split('T')[0], end: last.toISOString().split('T')[0] }
    }
    case 'last-3-months': {
      const first = new Date(y, m - 2, 1)
      return { start: first.toISOString().split('T')[0], end: now.toISOString().split('T')[0] }
    }
    case 'this-year':
      return { start: `${y}-01-01`, end: now.toISOString().split('T')[0] }
    default:
      return { start: `${y}-${String(m + 1).padStart(2, '0')}-01`, end: now.toISOString().split('T')[0] }
  }
}

export function Reports() {
  const [preset, setPreset] = useState<Preset>('this-month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [data, setData] = useState<ReportsSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [sortCol, setSortCol] = useState('')
  const [sortAsc, setSortAsc] = useState(true)
  const [reportError, setReportError] = useState('')
  const mounted = useRef(true)

  useEffect(() => {
    const range = getPresetRange(preset)
    setStartDate(range.start)
    setEndDate(range.end)
  }, [preset])

  useEffect(() => {
    mounted.current = true
    if (!startDate || !endDate) return
    setLoading(true)
    setReportError('')
    api.reports.summary(startDate, endDate, includeInactive)
      .then((d) => { if (mounted.current) setData(d) })
      .catch((e) => { if (mounted.current) setReportError(String(e)) })
      .finally(() => { if (mounted.current) setLoading(false) })
    return () => { mounted.current = false }
  }, [startDate, endDate, includeInactive])

  const maxRevenue = (data?.revenue.monthly?.length ? Math.max(...data.revenue.monthly.map(m => m.amount), 1) : 1)
  const maxStatus = (data?.volume.by_status?.length ? Math.max(...data.volume.by_status.map(s => s.count), 1) : 1)

  const sortedTechs = [...(data?.technician_performance || [])].sort((a, b) => {
    const aVal = (a as any)[sortCol] ?? 0
    const bVal = (b as any)[sortCol] ?? 0
    return sortAsc ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1)
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Reports</h1>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-text-secondary mr-2">Range:</span>
          {(['this-month', 'last-month', 'last-3-months', 'this-year'] as Preset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                preset === p ? 'bg-brand-purple/20 text-brand-purple' : 'text-text-secondary hover:bg-bg-elevated'
              }`}
            >{p === 'this-month' ? 'This Month' : p === 'last-month' ? 'Last Month' : p === 'last-3-months' ? 'Last 3 Months' : 'This Year'}</button>
          ))}
          <span className="text-text-muted mx-1">|</span>
          <input type="date" value={startDate} onChange={(e) => { setPreset('custom'); setStartDate(e.target.value) }} className="bg-bg-elevated border border-border-default rounded-lg px-2 py-1.5 text-sm text-text-primary" />
          <span className="text-text-muted">to</span>
          <input type="date" value={endDate} onChange={(e) => { setPreset('custom'); setEndDate(e.target.value) }} className="bg-bg-elevated border border-border-default rounded-lg px-2 py-1.5 text-sm text-text-primary" />
        </div>
      </Card>

      {reportError && <div className="text-red-400 text-sm bg-red-400/10 rounded-lg p-3">{reportError}</div>}

      {loading && <div className="text-text-muted text-center py-8">Loading...</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-2">Revenue</h2>
              <div className="text-3xl font-bold text-brand-purple">RM {data.revenue.total.toFixed(2)}</div>
              <div className="text-xs text-text-muted mb-4">{data.revenue.count} payment(s)</div>
              {data.revenue.monthly.length > 0 && (
                <div className="space-y-1.5">
                  {data.revenue.monthly.map((m) => (
                    <div key={m.month} className="flex items-center gap-2 text-xs">
                      <span className="w-16 text-text-secondary shrink-0">{m.month}</span>
                      <div className="flex-1 h-4 bg-bg-elevated rounded-full overflow-hidden">
                        <div className="h-full bg-brand-purple rounded-full transition-all" style={{ width: `${(m.amount / maxRevenue) * 100}%` }} />
                      </div>
                      <span className="w-20 text-right text-text-primary font-medium">RM {m.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              {data.revenue.by_method.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border-default">
                  <div className="text-xs text-text-muted mb-1">By method</div>
                  {data.revenue.by_method.map((m) => (
                    <div key={m.method} className="flex justify-between text-xs">
                      <span className="text-text-secondary capitalize">{m.method}</span>
                      <span className="text-text-primary">RM {m.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-2">Repair Volume</h2>
              <div className="text-3xl font-bold text-brand-purple">{data.volume.total}</div>
              <div className="text-xs text-text-muted mb-4">total repairs</div>
              {data.volume.by_status.length > 0 && (
                <div className="space-y-1.5">
                  {data.volume.by_status.map((s) => (
                    <div key={s.status} className="flex items-center gap-2 text-xs">
                      <span className="w-36 text-text-secondary truncate shrink-0">{s.status}</span>
                      <div className="flex-1 h-4 bg-bg-elevated rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(s.count / maxStatus) * 100}%` }} />
                      </div>
                      <span className="w-10 text-right text-text-primary font-medium">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
              {data.volume.by_type.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border-default">
                  <div className="text-xs text-text-muted mb-1">By customer type</div>
                  {data.volume.by_type.map((t) => (
                    <div key={t.customer_type} className="flex justify-between text-xs">
                      <span className="text-text-secondary capitalize">{t.customer_type}</span>
                      <span className="text-text-primary">{t.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Technician Performance</h2>
              <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} className="accent-[#6B46C1]" />
                Include inactive
              </label>
            </div>
            {sortedTechs.length === 0 ? (
              <div className="text-sm text-text-muted text-center py-4">No data</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-secondary border-b border-border-default">
                      {['technician_name', 'repairs_assigned', 'repairs_completed', 'avg_days', 'total_revenue'].map((col) => (
                        <th key={col} className="text-left py-2 px-2 cursor-pointer hover:text-text-primary" onClick={() => {
                          if (sortCol === col) setSortAsc(!sortAsc)
                          else { setSortCol(col); setSortAsc(col === 'technician_name') }
                        }}>
                          {col === 'technician_name' ? 'Technician' : col === 'repairs_assigned' ? 'Assigned' : col === 'repairs_completed' ? 'Completed' : col === 'avg_days' ? 'Avg Days' : 'Revenue'}
                          {sortCol === col ? (sortAsc ? ' ▲' : ' ▼') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTechs.map((t) => (
                      <tr key={t.technician_name} className="border-b border-border-default last:border-0 text-text-primary">
                        <td className="py-2 px-2 font-medium">{t.technician_name}</td>
                        <td className="py-2 px-2">{t.repairs_assigned}</td>
                        <td className="py-2 px-2">{t.repairs_completed}</td>
                        <td className="py-2 px-2">{t.avg_days > 0 ? t.avg_days.toFixed(1) : '-'}</td>
                        <td className="py-2 px-2">RM {t.total_revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
