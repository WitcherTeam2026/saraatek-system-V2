// Unified Tracking System
// Tracks screen navigation for intent prediction and quick access suggestions

import type { Screen } from '../types'

// ── Types ────────────────────────────────────────────────────────────

interface TrackingRecord {
  screen: Screen
  timestamp: number
}

export interface IntentPrediction {
  action: Screen
  confidence: number
  label: string
  icon: string
}

export interface QuickAccessItem {
  screen: Screen
  label: string
  icon: string
  visitCount: number
}

// ── Config ───────────────────────────────────────────────────────────

const STORAGE_KEY = 'saraatek_tracking'
const MAX_HISTORY = 500
const DECAY_FACTOR = 0.95

// ── Screen Metadata ──────────────────────────────────────────────────

const screenMeta: Record<Screen, { label: string; icon: string }> = {
  'dashboard': { label: 'Dashboard', icon: '📊' },
  'new-repair-step1': { label: 'New Repair', icon: '🔧' },
  'new-repair-step2': { label: 'Device Details', icon: '🔧' },
  'repair-detail': { label: 'Repair Detail', icon: '🔧' },
  'repairs-list': { label: 'Repairs', icon: '📋' },
  'settings': { label: 'Settings', icon: '⚙️' },
  'quotation-builder': { label: 'Quotation', icon: '📄' },
  'invoice-builder': { label: 'Invoice', icon: '🧾' },
  'warranty-search': { label: 'Warranty', icon: '🛡️' },
  'reports': { label: 'Reports', icon: '📈' },
  'company-list': { label: 'Companies', icon: '🏢' },
  'company-profile': { label: 'Company Profile', icon: '🏢' },
  'user-management': { label: 'Users', icon: '👤' },
  'accounting': { label: 'Accounting', icon: '💰' },
  'ledger': { label: 'Ledger', icon: '📒' },
  'profit-loss': { label: 'P&L', icon: '📈' },
  'balance-sheet': { label: 'Balance Sheet', icon: '⚖️' },
  'journal-detail': { label: 'Journal Entry', icon: '📒' },
  'opening-balances': { label: 'Opening Balances', icon: '💰' },
  'analytics': { label: 'Analytics', icon: '📉' },
  'revenue-analytics': { label: 'Revenue', icon: '💵' },
  'repair-analytics': { label: 'Repairs', icon: '🔧' },
  'customer-analytics': { label: 'Customers', icon: '👥' },
  'warranty-analytics': { label: 'Warranty', icon: '🛡️' },
  'ai-message': { label: 'AI Messages', icon: '🤖' },
  'communications': { label: 'Messages', icon: '💬' },
  'new-campaign': { label: 'New Campaign', icon: '📢' },
  'documents': { label: 'Documents', icon: '📁' },
  'database-monitor': { label: 'Database', icon: '🗄️' },
}

// ── Core Tracking ────────────────────────────────────────────────────

function getHistory(): TrackingRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function trackNavigation(screen: Screen): void {
  try {
    const history = getHistory()
    history.push({ screen, timestamp: Date.now() })
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // Silently fail
  }
}

export function clearTracking(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// ── Intent Prediction ────────────────────────────────────────────────
// Predicts next likely screen based on frequency + time-of-day patterns

export function predictNextActions(count: number = 3): IntentPrediction[] {
  const history = getHistory()
  if (history.length < 3) return []

  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  // Weighted frequency of actions
  const frequencies: Record<string, number> = {}
  history.forEach((record, index) => {
    const ageInDays = (now - record.timestamp) / dayMs
    const recencyWeight = Math.pow(DECAY_FACTOR, ageInDays)
    const positionWeight = (index + 1) / history.length
    frequencies[record.screen] = (frequencies[record.screen] || 0) + recencyWeight * positionWeight
  })

  // Time-of-day boost
  const currentHour = new Date().getHours()
  const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening'

  const timeFrequencies: Record<string, number> = {}
  history.forEach((record) => {
    const recordHour = new Date(record.timestamp).getHours()
    const recordTimeOfDay = recordHour < 12 ? 'morning' : recordHour < 17 ? 'afternoon' : 'evening'
    if (recordTimeOfDay === timeOfDay) {
      timeFrequencies[record.screen] = (timeFrequencies[record.screen] || 0) + 1.5
    }
  })

  // Combine and sort
  const combined: Record<string, number> = {}
  Object.keys({ ...frequencies, ...timeFrequencies }).forEach((key) => {
    combined[key] = (frequencies[key] || 0) + (timeFrequencies[key] || 0)
  })

  const sorted = Object.entries(combined)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)

  const maxScore = sorted[0]?.[1] || 1

  return sorted.map(([action, score]) => ({
    action: action as Screen,
    confidence: Math.min(score / maxScore, 1),
    label: screenMeta[action as Screen]?.label || action,
    icon: screenMeta[action as Screen]?.icon || '📌',
  }))
}

export function getMostFrequentAction(): Screen | null {
  const predictions = predictNextActions(1)
  return predictions.length > 0 ? predictions[0].action : null
}

// ── Quick Access ─────────────────────────────────────────────────────
// Suggests frequently visited screens from last 2 weeks

const EXCLUDE_SCREENS: Screen[] = [
  'settings', 'user-management', 'opening-balances', 'journal-detail',
  'new-repair-step2', 'repair-detail', 'company-profile', 'new-campaign',
]

export function getQuickAccess(count: number = 4): QuickAccessItem[] {
  const history = getHistory()
  if (history.length < 5) return []

  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000

  const recentVisits = history.filter((v) => now - v.timestamp < weekMs * 2)

  const frequencies: Record<string, number> = {}
  recentVisits.forEach((visit) => {
    const age = now - visit.timestamp
    const recencyBoost = age < weekMs ? 1.5 : 1.0
    frequencies[visit.screen] = (frequencies[visit.screen] || 0) + recencyBoost
  })

  const sorted = Object.entries(frequencies)
    .filter(([screen]) => !EXCLUDE_SCREENS.includes(screen as Screen))
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)

  return sorted.map(([screen, visitCount]) => ({
    screen: screen as Screen,
    label: screenMeta[screen as Screen]?.label || screen,
    icon: screenMeta[screen as Screen]?.icon || '📌',
    visitCount,
  }))
}

export function getVisitCount(screen: Screen): number {
  const history = getHistory()
  return history.filter((v) => v.screen === screen).length
}

export function getMostVisitedScreen(): Screen | null {
  const quickAccess = getQuickAccess(1)
  return quickAccess.length > 0 ? quickAccess[0].screen : null
}
