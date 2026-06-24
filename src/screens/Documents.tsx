import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidPanel, LiquidButton } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { FileText, Plus, Edit3, Trash2, Settings, Palette } from 'lucide-react'
import type { DocumentTemplate } from '../types'
import { mapError } from '../lib/mapError'

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

type Tab = 'templates' | 'letterhead' | 'pdf-template'

export function Documents() {
  const navigate = useAppStore((s) => s.navigate)
  const [tab, setTab] = useState<Tab>('templates')
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)
  const [error, setError] = useState('')

  useEffect(() => {
    mounted.current = true
    loadTemplates()
    return () => { mounted.current = false }
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const t = await api.documents.listTemplates()
      if (mounted.current) setTemplates(t)
    } catch (e) {
      setError(mapError(e))
    } finally {
      if (mounted.current) setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this template?')) return
    try {
      await api.documents.deleteTemplate(id)
      setTemplates(templates.filter((t) => t.id !== id))
    } catch (e) {
      setError(mapError(e))
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'templates', label: 'Templates', icon: <FileText size={16} /> },
    { id: 'letterhead', label: 'Letterhead', icon: <Palette size={16} /> },
    { id: 'pdf-template', label: 'PDF Template', icon: <Settings size={16} /> },
  ]

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">Documents</h1>
          <p className="text-sm text-text-muted">Templates, letterhead, and document management</p>
        </div>
      </motion.div>

      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      {/* Tabs */}
      <motion.div variants={staggerItem} className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              tab === t.id
                ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30'
                : 'text-text-muted hover:bg-white/5 border border-transparent'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      {loading ? (
        <motion.div variants={staggerItem} className="space-y-4">
          {[1,2,3].map((i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
          ))}
        </motion.div>
      ) : (
        <>
          {/* Templates Tab */}
          {tab === 'templates' && (
            <motion.div variants={staggerItem}>
              <LiquidPanel 
                title="Document Templates"
                action={
                  <LiquidButton size="sm" icon={<Plus size={13} />} onClick={() => {}}>
                    New Template
                  </LiquidButton>
                }
              >
                {templates.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-sm text-text-muted">
                    <FileText size={32} className="mb-3 opacity-30" />
                    <p>No templates yet</p>
                    <p className="text-xs mt-1">Create templates for quotations, invoices, and letters</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div key={template.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-white/[0.02] transition-colors border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            template.template_type === 'quotation' ? 'bg-blue-500/20' :
                            template.template_type === 'invoice' ? 'bg-emerald-500/20' :
                            'bg-amber-500/20'
                          }`}>
                            <FileText size={16} className={
                              template.template_type === 'quotation' ? 'text-blue-400' :
                              template.template_type === 'invoice' ? 'text-emerald-400' :
                              'text-amber-400'
                            } />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-text-primary">{template.name}</div>
                            <div className="text-xs text-text-muted capitalize">
                              {template.template_type}
                              {template.is_default && ' • Default'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {}}
                            className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </LiquidPanel>
            </motion.div>
          )}

          {/* Letterhead Tab */}
          {tab === 'letterhead' && (
            <motion.div variants={staggerItem}>
              <LetterheadSettings />
            </motion.div>
          )}

          {/* PDF Template Tab */}
          {tab === 'pdf-template' && (
            <motion.div variants={staggerItem}>
              <PdfTemplateSettings />
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}

function LetterheadSettings() {
  const [logoPath, setLogoPath] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#7C4DFF')
  const [secondaryColor, setSecondaryColor] = useState('#3B82F6')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.documents.getLetterhead().then((settings) => {
      setLogoPath(settings.logo_path || '')
      setCompanyName(settings.company_name || '')
      setAddress(settings.address || '')
      setPhone(settings.phone || '')
      setEmail(settings.email || '')
      setWebsite(settings.website || '')
      setPrimaryColor(settings.primary_color || '#7C4DFF')
      setSecondaryColor(settings.secondary_color || '#3B82F6')
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.documents.saveLetterhead({
        logo_path: logoPath || undefined,
        company_name: companyName || undefined,
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
        website: website || undefined,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      })
      setSuccess('Letterhead settings saved')
    } catch (e) {
      setError(mapError(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <LiquidPanel title="Letterhead Customization">
      {error && <ErrorBanner message={error} onClose={() => setError('')} />}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
          {success}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Logo Path</label>
          <input
            type="text"
            value={logoPath}
            onChange={(e) => setLogoPath(e.target.value)}
            placeholder="C:\path\to\logo.png"
            className="w-full px-3 py-2 rounded-lg text-sm text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="SaraaTEK"
            className="w-full px-3 py-2 rounded-lg text-sm text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, City"
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+94 77 123 4567"
              className="w-full px-3 py-2 rounded-lg text-sm text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@saraatek.lk"
              className="w-full px-3 py-2 rounded-lg text-sm text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Website</label>
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="www.saraatek.lk"
            className="w-full px-3 py-2 rounded-lg text-sm text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Primary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Secondary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30 font-mono"
              />
            </div>
          </div>
        </div>
        <LiquidButton onClick={handleSave} loading={saving}>
          Save Letterhead
        </LiquidButton>
      </div>
    </LiquidPanel>
  )
}

function PdfTemplateSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState<'company' | 'bank' | 'terms' | 'warranty' | 'footer' | 'style'>('company')

  useEffect(() => {
    api.pdfSettings.getAll().then((s) => {
      setSettings(s)
      setLoading(false)
    }).catch((e) => {
      setError(mapError(e))
      setLoading(false)
    })
  }, [])

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const settingsArray = Object.entries(settings).map(([setting_key, setting_value]) => ({
        setting_key,
        setting_value,
      }))
      await api.pdfSettings.saveAll(settingsArray)
      setSuccess('PDF template settings saved')
    } catch (e) {
      setError(mapError(e))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Reset all PDF template settings to defaults?')) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.pdfSettings.reset()
      const s = await api.pdfSettings.getAll()
      setSettings(s)
      setSuccess('Settings reset to defaults')
    } catch (e) {
      setError(mapError(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <LiquidPanel title="PDF Template Settings">
        <div className="space-y-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
          ))}
        </div>
      </LiquidPanel>
    )
  }

  const sections = [
    { id: 'company' as const, label: 'Company Info' },
    { id: 'bank' as const, label: 'Bank Details' },
    { id: 'terms' as const, label: 'Terms & Conditions' },
    { id: 'warranty' as const, label: 'Warranty' },
    { id: 'footer' as const, label: 'Footer' },
    { id: 'style' as const, label: 'Styling' },
  ]

  const inputClass = "w-full px-3 py-2 rounded-lg text-sm text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30"
  const textareaClass = "w-full px-3 py-2 rounded-lg text-sm text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30 resize-none"
  const labelClass = "text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block"

  return (
    <LiquidPanel 
      title="PDF Template Settings"
      action={
        <div className="flex gap-2">
          <LiquidButton size="sm" variant="ghost" onClick={handleReset}>
            Reset Defaults
          </LiquidButton>
          <LiquidButton size="sm" onClick={handleSave} loading={saving}>
            Save Settings
          </LiquidButton>
        </div>
      }
    >
      {error && <ErrorBanner message={error} onClose={() => setError('')} />}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg bg-white/[0.02] border border-white/5">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              activeSection === s.id
                ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30'
                : 'text-text-muted hover:bg-white/5 border border-transparent'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Company Info */}
      {activeSection === 'company' && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Tagline</label>
            <input
              type="text"
              value={settings.tagline || ''}
              onChange={(e) => updateSetting('tagline', e.target.value)}
              placeholder="your dead device has a second life"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Company Name</label>
            <input
              type="text"
              value={settings.company_name || ''}
              onChange={(e) => updateSetting('company_name', e.target.value)}
              placeholder="saraa TEK"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <input
              type="text"
              value={settings.company_address || ''}
              onChange={(e) => updateSetting('company_address', e.target.value)}
              placeholder="539/8 Madamandiya, Dedigamuwa"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={settings.company_email || ''}
                onChange={(e) => updateSetting('company_email', e.target.value)}
                placeholder="saraatek25@gmail.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="text"
                value={settings.company_phone || ''}
                onChange={(e) => updateSetting('company_phone', e.target.value)}
                placeholder="+94 72 2828 100"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bank Details */}
      {activeSection === 'bank' && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Bank Name</label>
            <input
              type="text"
              value={settings.bank_name || ''}
              onChange={(e) => updateSetting('bank_name', e.target.value)}
              placeholder="Commercial Bank"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Account Name</label>
            <input
              type="text"
              value={settings.bank_account_name || ''}
              onChange={(e) => updateSetting('bank_account_name', e.target.value)}
              placeholder="N.G.C.N Ariyarathna"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Account Number</label>
              <input
                type="text"
                value={settings.bank_account_number || ''}
                onChange={(e) => updateSetting('bank_account_number', e.target.value)}
                placeholder="8117011598"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Branch</label>
              <input
                type="text"
                value={settings.bank_branch || ''}
                onChange={(e) => updateSetting('bank_branch', e.target.value)}
                placeholder="Pitakotte"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* Terms & Conditions */}
      {activeSection === 'terms' && (
        <div className="space-y-4">
          {[1,2,3,4,5,6,7].map((num) => (
            <div key={num}>
              <label className={labelClass}>Line {num}</label>
              <input
                type="text"
                value={settings[`terms_line${num}`] || ''}
                onChange={(e) => updateSetting(`terms_line${num}`, e.target.value)}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      )}

      {/* Warranty */}
      {activeSection === 'warranty' && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Warranty Box Text</label>
            <textarea
              value={settings.warranty_box || ''}
              onChange={(e) => updateSetting('warranty_box', e.target.value)}
              rows={3}
              className={textareaClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Authorized Signature Label</label>
              <input
                type="text"
                value={settings.authorized_label || ''}
                onChange={(e) => updateSetting('authorized_label', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Customer Signature Label</label>
              <input
                type="text"
                value={settings.customer_sig_label || ''}
                onChange={(e) => updateSetting('customer_sig_label', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {activeSection === 'footer' && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Footer Address</label>
            <input
              type="text"
              value={settings.footer_address || ''}
              onChange={(e) => updateSetting('footer_address', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Footer Phone</label>
              <input
                type="text"
                value={settings.footer_phone || ''}
                onChange={(e) => updateSetting('footer_phone', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Footer Email</label>
              <input
                type="text"
                value={settings.footer_email || ''}
                onChange={(e) => updateSetting('footer_email', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Footer Company Name</label>
              <input
                type="text"
                value={settings.footer_company || ''}
                onChange={(e) => updateSetting('footer_company', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Footer Location</label>
              <input
                type="text"
                value={settings.footer_location || ''}
                onChange={(e) => updateSetting('footer_location', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* Styling */}
      {activeSection === 'style' && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Custom CSS (advanced)</label>
            <textarea
              value={settings.custom_css || ''}
              onChange={(e) => updateSetting('custom_css', e.target.value)}
              rows={6}
              placeholder="/* Add custom CSS to override template styles */"
              className={`${textareaClass} font-mono text-xs`}
            />
          </div>
          <div>
            <label className={labelClass}>Background Image (base64 or URL)</label>
            <textarea
              value={settings.background_image || ''}
              onChange={(e) => updateSetting('background_image', e.target.value)}
              rows={3}
              placeholder="data:image/png;base64,... or https://..."
              className={`${textareaClass} font-mono text-xs`}
            />
          </div>
        </div>
      )}
    </LiquidPanel>
  )
}

export default Documents
