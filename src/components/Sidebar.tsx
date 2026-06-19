import { useAppStore } from '../stores/app'

const navItems = [
  { screen: 'dashboard', label: 'Dashboard', icon: '◉' },
  { screen: 'new-repair-step1', label: 'New Repair', icon: '+' },
  { screen: 'repairs-list', label: 'All Repairs', icon: '☰' },
  { screen: 'reports', label: 'Reports', icon: '📊' },
  { screen: 'warranty-search', label: 'Warranty Claim', icon: '✓' },
  { screen: 'settings', label: 'Settings', icon: '⚙' },
]

export function Sidebar() {
  const currentScreen = useAppStore((s) => s.currentScreen)
  const navigate = useAppStore((s) => s.navigate)

  return (
    <aside className="w-56 bg-bg-surface border-r border-border-default flex flex-col shrink-0">
      <div className="p-4 border-b border-border-default">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-purple flex items-center justify-center text-white text-xs font-bold">S</div>
          <div>
            <div className="text-sm font-semibold text-text-primary">SaraaTEK</div>
            <div className="text-xs text-text-muted">Repair Management</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.screen}
            onClick={() => navigate(item.screen)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentScreen === item.screen
                ? 'bg-brand-purple/20 text-brand-purple'
                : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
