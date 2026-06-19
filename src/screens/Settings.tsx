import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { Card } from '../components/Card'
import { Input, Textarea } from '../components/Input'
import { Button } from '../components/Button'
import { ErrorBanner } from '../components/ErrorBanner'
import type { Technician } from '../types'

export function Settings() {
  const [shopName, setShopName] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [fonnteToken, setFonnteToken] = useState('')
  const [defaultCountryCode, setDefaultCountryCode] = useState('94')
  const [photosDir, setPhotosDir] = useState('')
  const [openrouterApiKey, setOpenrouterApiKey] = useState('')
  const [openrouterModel, setOpenrouterModel] = useState('meta-llama/llama-3.1-8b-instruct:free')
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [newTechName, setNewTechName] = useState('')
  const [newTechPhone, setNewTechPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    api.settings.getAll()
      .then((settings: Record<string, string>) => {
        if (!mounted.current) return
        setShopName(settings.shop_name || '')
        setShopAddress(settings.shop_address || '')
        setShopPhone(settings.shop_phone || '')
        setFonnteToken(settings.fonnte_api_token || '')
        setDefaultCountryCode(settings.default_country_code || '94')
        setPhotosDir(settings.photos_dir || '')
        setOpenrouterApiKey(settings.openrouter_api_key || '')
        setOpenrouterModel(settings.openrouter_model || 'meta-llama/llama-3.1-8b-instruct:free')
      })
      .catch((e) => setLoadError('Failed to load settings: ' + String(e)))
    api.technicians.list()
      .then((t: Technician[]) => { if (mounted.current) setTechnicians(t) })
      .catch((e) => setLoadError('Failed to load technicians: ' + String(e)))
    return () => { mounted.current = false }
  }, [])

  const saveShopInfo = async () => {
    setSaving(true)
    try {
      await Promise.all([
        api.settings.save('shop_name', shopName),
        api.settings.save('shop_address', shopAddress),
        api.settings.save('shop_phone', shopPhone),
        api.settings.save('fonnte_api_token', fonnteToken),
        api.settings.save('default_country_code', defaultCountryCode),
        api.settings.save('photos_dir', photosDir),
        api.settings.save('openrouter_api_key', openrouterApiKey),
        api.settings.save('openrouter_model', openrouterModel),
      ])
    } catch (e) {
      alert('Failed to save settings: ' + String(e))
    } finally {
      setSaving(false)
    }
  }

  const addTechnician = async () => {
    if (!newTechName.trim()) return
    try {
      const tech = await api.technicians.create(newTechName.trim(), newTechPhone.trim() || undefined)
      setTechnicians([...technicians, tech])
      setNewTechName('')
      setNewTechPhone('')
    } catch (e) {
      alert('Failed to add technician: ' + String(e))
    }
  }

  const toggleTech = async (id: number) => {
    try {
      await api.technicians.toggleActive(id)
      setTechnicians(technicians.map((t) => t.id === id ? { ...t, active: !t.active } : t))
    } catch (e) {
      alert('Failed to toggle technician: ' + String(e))
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      {loadError && <div className="text-red-400 text-sm bg-red-400/10 rounded-lg p-3">{loadError}</div>}

      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Shop Information</h2>
        <div className="space-y-4">
          <Input label="Shop Name" value={shopName} onChange={(e) => setShopName(e.target.value)} />
          <Textarea label="Address" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} />
          <Input label="Phone Number" value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} />
          <Button onClick={saveShopInfo} loading={saving}>Save</Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">WhatsApp (Fonnte)</h2>
        <div className="space-y-4">
          <Input
            label="Fonnte API Token"
            value={fonnteToken}
            onChange={(e) => setFonnteToken(e.target.value)}
            placeholder="Paste your Fonnte API token here"
            type="password"
          />
          <Input
            label="Default Country Code"
            value={defaultCountryCode}
            onChange={(e) => setDefaultCountryCode(e.target.value)}
            placeholder="e.g. 94"
          />
          <div className="text-xs text-text-muted">
            Get your API token from the Fonnte dashboard.
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Photos</h2>
        <div className="space-y-4">
          <Input
            label="Photos Directory"
            value={photosDir}
            onChange={(e) => setPhotosDir(e.target.value)}
            placeholder="Leave empty for default (%APPDATA%/saraatek/photos)"
          />
          <div className="text-xs text-text-muted">
            Custom directory for repair photos. If empty, photos are stored in the app data folder.
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">AI Assistant (OpenRouter)</h2>
        <div className="space-y-4">
          <Input
            label="OpenRouter API Token"
            value={openrouterApiKey}
            onChange={(e) => setOpenrouterApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
            type="password"
          />
          <Input
            label="Model Name"
            value={openrouterModel}
            onChange={(e) => setOpenrouterModel(e.target.value)}
            placeholder="meta-llama/llama-3.1-8b-instruct:free"
          />
          <div className="text-xs text-text-muted">
            Get your API key from <span className="text-brand-purple">openrouter.ai/keys</span>. Free models are available.
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Technicians</h2>
        <div className="space-y-3 mb-4">
          {technicians.map((tech) => (
            <div key={tech.id} className="flex items-center justify-between py-2 border-b border-border-default last:border-0">
              <div>
                <div className={`text-sm font-medium ${tech.active ? 'text-text-primary' : 'text-text-muted'}`}>{tech.name}</div>
                {tech.phone && <div className="text-xs text-text-muted">{tech.phone}</div>}
              </div>
              <Button variant={tech.active ? 'secondary' : 'ghost'} onClick={() => toggleTech(tech.id)}>
                {tech.active ? 'Active' : 'Inactive'}
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Input placeholder="Technician name" value={newTechName} onChange={(e) => setNewTechName(e.target.value)} className="flex-1" />
          <Input placeholder="Phone (optional)" value={newTechPhone} onChange={(e) => setNewTechPhone(e.target.value)} className="flex-1" />
          <Button onClick={addTechnician}>Add</Button>
        </div>
      </Card>
    </div>
  )
}
