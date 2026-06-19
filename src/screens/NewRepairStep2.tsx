import { useState } from 'react'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { Card } from '../components/Card'
import { ErrorBanner } from '../components/ErrorBanner'
import { Input, Select, Textarea } from '../components/Input'
import { Button } from '../components/Button'

const deviceTypes = [
  { value: 'Laptop', label: 'Laptop' },
  { value: 'Desktop', label: 'Desktop' },
  { value: 'Tablet', label: 'Tablet' },
  { value: 'Phone', label: 'Phone' },
  { value: 'Other', label: 'Other' },
]

const conditionOptions = [
  { value: 'fine', label: 'Fine' },
  { value: 'scratched', label: 'Scratched' },
  { value: 'cracked', label: 'Cracked' },
  { value: 'keys missing', label: 'Keys Missing' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'dented', label: 'Dented' },
]

export function NewRepairStep2() {
  const navigate = useAppStore((s) => s.navigate)
  const customerId = useAppStore((s) => s.selectedCustomerId)

  const [deviceType, setDeviceType] = useState('Laptop')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [colorDesc, setColorDesc] = useState('')
  const [reportedProblem, setReportedProblem] = useState('')

  const [showCondition, setShowCondition] = useState(false)
  const [screen, setScreen] = useState('fine')
  const [keyboard, setKeyboard] = useState('fine')
  const [body, setBody] = useState('fine')
  const [batteryPresent, setBatteryPresent] = useState(true)
  const [chargerIncluded, setChargerIncluded] = useState(true)
  const [accessoriesIncluded, setAccessoriesIncluded] = useState(false)
  const [accessoriesNotes, setAccessoriesNotes] = useState('')
  const [extraNotes, setExtraNotes] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!brand.trim() || !reportedProblem.trim() || customerId === null) return
    setSaving(true)
    try {
      await api.repairs.create({
        customer_id: customerId,
        device_type: deviceType,
        brand,
        model: model || null,
        serial_number: serialNumber || null,
        color_desc: colorDesc || null,
        reported_problem: reportedProblem,
      })
      navigate('repairs-list')
    } catch (e) {
      setError('Failed to save repair: ' + String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">New Repair — Step 2</h1>
      <p className="text-sm text-text-secondary">Device information and condition checklist.</p>
      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Device Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Device Type" options={deviceTypes} value={deviceType} onChange={(e) => setDeviceType(e.target.value)} />
          <Input label="Brand" placeholder="e.g. Dell, HP, Lenovo" value={brand} onChange={(e) => setBrand(e.target.value)} />
          <Input label="Model" placeholder="e.g. Inspiron 15" value={model} onChange={(e) => setModel(e.target.value)} />
          <Input label="Serial Number" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
          <Input label="Colour / Description" value={colorDesc} onChange={(e) => setColorDesc(e.target.value)} />
        </div>
        <div className="mt-4">
          <Textarea label="Reported Problem" placeholder="Customer's own words..." value={reportedProblem} onChange={(e) => setReportedProblem(e.target.value)} />
        </div>
      </Card>

      <Card>
        <button
          onClick={() => setShowCondition(!showCondition)}
          className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <span className={`transition-transform ${showCondition ? 'rotate-90' : ''}`}>▶</span>
          {showCondition ? 'Hide condition checklist' : 'Add condition checklist'}
        </button>

        {showCondition && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Select label="Screen" options={conditionOptions.slice(0, 3)} value={screen} onChange={(e) => setScreen(e.target.value)} />
            <Select label="Keyboard" options={conditionOptions.slice(0, 1).concat(conditionOptions.slice(3, 5))} value={keyboard} onChange={(e) => setKeyboard(e.target.value)} />
            <Select label="Body / Casing" options={[conditionOptions[0], conditionOptions[4], conditionOptions[5]]} value={body} onChange={(e) => setBody(e.target.value)} />
            <label className="flex items-center gap-2 text-sm text-text-secondary pt-6">
              <input type="checkbox" checked={batteryPresent} onChange={(e) => setBatteryPresent(e.target.checked)} className="accent-brand-purple" />
              Battery Present
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary pt-6">
              <input type="checkbox" checked={chargerIncluded} onChange={(e) => setChargerIncluded(e.target.checked)} className="accent-brand-purple" />
              Charger Included
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary pt-6">
              <input type="checkbox" checked={accessoriesIncluded} onChange={(e) => setAccessoriesIncluded(e.target.checked)} className="accent-brand-purple" />
              Accessories Included
            </label>
            {accessoriesIncluded && (
              <Input label="Accessories Notes" value={accessoriesNotes} onChange={(e) => setAccessoriesNotes(e.target.value)} />
            )}
            <div className="col-span-2">
              <Textarea label="Extra Notes" value={extraNotes} onChange={(e) => setExtraNotes(e.target.value)} />
            </div>
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate('new-repair-step1')}>Back</Button>
        <Button onClick={handleSave} loading={saving} disabled={!brand.trim() || !reportedProblem.trim()}>
          Save Repair
        </Button>
      </div>
    </div>
  )
}
