import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidPanel, LiquidButton, LiquidMetric } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { MessageSquare, Mail, Users, BarChart3, Plus, Search, Clock, CheckCircle2, XCircle } from 'lucide-react'
import type { IncomingMessage, Campaign } from '../types'
import { mapError } from '../lib/mapError'

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

type Tab = 'inbox' | 'campaigns' | 'settings'

export function Communications() {
  const navigate = useAppStore((s) => s.navigate)
  const [tab, setTab] = useState<Tab>('inbox')
  const [messages, setMessages] = useState<IncomingMessage[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)
  const [error, setError] = useState('')

  useEffect(() => {
    mounted.current = true
    loadData()
    return () => { mounted.current = false }
  }, [tab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === 'inbox') {
        const msgs = await api.twoWay.getIncoming(undefined, 50)
        if (mounted.current) setMessages(msgs)
      } else if (tab === 'campaigns') {
        const camps = await api.campaigns.list()
        if (mounted.current) setCampaigns(camps)
      }
    } catch (e) {
      setError(mapError(e))
    } finally {
      if (mounted.current) setLoading(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'inbox', label: 'Inbox', icon: <MessageSquare size={16} />, count: messages.length },
    { id: 'campaigns', label: 'Campaigns', icon: <BarChart3 size={16} />, count: campaigns.length },
    { id: 'settings', label: 'SMS Settings', icon: <Mail size={16} /> },
  ]

  const unreadCount = messages.filter((m) => m.status === 'received').length

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
          <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">Communications</h1>
          <p className="text-sm text-text-muted">Messages, campaigns, and SMS</p>
        </div>
      </motion.div>

      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      {/* Quick Stats */}
      {tab === 'inbox' && !loading && (
        <motion.div variants={staggerItem} className="grid grid-cols-4 gap-4">
          <LiquidMetric
            label="Total Messages"
            value={messages.length}
            icon={<MessageSquare size={16} />}
            color="text-blue-400"
          />
          <LiquidMetric
            label="Unread"
            value={unreadCount}
            icon={<Mail size={16} />}
            color="text-amber-400"
          />
          <LiquidMetric
            label="Campaigns"
            value={campaigns.length}
            icon={<BarChart3 size={16} />}
            color="text-purple-400"
          />
          <LiquidMetric
            label="Quick Actions"
            value="3"
            icon={<Users size={16} />}
            color="text-emerald-400"
          />
        </motion.div>
      )}

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
            {t.count !== undefined && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10">{t.count}</span>
            )}
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
          {/* Inbox Tab */}
          {tab === 'inbox' && (
            <motion.div variants={staggerItem}>
              <LiquidPanel 
                title="Incoming Messages"
                action={
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Search messages..."
                        className="pl-9 pr-3 py-1.5 rounded-lg text-xs text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30 w-48"
                      />
                    </div>
                  </div>
                }
              >
                {messages.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-sm text-text-muted">
                    <MessageSquare size={32} className="mb-3 opacity-30" />
                    <p>No incoming messages yet</p>
                    <p className="text-xs mt-1">Messages from customers will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                          msg.status === 'received' 
                            ? 'bg-brand-purple/5 hover:bg-brand-purple/10 border-l-2 border-brand-purple' 
                            : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          msg.channel === 'whatsapp' ? 'bg-emerald-500/20' : 'bg-blue-500/20'
                        }`}>
                          {msg.channel === 'whatsapp' ? (
                            <MessageSquare size={16} className="text-emerald-400" />
                          ) : (
                            <Mail size={16} className="text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-text-primary">
                              {msg.customer_name || msg.customer_phone}
                            </span>
                            <span className="text-xs text-text-muted flex items-center gap-1">
                              <Clock size={10} />
                              {msg.received_at}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary truncate mt-0.5">{msg.message}</p>
                          {msg.repair_id && (
                            <span className="text-xs text-brand-purple mt-1 inline-block">
                              Repair: {msg.repair_id}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </LiquidPanel>
            </motion.div>
          )}

          {/* Campaigns Tab */}
          {tab === 'campaigns' && (
            <motion.div variants={staggerItem}>
              <LiquidPanel 
                title="Marketing Campaigns"
                action={
                  <LiquidButton size="sm" icon={<Plus size={13} />} onClick={() => navigate('new-campaign')}>
                    New Campaign
                  </LiquidButton>
                }
              >
                {campaigns.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-sm text-text-muted">
                    <BarChart3 size={32} className="mb-3 opacity-30" />
                    <p>No campaigns yet</p>
                    <p className="text-xs mt-1">Create your first campaign to reach customers</p>
                    <LiquidButton size="sm" className="mt-4" onClick={() => navigate('new-campaign')}>
                      Create Campaign
                    </LiquidButton>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {campaigns.map((camp) => (
                      <div key={camp.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-white/[0.02] transition-colors border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            camp.channel === 'whatsapp' ? 'bg-emerald-500/20' : 'bg-blue-500/20'
                          }`}>
                            {camp.channel === 'whatsapp' ? (
                              <MessageSquare size={16} className="text-emerald-400" />
                            ) : (
                              <Mail size={16} className="text-blue-400" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-text-primary">{camp.name}</div>
                            <div className="text-xs text-text-muted">
                              {camp.channel.charAt(0).toUpperCase() + camp.channel.slice(1)} • {camp.total_recipients} recipients
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 size={12} />
                                {camp.sent_count} sent
                              </span>
                              {camp.failed_count > 0 && (
                                <span className="flex items-center gap-1 text-red-400">
                                  <XCircle size={12} />
                                  {camp.failed_count} failed
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            camp.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                            camp.status === 'sending' ? 'bg-amber-500/20 text-amber-400' :
                            camp.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-white/10 text-text-muted'
                          }`}>
                            {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </LiquidPanel>
            </motion.div>
          )}

          {/* SMS Settings Tab */}
          {tab === 'settings' && (
            <motion.div variants={staggerItem}>
              <SmsSettings />
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}

function SmsSettings() {
  const [provider, setProvider] = useState('twilio')
  const [apiKey, setApiKey] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [senderId, setSenderId] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.sms.getConfig().then((config) => {
      setProvider(config.provider || 'twilio')
      setApiKey(config.api_key || '')
      setApiUrl(config.api_url || '')
      setSenderId(config.sender_id || '')
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.sms.saveConfig(provider, apiKey, apiUrl, senderId)
      setSuccess('SMS settings saved successfully')
    } catch (e) {
      setError(mapError(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <LiquidPanel title="SMS Configuration">
      {error && <ErrorBanner message={error} onClose={() => setError('')} />}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 flex items-center gap-2">
          <CheckCircle2 size={14} />
          {success}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">SMS Provider</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30"
          >
            <option value="twilio">Twilio</option>
            <option value="textlocal">TextLocal</option>
            <option value="generic">Generic API</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Your SMS API key"
            className="w-full px-3 py-2 rounded-lg text-sm text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30"
          />
        </div>
        {provider === 'generic' && (
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">API URL</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.smsprovider.com/send"
              className="w-full px-3 py-2 rounded-lg text-sm text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30"
            />
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Sender ID</label>
          <input
            type="text"
            value={senderId}
            onChange={(e) => setSenderId(e.target.value)}
            placeholder="SaraaTEK"
            className="w-full px-3 py-2 rounded-lg text-sm text-text-primary bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-brand-purple/30"
          />
        </div>
        <LiquidButton onClick={handleSave} loading={saving}>
          Save SMS Settings
        </LiquidButton>
      </div>
    </LiquidPanel>
  )
}

export default Communications
