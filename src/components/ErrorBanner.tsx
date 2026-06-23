import { XCircle } from 'lucide-react'

interface Props { message: string; onClose?: () => void }

export function ErrorBanner({ message, onClose }: Props) {
  return (
    <div className="flex items-start gap-3 bg-semantic-error-subtle border border-semantic-error/20 rounded-lg px-4 py-3 text-sm text-semantic-error">
      <XCircle size={16} className="mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onClose && <button onClick={onClose} className="hover:opacity-70 transition-opacity"><XCircle size={14} /></button>}
    </div>
  )
}
