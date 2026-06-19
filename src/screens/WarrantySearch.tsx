import { useState } from 'react'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { ErrorBanner } from '../components/ErrorBanner'
import { StatusBadge } from '../components/StatusBadge'
import type { WarrantyWithRepair } from '../types'

export function WarrantySearch() {
  const navigate = useAppStore((s) => s.navigate)
  const [serial, setSerial] = useState('')
  const [results, setResults] = useState<WarrantyWithRepair[]>([])
  const [searching, setSearching] = useState(false)

  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!serial.trim()) return
    setSearching(true)
    setSearched(true)
    try {
      const r = await api.warranties.searchBySerial(serial.trim())
      setResults(r)
    } catch (e) {
      setError('Search failed: ' + String(e))
    } finally {
      setSearching(false)
    }
  }

  const handleReopen = async (repairId: string) => {
    try {
      await api.warranties.reopen(repairId)
      navigate('repair-detail', { repairId })
    } catch (e) {
      setError('Failed to reopen: ' + String(e))
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate('dashboard')} className="text-sm text-text-muted hover:text-text-primary mb-1">&larr; Back to Dashboard</button>
        <h1 className="text-2xl font-bold text-text-primary">Warranty Claim</h1>
        <p className="text-sm text-text-muted mt-1">Search for an active warranty by device serial number.</p>
      </div>
      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      <Card>
        <div className="flex gap-3">
          <Input
            placeholder="Enter device serial number..."
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} loading={searching}>Search</Button>
        </div>
      </Card>

      {searched && results.length === 0 && !searching && (
        <div className="text-sm text-text-muted text-center py-8">
          No active warranties found for that serial number.
        </div>
      )}

      {results.map((r) => {
        const isExpired = new Date(r.warranty.expiry_date) < new Date()
        return (
          <Card key={r.warranty.id}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-text-primary">{r.warranty.repair_id}</div>
                <div className="text-xs text-text-muted">{r.customer_name}</div>
              </div>
              <StatusBadge status={isExpired ? 'Closed' : 'Completed — Under Warranty'} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><span className="text-text-secondary">Device:</span> <span className="text-text-primary">{r.device_brand} {r.device_model || ''}</span></div>
              <div><span className="text-text-secondary">Serial:</span> <span className="text-text-primary">{r.serial_number || '-'}</span></div>
              <div><span className="text-text-secondary">Warranty:</span> <span className="text-text-primary">{r.warranty.duration_label}</span></div>
              <div><span className="text-text-secondary">Expires:</span> <span className={`font-medium ${isExpired ? 'text-red-400' : 'text-text-primary'}`}>{r.warranty.expiry_date}</span></div>
            </div>
            {!isExpired && (
              <Button onClick={() => handleReopen(r.warranty.repair_id)}>
                Reopen for Warranty Claim
              </Button>
            )}
          </Card>
        )
      })}
    </div>
  )
}
