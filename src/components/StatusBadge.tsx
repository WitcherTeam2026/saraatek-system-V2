import { STATUS_CONFIG } from '../types'

const colorMap: Record<string, string> = {
  gray: 'bg-gray-500/10 text-gray-300 border-gray-500/20',
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  blue: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  green: 'bg-green-500/10 text-green-300 border-green-500/20',
  red: 'bg-red-500/10 text-red-300 border-red-500/20',
}

const dotMap: Record<string, string> = {
  gray: 'bg-gray-400', amber: 'bg-amber-400', blue: 'bg-blue-400',
  purple: 'bg-purple-400', green: 'bg-green-400', red: 'bg-red-400',
}

export function StatusBadge({ status, onClick }: { status: string; onClick?: () => void }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'gray' as const }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorMap[config.color]} ${onClick ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`} onClick={onClick}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotMap[config.color]}`} />
      {config.label}
    </span>
  )
}
