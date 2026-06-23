import { useToastStore } from '../stores/toast'
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'

const iconMap = {
  success: <CheckCircle2 size={16} />,
  error: <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
}

const bgMap = {
  success: 'bg-semantic-success-subtle border-semantic-success/20 text-semantic-success',
  error: 'bg-semantic-error-subtle border-semantic-error/20 text-semantic-error',
  warning: 'bg-semantic-warning-subtle border-semantic-warning/20 text-semantic-warning',
  info: 'bg-semantic-info-subtle border-semantic-info/20 text-semantic-info',
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-20 right-5 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div key={toast.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm shadow-overlay animate-in slide-in-from-right ${bgMap[toast.variant]}`}>
          {iconMap[toast.variant]}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="opacity-60 hover:opacity-100 transition-opacity"><XCircle size={14} /></button>
        </div>
      ))}
    </div>
  )
}
