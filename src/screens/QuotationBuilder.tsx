import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { Card } from '../components/Card'
import { Input, Select } from '../components/Input'
import { Button } from '../components/Button'
import type { RepairWithCustomer, CreateQuotationItemInput } from '../types'
import { displayPhone } from '../lib/phone'

interface ItemRow {
  key: number
  item_type: string
  description: string
  device_name: string
  serial_number: string
  qty: number
  unit_price: number
}

let nextKey = 1
function freshItem(data: RepairWithCustomer | null): ItemRow {
  return {
    key: nextKey++,
    item_type: 'labour',
    description: '',
    device_name: data ? `${data.repair.brand || ''} ${data.repair.model || ''}`.trim() : '',
    serial_number: data?.repair.serial_number || '',
    qty: 1,
    unit_price: 0,
  }
}

export function QuotationBuilder() {
  const repairId = useAppStore((s) => s.selectedRepairId)
  const navigate = useAppStore((s) => s.navigate)

  const [data, setData] = useState<RepairWithCustomer | null>(null)
  const [items, setItems] = useState<ItemRow[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    if (!repairId) return
    setLoading(true)
    api.repairs.get(repairId).then((r) => {
      if (!mounted.current) return
      if (!r) { setLoading(false); return }
      setData(r)
      setItems([freshItem(r), freshItem(r)])
      api.quotations.getByRepair(repairId).then((existing) => {
        if (!mounted.current) return
        if (existing && existing.quotation.status === 'pending') {
          setItems(
            existing.items.map((it) => ({
              key: nextKey++,
              item_type: it.item_type,
              description: it.description,
              device_name: it.device_name || '',
              serial_number: it.serial_number || '',
              qty: it.qty,
              unit_price: it.unit_price,
            }))
          )
        }
        setLoading(false)
      }).catch((e) => { if (mounted.current) { setError(String(e)); setLoading(false) } })
    }).catch((e) => { if (mounted.current) { setError(String(e)); setLoading(false) } })
    return () => { mounted.current = false }
  }, [repairId])

  const updateItem = useCallback((key: number, field: keyof ItemRow, value: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it
        if (field === 'qty' || field === 'unit_price') {
          return { ...it, [field]: parseFloat(value) || 0 }
        }
        return { ...it, [field]: value }
      })
    )
  }, [])

  const subtotal = items.reduce((s, it) => s + it.qty * it.unit_price, 0)

  const handleSave = async () => {
    if (!repairId || !data) return
    const validItems = items.filter((it) => it.description.trim() && it.unit_price > 0 && it.item_type)
    if (validItems.length === 0) {
      setError('Add at least one item with a type, description, and price.')
      return
    }
    if (validItems.length > 2) {
      setError('Maximum 2 items allowed.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const inputItems: CreateQuotationItemInput[] = validItems.map((it, i) => ({
        sort_order: i + 1,
        description: it.description,
        item_type: it.item_type === 'part' ? 'part' : 'labour',
        device_name: it.device_name || null,
        serial_number: it.serial_number || null,
        unit_price: it.unit_price,
        qty: it.qty,
      }))
      await api.quotations.create({ repair_id: repairId, items: inputItems })
      const paths = await api.pdf.generateQuotationPdf(repairId, true)
      try { await api.pdf.openFile(paths.split('\n')[0]) } catch { /* non-fatal */ }
      navigate('repair-detail', { repairId })
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-text-muted text-center py-12">Loading...</div>
  }
  if (!data || !repairId) {
    return <div className="text-text-muted text-center py-12">Repair not found.</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('repair-detail', { repairId })} className="text-sm text-text-muted hover:text-text-primary mb-1">&larr; Back to Repair</button>
          <h1 className="text-2xl font-bold text-text-primary">Quotation Builder</h1>
        </div>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-3">Repair Info</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-text-secondary">Repair ID:</span> <span className="text-text-primary">{data.repair.id}</span></div>
          <div><span className="text-text-secondary">Customer:</span> <span className="text-text-primary">{data.customer_name}</span></div>
          <div><span className="text-text-secondary">Phone:</span> <span className="text-text-primary">{displayPhone(data.customer_phone)}</span></div>
          <div><span className="text-text-secondary">Address:</span> <span className="text-text-primary">{data.customer_address || '-'}</span></div>
          <div><span className="text-text-secondary">Date:</span> <span className="text-text-primary">{new Date().toLocaleDateString()}</span></div>
          <div><span className="text-text-secondary">Device:</span> <span className="text-text-primary">{data.repair.brand} {data.repair.model || ''}</span></div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Line Items (max 2)</h2>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.key} className="border border-border-default rounded-xl p-3 space-y-3">
              <Select
                label="Item Type"
                options={[
                  { value: 'labour', label: 'Labour' },
                  { value: 'part', label: 'Part' },
                ]}
                value={item.item_type}
                onChange={(e) => updateItem(item.key, 'item_type', e.target.value)}
              />
              <Input
                label="Description"
                value={item.description}
                onChange={(e) => updateItem(item.key, 'description', e.target.value)}
                placeholder="e.g. Screen Replacement"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Device Name"
                  value={item.device_name}
                  onChange={(e) => updateItem(item.key, 'device_name', e.target.value)}
                  placeholder="Auto-filled from repair"
                />
                <Input
                  label="Serial Number"
                  value={item.serial_number}
                  onChange={(e) => updateItem(item.key, 'serial_number', e.target.value)}
                  placeholder="Auto-filled from repair"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Unit Price (RM)"
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.unit_price.toString()}
                  onChange={(e) => updateItem(item.key, 'unit_price', e.target.value)}
                />
                <Input
                  label="Qty"
                  type="number"
                  min={1}
                  value={item.qty.toString()}
                  onChange={(e) => updateItem(item.key, 'qty', e.target.value)}
                />
                <div className="flex items-end pb-1">
                  <div className="text-sm text-text-secondary font-medium">
                    = RM {(item.qty * item.unit_price).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border-default flex items-center justify-between">
          <div className="text-sm text-text-secondary">Subtotal</div>
          <div className="text-xl font-bold text-text-primary">RM {subtotal.toFixed(2)}</div>
        </div>
        <div className="flex items-center justify-between text-lg pt-2 border-t border-border-default mt-2">
          <div className="font-semibold text-text-primary">Grand Total</div>
          <div className="text-2xl font-bold text-[#6B46C1]">RM {subtotal.toFixed(2)}</div>
        </div>
      </Card>

      {error && <div className="text-red-400 text-sm bg-red-400/10 rounded-lg p-3">{error}</div>}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate('repair-detail', { repairId })} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSave} loading={saving} className="flex-1">
          Generate & Print
        </Button>
      </div>
    </div>
  )
}
