import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidButton, LiquidMetric } from '../components/liquid'
import { EmptyState } from '../components/EmptyState'
import { ErrorBanner } from '../components/ErrorBanner'
import { Plus, Search, Building2, Phone, Mail } from 'lucide-react'
import type { Company } from '../types'

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

export function CompanyList() {
  const navigate = useAppStore((s) => s.navigate)
  const [companies, setCompanies] = useState<Company[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)
  const [error, setError] = useState('')

  const loadCompanies = async (search?: string) => {
    setLoading(true)
    try {
      const data = await api.companies.list({ search: search || undefined })
      if (mounted.current) setCompanies(data)
    } catch (e) {
      if (mounted.current) setError('Failed to load: ' + String(e))
    } finally {
      if (mounted.current) setLoading(false)
    }
  }

  useEffect(() => {
    mounted.current = true
    loadCompanies()
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCompanies(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const stats = {
    total: companies.length,
    withPhone: companies.filter(c => c.phone).length,
    withEmail: companies.filter(c => c.email).length,
  }

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tighter font-display">
            Companies
          </h1>
          <p className="text-sm text-text-muted mt-1">Manage your business customers</p>
        </div>
        <LiquidButton icon={<Plus size={16} />} onClick={() => navigate('company-profile')}>
          Add Company
        </LiquidButton>
      </motion.div>

      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      {/* Stats */}
      <motion.div variants={staggerItem} className="grid grid-cols-3 gap-6">
        <LiquidMetric
          label="Total Companies"
          value={stats.total}
          icon={<Building2 size={16} />}
          color="text-brand-purple"
        />
        <LiquidMetric
          label="With Phone"
          value={stats.withPhone}
          icon={<Phone size={16} />}
          color="text-blue-400"
        />
        <LiquidMetric
          label="With Email"
          value={stats.withEmail}
          icon={<Mail size={16} />}
          color="text-emerald-400"
        />
      </motion.div>

      {/* Search */}
      <motion.div variants={staggerItem} className="relative">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10" />
          <input
            placeholder="Search companies by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl pl-11 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          />
        </div>
      </motion.div>

      {/* Companies Table */}
      <motion.div variants={staggerItem}>
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
                ))}
              </div>
            ) : companies.length === 0 ? (
              <EmptyState
                title="No companies yet"
                description="Add your first business customer to get started."
                action={
                  <LiquidButton size="sm" icon={<Plus size={13} />} onClick={() => navigate('company-profile')}>
                    Add Company
                  </LiquidButton>
                }
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Company</th>
                    <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Phone</th>
                    <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Email</th>
                    <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Industry</th>
                    <th className="text-left py-2.5 text-[11px] font-medium text-text-muted uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr
                      key={company.id}
                      onClick={() => navigate('company-profile', { companyId: company.id } as any)}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-purple/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-brand-purple">{company.name.charAt(0)}</span>
                          </div>
                          <span className="font-medium text-text-primary">{company.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-text-secondary tabular-nums">{company.phone}</td>
                      <td className="py-3 pr-3 text-text-secondary">{company.email || '—'}</td>
                      <td className="py-3 pr-3 text-text-secondary">{company.industry || '—'}</td>
                      <td className="py-3 text-text-muted text-xs">{company.created_at?.split(' ')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
