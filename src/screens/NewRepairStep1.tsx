import { useState } from 'react'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { Card } from '../components/Card'
import { ErrorBanner } from '../components/ErrorBanner'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import type { Customer } from '../types'

export function NewRepairStep1() {
  const navigate = useAppStore((s) => s.navigate)
  const [phone, setPhone] = useState('')
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null)
  const [searching, setSearching] = useState(false)
  const [customerType, setCustomerType] = useState('individual')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [address, setAddress] = useState('')
  const [isExisting, setIsExisting] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handlePhoneSearch = async () => {
    if (phone.length < 3) return
    setSearching(true)
    try {
      const customer = await api.customers.search(phone)
      if (customer) {
        setFoundCustomer(customer)
        setIsExisting(true)
        setName(customer.name)
        setCustomerType(customer.type)
        setEmail(customer.email || '')
        setCompanyName(customer.company_name || '')
        setAddress(customer.address || '')
      } else {
        setFoundCustomer(null)
        setIsExisting(false)
      }
    } catch (e) {
      setError('Search failed: ' + String(e))
    } finally {
      setSearching(false)
    }
  }

  const resetNewCustomer = () => {
    setFoundCustomer(null)
    setIsExisting(false)
    setName('')
    setEmail('')
    setCompanyName('')
    setAddress('')
    setCustomerType('individual')
  }

  const handleContinue = async () => {
    if (!name.trim() || phone.length < 3) return
    setCreating(true)
    try {
      let customerId: number
      if (isExisting && foundCustomer) {
        customerId = foundCustomer.id
        if (address.trim()) {
          await api.customers.updateAddress(customerId, address.trim())
        }
      } else {
        const customer = await api.customers.create({
          type: customerType,
          name,
          phone,
          email: email || null,
          company_name: customerType === 'business' ? companyName : null,
        })
        customerId = customer.id
        if (address.trim()) {
          await api.customers.updateAddress(customerId, address.trim())
        }
      }
      navigate('new-repair-step2', { customerId })
    } catch (e) {
      setError('Failed to create customer: ' + String(e))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">New Repair — Step 1</h1>
      <p className="text-sm text-text-secondary">Search by phone number or enter new customer details.</p>
      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      <Card>
        <div className="space-y-4">
          <Input
            label="Phone Number"
            placeholder="e.g. 0123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button onClick={handlePhoneSearch} variant="secondary" loading={searching} disabled={phone.length < 3}>
            Search
          </Button>

          {foundCustomer && (
            <div className="flex items-center justify-between bg-bg-elevated rounded-xl px-4 py-3">
              <div>
                <div className="text-sm font-medium text-accent-green">Existing customer found</div>
                <div className="text-xs text-text-secondary">{foundCustomer.name} — {foundCustomer.phone}</div>
              </div>
              <Button variant="ghost" onClick={resetNewCustomer}>Different customer?</Button>
            </div>
          )}

          <hr className="border-border-default" />

          <div className="flex gap-4">
            <button
              onClick={() => setCustomerType('individual')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                customerType === 'individual' ? 'bg-brand-purple/20 border-brand-purple text-brand-purple' : 'bg-bg-elevated border-border-default text-text-secondary'
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => setCustomerType('business')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                customerType === 'business' ? 'bg-brand-purple/20 border-brand-purple text-brand-purple' : 'bg-bg-elevated border-border-default text-text-secondary'
              }`}
            >
              Business
            </button>
          </div>

          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" />
          {customerType === 'business' && (
            <Input label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          )}
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Optional" />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => navigate('dashboard')}>Cancel</Button>
            <Button onClick={handleContinue} loading={creating} disabled={!name.trim() || phone.length < 3}>
              Continue to Step 2
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
