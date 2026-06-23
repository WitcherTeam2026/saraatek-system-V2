// Adaptive Layout System
// Tracks screen visit frequency and provides quick access suggestions

interface ScreenVisit {
  screen: string
  timestamp: number
}

interface QuickAccessItem {
  screen: string
  label: string
  icon: string
  visitCount: number
}

const STORAGE_KEY = 'saraatek_screen_visits'
const MAX_VISITS = 500

const screenMeta: Record<string, { label: string; icon: string }> = {
  'dashboard': { label: 'Dashboard', icon: 'LayoutDashboard' },
  'new-repair-step1': { label: 'New Repair', icon: 'Plus' },
  'repairs-list': { label: 'Repairs', icon: 'Wrench' },
  'reports': { label: 'Reports', icon: 'BarChart3' },
  'analytics': { label: 'Analytics', icon: 'TrendingUp' },
  'company-list': { label: 'Companies', icon: 'Building2' },
  'quotation-builder': { label: 'Quotations', icon: 'FileText' },
  'invoice-builder': { label: 'Invoices', icon: 'Receipt' },
  'warranty-search': { label: 'Warranty', icon: 'ShieldCheck' },
  'accounting': { label: 'Accounting', icon: 'BookOpen' },
  'settings': { label: 'Settings', icon: 'Settings' },
  'user-management': { label: 'Users', icon: 'Users' },
  'ai-message': { label: 'AI Messages', icon: 'Bot' },
  'revenue-analytics': { label: 'Revenue', icon: 'DollarSign' },
  'repair-analytics': { label: 'Repairs', icon: 'Wrench' },
  'customer-analytics': { label: 'Customers', icon: 'Users' },
  'warranty-analytics': { label: 'Warranty', icon: 'ShieldCheck' },
  'ledger': { label: 'Ledger', icon: 'BookOpen' },
  'profit-loss': { label: 'P&L', icon: 'TrendingUp' },
  'balance-sheet': { label: 'Balance Sheet', icon: 'Scale' },
}

export function trackScreenVisit(screen: string) {
  try {
    const visits = getVisits()
    visits.push({
      screen,
      timestamp: Date.now(),
    })
    if (visits.length > MAX_VISITS) {
      visits.splice(0, visits.length - MAX_VISITS)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits))
  } catch {
    // Silently fail
  }
}

function getVisits(): ScreenVisit[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getQuickAccess(count: number = 4): QuickAccessItem[] {
  const visits = getVisits()
  if (visits.length < 5) return []

  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000

  // Only consider visits from last 2 weeks, with recency boost
  const recentVisits = visits.filter((v) => now - v.timestamp < weekMs * 2)

  const frequencies: Record<string, number> = {}
  recentVisits.forEach((visit) => {
    const age = now - visit.timestamp
    const recencyBoost = age < weekMs ? 1.5 : 1.0
    frequencies[visit.screen] = (frequencies[visit.screen] || 0) + recencyBoost
  })

  // Exclude certain screens from quick access
  const excludeScreens = ['settings', 'user-management', 'opening-balances', 'journal-detail']
  
  const sorted = Object.entries(frequencies)
    .filter(([screen]) => !excludeScreens.includes(screen))
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)

  return sorted.map(([screen, visitCount]) => ({
    screen,
    label: screenMeta[screen]?.label || screen,
    icon: screenMeta[screen]?.icon || 'Circle',
    visitCount,
  }))
}

export function getVisitCount(screen: string): number {
  const visits = getVisits()
  return visits.filter((v) => v.screen === screen).length
}

export function getMostVisitedScreen(): string | null {
  const quickAccess = getQuickAccess(1)
  return quickAccess.length > 0 ? quickAccess[0].screen : null
}

export function clearVisits() {
  localStorage.removeItem(STORAGE_KEY)
}
