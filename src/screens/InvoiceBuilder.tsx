import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { Card } from '../components/Card'
import { Input, Select } from '../components/Input'
import { Button } from '../components/Button'
import type { RepairWithCustomer, QuotationItem, CreateQuotationItemInput } from '../types'
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

const WARRANTY_OPTIONS = [
  { value: '1 Month', label: '1 Month' },
  { value: '2 Months', label: '2 Months' },
  { value: '3 Months', label: '3 Months' },
  { value: '6 Months', label: '6 Months' },
  { value: '1 Year', label: '1 Year' },
  { value: '2 Years', label: '2 Years' },
  { value: '3 Years', label: '3 Years' },
  { value: '5 Years', label: '5 Years' },
  { value: '10 Years', label: '10 Years' },
  { value: '__custom__', label: 'Custom...' },
]

function calculateExpiry(startDate: string, durationLabel: string): string {
  const start = new Date(startDate)
  const d = durationLabel.toLowerCase()
  let months = 3
  if (d.includes('year') || (d.includes('y') && !d.includes('month'))) {
    const n = parseInt(d.match(/\d+/)?.[0] || '1')
    months = n * 12
  } else if (d.includes('month') || d.includes('m')) {
    months = parseInt(d.match(/\d+/)?.[0] || '3')
  }
  const expiry = new Date(start)
  expiry.setMonth(expiry.getMonth() + months)
  return expiry.toISOString().split('T')[0]
}

export function InvoiceBuilder() {
  const repairId = useAppStore((s) => s.selectedRepairId)
  const navigate = useAppStore((s) => s.navigate)

  const [data, setData] = useState<RepairWithCustomer | null>(null)
  const [items, setItems] = useState<ItemRow[]>([])
  const [existingInvoiceItems, setExistingInvoiceItems] = useState<QuotationItem[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [giveWarranty, setGiveWarranty] = useState(false)
  const [warrantyDuration, setWarrantyDuration] = useState('3 Months')
  const [customDuration, setCustomDuration] = useState('')
  const [hasWarranty, setHasWarranty] = useState(false)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    if (!repairId) return
    setLoading(true)
    api.warranties.get(repairId).then((w) => { if (mounted.current) setHasWarranty(w !== null) }).catch(() => {})
    api.repairs.get(repairId).then((r) => {
      if (!mounted.current) return
      if (!r) { setLoading(false); return }
      setData(r)

      api.quotations.getInvoiceItems(repairId).then((invItems) => {
        if (!mounted.current) return
        if (invItems.length > 0) {
          setExistingInvoiceItems(invItems)
          setItems(
            invItems.map((it) => ({
              key: nextKey++,
              item_type: it.item_type,
              description: it.description,
              device_name: it.device_name || '',
              serial_number: it.serial_number || '',
              qty: it.qty,
              unit_price: it.unit_price,
            }))
          )
          setLoading(false)
          return
        }

        if (r.customer_type === 'business') {
          api.quotations.getByRepair(repairId).then((q) => {
            if (!mounted.current) return
            if (q && q.quotation.status === 'approved') {
              setItems(
                q.items.map((it) => ({
                  key: nextKey++,
                  item_type: it.item_type,
                  description: it.description,
                  device_name: it.device_name || '',
                  serial_number: it.serial_number || '',
                  qty: it.qty,
                  unit_price: it.unit_price,
                }))
              )
            } else {
              setItems([freshItem(r), freshItem(r)])
            }
            setLoading(false)
          }).catch((e) => { if (mounted.current) { setError(String(e)); setLoading(false) } })
        } else {
          setItems([freshItem(r), freshItem(r)])
          setLoading(false)
        }
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
      await api.quotations.createInvoiceItems(repairId, inputItems)

      if (giveWarranty && !hasWarranty) {
        const today = new Date().toISOString().split('T')[0]
        const label = warrantyDuration === '__custom__' ? customDuration : warrantyDuration
        const expiry = calculateExpiry(today, label)
        await api.warranties.create({
          repair_id: repairId,
          duration_label: label,
          start_date: today,
          expiry_date: expiry,
        })
      }

      await api.pdf.generateInvoicePdf(repairId, true).then(async (paths) => {
        try { await api.pdf.openFile(paths.split('\n')[0]) } catch { /* non-fatal */ }
      })
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
          <h1 className="text-2xl font-bold text-text-primary">Invoice Builder</h1>
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

      {existingInvoiceItems && (
        <div className="text-xs text-amber-400 bg-amber-400/10 rounded-lg p-3">
          An invoice already exists for this repair. {existingInvoiceItems.length} item(s) on file.
        </div>
      )}

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
                disabled={!!existingInvoiceItems}
              />
              <Input
                label="Description"
                value={item.description}
                onChange={(e) => updateItem(item.key, 'description', e.target.value)}
                placeholder="e.g. Screen Replacement"
                disabled={!!existingInvoiceItems}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Device Name"
                  value={item.device_name}
                  onChange={(e) => updateItem(item.key, 'device_name', e.target.value)}
                  placeholder="Auto-filled from repair"
                  disabled={!!existingInvoiceItems}
                />
                <Input
                  label="Serial Number"
                  value={item.serial_number}
                  onChange={(e) => updateItem(item.key, 'serial_number', e.target.value)}
                  placeholder="Auto-filled from repair"
                  disabled={!!existingInvoiceItems}
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
                  disabled={!!existingInvoiceItems}
                />
                <Input
                  label="Qty"
                  type="number"
                  min={1}
                  value={item.qty.toString()}
                  onChange={(e) => updateItem(item.key, 'qty', e.target.value)}
                  disabled={!!existingInvoiceItems}
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

      {!existingInvoiceItems && !hasWarranty && (
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Warranty</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={giveWarranty}
                onChange={(e) => setGiveWarranty(e.target.checked)}
                className="w-5 h-5 rounded border-border-default accent-[#6B46C1]"
              />
              <span className="text-sm text-text-primary">Give warranty for this repair?</span>
            </label>

            {giveWarranty && (
              <div className="space-y-3 pl-8">
                <Select
                  label="Duration"
                  options={WARRANTY_OPTIONS}
                  value={warrantyDuration}
                  onChange={(e) => setWarrantyDuration(e.target.value)}
                />
                {warrantyDuration === '__custom__' && (
                  <Input
                    label="Custom Duration"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    placeholder="e.g. Until end of 2026"
                  />
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {error && <div className="text-red-400 text-sm bg-red-400/10 rounded-lg p-3">{error}</div>}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate('repair-detail', { repairId })} className="flex-1">
          Cancel
        </Button>
        {!existingInvoiceItems && (
          <Button onClick={handleSave} loading={saving} className="flex-1">
            Generate & Print
          </Button>
        )}
      </div>
    </div>
  )
}
