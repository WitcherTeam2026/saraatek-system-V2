import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidCard, LiquidButton, LiquidInput } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { ArrowLeft, Building2, Phone, Mail, Globe, MapPin, CreditCard, Hash, Plus, X } from 'lucide-react'
import type { Contact } from '../types'

export function CompanyProfile() {
  const navigate = useAppStore((s) => s.navigate)
  const companyId = useAppStore((s) => s.selectedCompanyId)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const mounted = useRef(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [taxId, setTaxId] = useState('')
  const [website, setWebsite] = useState('')
  const [industry, setIndustry] = useState('')
  const [notes, setNotes] = useState('')
  const [creditTerms, setCreditTerms] = useState('')

  const [showContactForm, setShowContactForm] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactPosition, setContactPosition] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  useEffect(() => {
    mounted.current = true
    loadData()
    return () => { mounted.current = false }
  }, [companyId])

  const loadData = async () => {
    setLoading(true)
    try {
        if (companyId) {
          const c = await api.companies.get(companyId)
          if (mounted.current && c) {
            setName(c.name)
            setPhone(c.phone)
            setEmail(c.email || '')
            setAddress(c.address || '')
            setTaxId(c.tax_id || '')
            setWebsite(c.website || '')
            setIndustry(c.industry || '')
            setNotes(c.notes || '')
            setCreditTerms(c.credit_terms || '')
            const cl = await api.contacts.list(companyId)
            if (mounted.current) setContacts(cl)
          }
        }
    } catch (e) {
      if (mounted.current) setError('Failed to load: ' + String(e))
    } finally {
      if (mounted.current) setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Name and phone are required')
      return
    }
    setSaving(true)
    try {
      if (companyId) {
        await api.companies.update({
          id: companyId,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          address: address.trim() || null,
          tax_id: taxId.trim() || null,
          website: website.trim() || null,
          industry: industry.trim() || null,
          notes: notes.trim() || null,
          credit_terms: creditTerms.trim() || null,
        })
      } else {
        const newCompany = await api.companies.create({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          address: address.trim() || null,
          tax_id: taxId.trim() || null,
          website: website.trim() || null,
          industry: industry.trim() || null,
          notes: notes.trim() || null,
          credit_terms: creditTerms.trim() || null,
        })
        if (mounted.current) navigate('company-profile', { companyId: newCompany.id })
      }
    } catch (e) {
      if (mounted.current) setError('Failed to save: ' + String(e))
    } finally {
      if (mounted.current) setSaving(false)
    }
  }

  const handleAddContact = async () => {
    if (!contactName.trim() || !contactPhone.trim()) return
    try {
      await api.contacts.create({
        company_id: companyId!,
        name: contactName.trim(),
        phone: contactPhone.trim(),
        position: contactPosition.trim() || null,
        email: contactEmail.trim() || null,
        is_primary: contacts.length === 0,
      })
      setShowContactForm(false)
      setContactName('')
      setContactPosition('')
      setContactPhone('')
      setContactEmail('')
      loadData()
    } catch (e) {
      if (mounted.current) setError('Failed to add contact: ' + String(e))
    }
  }

  if (loading && companyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('company-list')}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">
            {companyId ? 'Edit Company' : 'New Company'}
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {companyId ? 'Update company information' : 'Add a new business customer'}
          </p>
        </div>
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      <div className="grid grid-cols-2 gap-6">
        <LiquidCard>
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Company Information</h3>

            <LiquidInput label="Company Name" value={name} onChange={setName} icon={<Building2 size={16} />} />
            <LiquidInput label="Phone Number" value={phone} onChange={setPhone} icon={<Phone size={16} />} />
            <LiquidInput label="Email" value={email} onChange={setEmail} type="email" icon={<Mail size={16} />} />
            <LiquidInput label="Address" value={address} onChange={setAddress} icon={<MapPin size={16} />} />
            <LiquidInput label="Tax ID" value={taxId} onChange={setTaxId} icon={<Hash size={16} />} />
            <LiquidInput label="Website" value={website} onChange={setWebsite} icon={<Globe size={16} />} />
            <LiquidInput label="Industry" value={industry} onChange={setIndustry} />
            <LiquidInput label="Credit Terms" value={creditTerms} onChange={setCreditTerms} icon={<CreditCard size={16} />} hint="e.g., Net 30, Net 60" />

            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none h-24"
                style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                placeholder="Internal notes about this company..."
              />
            </div>
          </div>
        </LiquidCard>

        <LiquidCard>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Contact Persons</h3>
              {companyId && (
                <LiquidButton size="sm" icon={<Plus size={13} />} onClick={() => setShowContactForm(true)}>
                  Add
                </LiquidButton>
              )}
            </div>

            {showContactForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-4 rounded-xl space-y-3"
                style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">New Contact</span>
                  <button onClick={() => setShowContactForm(false)} className="text-text-muted hover:text-text-primary">
                    <X size={14} />
                  </button>
                </div>
                <input placeholder="Name" value={contactName} onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm bg-inset border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-purple/30" />
                <input placeholder="Position" value={contactPosition} onChange={(e) => setContactPosition(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm bg-inset border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-purple/30" />
                <input placeholder="Phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm bg-inset border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-purple/30" />
                <input placeholder="Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm bg-inset border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-purple/30" />
                <LiquidButton size="sm" onClick={handleAddContact}>Save Contact</LiquidButton>
              </motion.div>
            )}

            {contacts.length === 0 ? (
              <div className="text-sm text-text-muted py-4 text-center">
                {companyId ? 'No contacts yet. Add one above.' : 'Save the company first to add contacts.'}
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="p-3 rounded-xl flex items-center justify-between"
                    style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">{contact.name}</span>
                        {contact.is_primary && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple">Primary</span>
                        )}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {contact.position && <span>{contact.position} · </span>}
                        {contact.phone}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </LiquidCard>
      </div>

      <div className="flex justify-end gap-3">
        <LiquidButton variant="secondary" onClick={() => navigate('company-list')}>Cancel</LiquidButton>
        <LiquidButton onClick={handleSave} loading={saving}>{companyId ? 'Save Changes' : 'Create Company'}</LiquidButton>
      </div>
    </motion.div>
  )
}
