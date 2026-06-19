import { STATUS_CONFIG } from '../types'

const colorMap: Record<string, string> = {
  gray: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  green: 'bg-green-500/20 text-green-300 border-green-500/30',
  red: 'bg-red-500/20 text-red-300 border-red-500/30',
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'gray' }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorMap[config.color]}`}>
      {config.label}
    </span>
  )
}
