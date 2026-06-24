import { useState } from 'react'
import { api } from '../lib/api'
import { Modal } from './Modal'
import { Input, Select } from './Input'
import { Button } from './Button'
import { mapError } from '../lib/mapError'

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  repairId: string
  grandTotal: number
  onSuccess: () => void
}

export function PaymentModal({ open, onClose, repairId, grandTotal, onSuccess }: PaymentModalProps) {
  const [amount, setAmount] = useState(grandTotal.toString())
  const [method, setMethod] = useState('cash')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) { setError('Enter a valid amount.'); return }
    setSaving(true); setError('')
    try {
      await api.payments.record({ repair_id: repairId, amount: parsed, method, note: note || null })
      onSuccess(); onClose()
    } catch (e) { setError(mapError(e)) }
    finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Record Payment">
      <div className="space-y-4">
        <Input label="Amount (LKR)" type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Select label="Payment Method" options={[{ value: 'cash', label: 'Cash' }, { value: 'bank_transfer', label: 'Bank Transfer' }]} value={method} onChange={(e) => setMethod(e.target.value)} />
        <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Bank transaction reference" />
        {error && <div className="text-sm text-semantic-error bg-semantic-error-subtle rounded-lg px-3 py-2">{error}</div>}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={saving}>Confirm Payment</Button>
        </div>
      </div>
    </Modal>
  )
}
