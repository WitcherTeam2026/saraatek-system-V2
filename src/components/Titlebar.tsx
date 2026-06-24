import { useAppStore } from '../stores/app'
import { getCurrentWindow } from '@tauri-apps/api/window'
import type { Screen } from '../types'

const screenTitles: Record<Screen, string> = {
  dashboard: 'Dashboard',
  'new-repair-step1': 'New Repair',
  'new-repair-step2': 'Device Details',
  'repair-detail': 'Repair Detail',
  'repairs-list': 'All Repairs',
  'quotation-builder': 'Quotation Builder',
  'invoice-builder': 'Invoice Builder',
  'warranty-search': 'Warranty Claim',
  reports: 'Reports',
  settings: 'Settings',
  'company-list': 'Companies',
  'company-profile': 'Company Profile',
  'user-management': 'User Management',
  accounting: 'Accounting',
  ledger: 'Ledger',
  'profit-loss': 'Profit & Loss',
  'balance-sheet': 'Balance Sheet',
  'journal-detail': 'Journal Entry',
  'opening-balances': 'Opening Balances',
  analytics: 'Analytics',
  'revenue-analytics': 'Revenue Analytics',
  'repair-analytics': 'Repair Analytics',
  'customer-analytics': 'Customer Analytics',
  'warranty-analytics': 'Warranty Analytics',
  'ai-message': 'AI Message',
  communications: 'Communications',
  'new-campaign': 'New Campaign',
  documents: 'Documents',
  'database-monitor': 'Database',
}

const appWindow = getCurrentWindow()

export function Titlebar() {
  const currentScreen = useAppStore((s) => s.currentScreen)
  const title = screenTitles[currentScreen] || 'SaraaTEK'

  return (
    <div
      className="h-12 relative flex items-center justify-between select-none shrink-0"
      data-tauri-drag-region
    >
      {/* Glass background */}
      <div
        className="absolute inset-0 border-b border-white/[0.06]"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      />

      {/* Left: Breadcrumb */}
      <div className="relative z-10 flex items-center gap-3 pl-5" data-tauri-drag-region>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
          <span className="text-sm font-medium text-text-secondary font-display tracking-tight">
            SaraaTEK
          </span>
          <span className="text-text-muted/30 text-sm">/</span>
          <span className="text-sm text-text-primary font-medium">{title}</span>
        </div>
      </div>

      {/* Center: Drag Region */}
      <div className="flex-1 h-full" data-tauri-drag-region />

      {/* Right: Window Controls */}
      <div className="relative z-10 flex items-center h-full">
        <button
          onClick={() => appWindow.minimize()}
          className="w-12 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-all duration-150"
          title="Minimize"
          aria-label="Minimize window"
          data-tauri-drag-region={false}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <rect x="2" y="5.5" width="8" height="1" rx="0.5" fill="currentColor" />
          </svg>
        </button>

        <button
          onClick={() => appWindow.toggleMaximize()}
          className="w-12 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-all duration-150"
          title="Maximize"
          aria-label="Maximize or restore window"
          data-tauri-drag-region={false}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <rect x="2" y="2" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>

        <button
          onClick={() => appWindow.close()}
          className="w-12 h-full flex items-center justify-center text-text-muted hover:text-white hover:bg-red-500/80 transition-all duration-150"
          title="Close"
          aria-label="Close window"
          data-tauri-drag-region={false}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
