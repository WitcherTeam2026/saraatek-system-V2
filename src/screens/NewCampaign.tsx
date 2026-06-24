import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidPanel, LiquidButton } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { ArrowLeft, CheckCircle2, MessageSquare, Mail } from 'lucide-react'
import type { Customer } from '../types'
import { mapError } from '../lib/mapError'

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

export function NewCampaign() {
  const navigate = useAppStore((s) => s.navigate)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [channel, setChannel] = useState('whatsapp')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([])
  const [sendToAll, setSendToAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const mounted = useRef(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    mounted.current = true
    api.customers.search('').then((c) => {
      if (mounted.current && c) setCustomers([c])
    }).catch(() => {})
    setLoading(false)
    return () => { mounted.current = false }
  }, [])

  const handleCreate = async () => {
    if (!name.trim() || !message.trim()) {
      setError('Please fill in campaign name and message')
      return
    }
    setCreating(true)
    setError('')
    try {
      await api.campaigns.create({
        name: name.trim(),
        message: message.trim(),
        channel,
        customer_ids: sendToAll ? undefined : selectedCustomers,
        send_to_all: sendToAll,
      })
      setSuccess(true)
      setTimeout(() => navigate('communications'), 1500)
    } catch (e) {
      setError(mapError(e))
    } finally {
      setCreating(false)
    }
  }

  const toggleCustomer = (id: number) => {
    setSelectedCustomers((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  if (success) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[60vh]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <CheckCircle2 size={64} className="text-emerald-400 mb-4" />
        <h2 className="text-xl font-bold text-text-primary">Campaign Created!</h2>
        <p className="text-sm text-text-muted mt-2">Redirecting to Communications...</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="space-y-6 max-w-2xl"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center gap-4">
        <button
          onClick={() => navigate('communications')}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={18} className="text-text-muted" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">New Campaign</h1>
          <p className="text-sm text-text-muted">Send bulk messages to customers</p>
        </div>
      </motion.div>

      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      {/* Campaign Details */}
      <motion.div variants={staggerItem}>
        <LiquidPanel title="Campaign Details">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Campaign Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Holiday Sale, Service Reminder"
                className="w-full px-3 py-2 rounded-lg text-sm text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Channel</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setChannel('whatsapp')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                    channel === 'whatsapp'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 text-text-muted border border-transparent hover:bg-white/10'
                  }`}
                >
                  <MessageSquare size={14} />
                  WhatsApp
                </button>
                <button
                  onClick={() => setChannel('email')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                    channel === 'email'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-white/5 text-text-muted border border-transparent hover:bg-white/10'
                  }`}
                >
                  <Mail size={14} />
                  Email
                </button>
                <button
                  onClick={() => setChannel('sms')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                    channel === 'sms'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-white/5 text-text-muted border border-transparent hover:bg-white/10'
                  }`}
                >
                  SMS
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={5}
                className="w-full px-3 py-2 rounded-lg text-sm text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30 resize-none"
              />
              <p className="text-xs text-text-muted mt-1">{message.length} characters</p>
            </div>
          </div>
        </LiquidPanel>
      </motion.div>

      {/* Recipients */}
      <motion.div variants={staggerItem}>
        <LiquidPanel title="Recipients">
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.02] cursor-pointer">
              <input
                type="checkbox"
                checked={sendToAll}
                onChange={(e) => {
                  setSendToAll(e.target.checked)
                  if (e.target.checked) setSelectedCustomers([])
                }}
                className="accent-brand-purple"
              />
              <div>
                <span className="text-sm text-text-primary">Send to all customers</span>
                <p className="text-xs text-text-muted">Will send to every customer in the system</p>
              </div>
            </label>

            {!sendToAll && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="text-sm text-text-muted">Loading customers...</div>
                ) : customers.length === 0 ? (
                  <div className="text-sm text-text-muted">No customers found</div>
                ) : (
                  customers.map((customer) => (
                    <label
                      key={customer.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => toggleCustomer(customer.id)}
                        className="accent-brand-purple"
                      />
                      <div>
                        <span className="text-sm text-text-primary">{customer.name}</span>
                        <span className="text-xs text-text-muted ml-2">{customer.phone}</span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}

            <p className="text-xs text-text-muted">
              {sendToAll 
                ? `Will send to all ${customers.length} customers`
                : `${selectedCustomers.length} customers selected`
              }
            </p>
          </div>
        </LiquidPanel>
      </motion.div>

      {/* Actions */}
      <motion.div variants={staggerItem} className="flex gap-3">
        <LiquidButton onClick={handleCreate} loading={creating}>
          Create Campaign
        </LiquidButton>
        <LiquidButton variant="secondary" onClick={() => navigate('communications')}>
          Cancel
        </LiquidButton>
      </motion.div>
    </motion.div>
  )
}

export default NewCampaign
