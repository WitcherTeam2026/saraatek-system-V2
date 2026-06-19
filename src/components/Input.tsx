interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm text-text-secondary">{label}</label>}
      <input
        className={`bg-bg-elevated border ${error ? 'border-accent-red' : 'border-border-default'} rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-purple transition-colors ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-accent-red">{error}</span>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm text-text-secondary">{label}</label>}
      <select
        className={`bg-bg-elevated border ${error ? 'border-accent-red' : 'border-border-default'} rounded-xl px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-purple transition-colors ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className="text-xs text-accent-red">{error}</span>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm text-text-secondary">{label}</label>}
      <textarea
        className={`bg-bg-elevated border ${error ? 'border-accent-red' : 'border-border-default'} rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-purple transition-colors resize-y min-h-[80px] ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-accent-red">{error}</span>}
    </div>
  )
}
