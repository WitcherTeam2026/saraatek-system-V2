import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../stores/app'
import { getAuthUser } from '../lib/secureStore'
import {
  LayoutDashboard, Plus, Wrench, ShieldCheck, FileText, Receipt, Building2,
  Settings, ChevronRight, PanelRightClose, PanelRightOpen, HardDrive,
  BookOpen, TrendingUp, MessageSquare, FileStack, Database, Users,
} from 'lucide-react'

const navGroups: {
  label: string | null
  items: { screen: string; label: string; icon: React.ReactNode }[]
}[] = [
  {
    label: null,
    items: [{ screen: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> }],
  },
  {
    label: 'Operations',
    items: [
      { screen: 'new-repair-step1', label: 'New Repair', icon: <Plus size={18} /> },
      { screen: 'repairs-list', label: 'Repairs', icon: <Wrench size={18} /> },
      { screen: 'warranty-search', label: 'Warranty', icon: <ShieldCheck size={18} /> },
    ],
  },
  {
    label: 'Business',
    items: [
      { screen: 'company-list', label: 'Companies', icon: <Building2 size={18} /> },
      { screen: 'quotation-builder', label: 'Quotations', icon: <FileText size={18} /> },
      { screen: 'invoice-builder', label: 'Invoices', icon: <Receipt size={18} /> },
      { screen: 'accounting', label: 'Accounting', icon: <BookOpen size={18} /> },
      { screen: 'communications', label: 'Messages', icon: <MessageSquare size={18} /> },
      { screen: 'documents', label: 'Documents', icon: <FileStack size={18} /> },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { screen: 'analytics', label: 'Analytics', icon: <TrendingUp size={18} /> },
    ],
  },
  {
    label: 'System',
    items: [
      { screen: 'database-monitor', label: 'Database', icon: <Database size={18} /> },
      { screen: 'backup', label: 'Backup', icon: <HardDrive size={18} /> },
      { screen: 'settings', label: 'Settings', icon: <Settings size={18} /> },
      { screen: 'user-management', label: 'Users', icon: <Users size={18} />, adminOnly: true },
    ],
  },
]

export function Sidebar() {
  const currentScreen = useAppStore((s) => s.currentScreen)
  const navigate = useAppStore((s) => s.navigate)
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  )
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    getAuthUser().then((u) => {
      try {
        setIsAdmin(JSON.parse(u).role === 'admin')
      } catch {
        setIsAdmin(false)
      }
    })
  }, [])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  return (
    <aside
      className={`${
        collapsed ? 'w-[60px]' : 'w-[220px]'
      } relative flex flex-col shrink-0 transition-[width] duration-300 ease-out`}
    >
      {/* Glass background */}
      <div className="absolute inset-0 border-r border-white/[0.06]"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      />

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(124, 77, 255, 0.03) 0%, transparent 30%)',
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className={`h-14 flex items-center border-b border-white/[0.06] ${collapsed ? 'justify-center' : 'px-4'}`}>
          {collapsed ? (
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-brand-purple to-brand-purple-hover flex items-center justify-center shadow-lg shadow-brand-purple/20">
              <img src="/logo.svg" alt="S" className="w-5 h-5 object-contain" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-brand-purple to-brand-purple-hover flex items-center justify-center shadow-lg shadow-brand-purple/20">
                <img src="/logo.svg" alt="SaraaTEK" className="w-5 h-5 object-contain" />
              </div>
              <div>
                <span className="text-sm font-bold text-text-primary font-display tracking-tight block">SaraaTEK</span>
                <span className="text-[10px] text-text-muted">Repair Management</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-6 overflow-y-auto overflow-x-hidden">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {group.label && !collapsed && (
                <div className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-text-muted/50 uppercase">
                  {group.label}
                </div>
              )}
              {group.items
                .filter((item) => !(item as any).adminOnly || isAdmin)
                .map((item) => {
                const isActive = currentScreen === item.screen
                const isHovered = hoveredItem === item.screen
                return (
                  <motion.button
                    key={item.screen}
                    onClick={() => navigate(item.screen)}
                    onMouseEnter={() => setHoveredItem(item.screen)}
                    onMouseLeave={() => setHoveredItem(null)}
                    whileTap={{ scale: 0.98 }}
                    className={`relative w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      collapsed ? 'justify-center py-2.5' : 'px-3 py-2.5'
                    } ${
                      isActive
                        ? 'text-brand-purple'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* Active background */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 rounded-xl bg-brand-purple/10 border border-brand-purple/20"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}

                    {/* Hover background */}
                    {isHovered && !isActive && (
                      <div className="absolute inset-0 rounded-xl bg-white/[0.04]" />
                    )}

                    {/* Icon */}
                    <span className={`relative z-10 shrink-0 transition-colors duration-200 ${isActive ? 'text-brand-purple' : 'text-text-muted'}`}>
                      {item.icon}
                    </span>

                    {/* Label */}
                    {!collapsed && (
                      <span className="relative z-10 flex-1 text-left truncate">{item.label}</span>
                    )}

                    {/* Active indicator */}
                    {isActive && !collapsed && (
                      <ChevronRight size={14} className="relative z-10 text-brand-purple shrink-0" />
                    )}
                  </motion.button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Collapse button */}
        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={toggle}
            className={`w-full flex items-center gap-3 rounded-xl py-2.5 text-sm text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all duration-200 ${collapsed ? 'justify-center' : 'px-3'}`}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}
