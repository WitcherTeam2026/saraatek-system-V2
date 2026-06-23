// Intent Prediction System
// Tracks user actions and predicts next likely action based on frequency

interface ActionRecord {
  action: string
  timestamp: number
  context?: string
}

interface IntentPrediction {
  action: string
  confidence: number
  label: string
  icon: string
}

const STORAGE_KEY = 'saraatek_user_actions'
const MAX_HISTORY = 200
const DECAY_FACTOR = 0.95 // Older actions weigh less

// Action labels and icons for display
const actionMeta: Record<string, { label: string; icon: string }> = {
  'new-repair': { label: 'New Repair', icon: '🔧' },
  'repairs-list': { label: 'View Repairs', icon: '📋' },
  'dashboard': { label: 'Dashboard', icon: '📊' },
  'reports': { label: 'Reports', icon: '📈' },
  'analytics': { label: 'Analytics', icon: '📉' },
  'company-list': { label: 'Companies', icon: '🏢' },
  'quotation-builder': { label: 'Quotation', icon: '📄' },
  'invoice-builder': { label: 'Invoice', icon: '🧾' },
  'warranty-search': { label: 'Warranty', icon: '🛡️' },
  'accounting': { label: 'Accounting', icon: '💰' },
  'settings': { label: 'Settings', icon: '⚙️' },
  'user-management': { label: 'Users', icon: '👤' },
  'ai-message': { label: 'AI Messages', icon: '🤖' },
}

export function trackAction(action: string, context?: string) {
  try {
    const history = getHistory()
    history.push({
      action,
      timestamp: Date.now(),
      context,
    })
    // Keep only last N entries
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // Silently fail
  }
}

export function getHistory(): ActionRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function predictNextActions(count: number = 3): IntentPrediction[] {
  const history = getHistory()
  if (history.length < 3) return []

  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  // Calculate weighted frequency of actions
  const frequencies: Record<string, number> = {}
  
  history.forEach((record, index) => {
    const age = now - record.timestamp
    const ageInDays = age / dayMs
    const recencyWeight = Math.pow(DECAY_FACTOR, ageInDays)
    const positionWeight = (index + 1) / history.length // Later actions weigh more
    
    frequencies[record.action] = (frequencies[record.action] || 0) + recencyWeight * positionWeight
  })

  // Get time-based patterns (what do they usually do at this time of day?)
  const currentHour = new Date().getHours()
  const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening'
  
  const timeFrequencies: Record<string, number> = {}
  history.forEach((record) => {
    const recordHour = new Date(record.timestamp).getHours()
    const recordTimeOfDay = recordHour < 12 ? 'morning' : recordHour < 17 ? 'afternoon' : 'evening'
    
    if (recordTimeOfDay === timeOfDay) {
      timeFrequencies[record.action] = (timeFrequencies[record.action] || 0) + 1.5 // Boost time-matching actions
    }
  })

  // Combine frequencies
  const combined: Record<string, number> = {}
  Object.keys({ ...frequencies, ...timeFrequencies }).forEach((key) => {
    combined[key] = (frequencies[key] || 0) + (timeFrequencies[key] || 0)
  })

  // Sort by frequency and return top N
  const sorted = Object.entries(combined)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)

  const maxScore = sorted[0]?.[1] || 1

  return sorted.map(([action, score]) => ({
    action,
    confidence: Math.min(score / maxScore, 1),
    label: actionMeta[action]?.label || action,
    icon: actionMeta[action]?.icon || '📌',
  }))
}

export function getMostFrequentAction(): string | null {
  const predictions = predictNextActions(1)
  return predictions.length > 0 ? predictions[0].action : null
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY)
}
