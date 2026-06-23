import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={inputId} className="text-xs font-medium text-text-secondary tracking-wide">{label}</label>}
        <input ref={ref} id={inputId} className={`bg-bg-inset border ${error ? 'border-semantic-error' : 'border-border-default'} rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 transition-all duration-150 focus:outline-none focus:border-accent-brand focus:ring-1 focus:ring-accent-brand/30 hover:border-border-strong disabled:opacity-50 disabled:cursor-not-allowed ${className}`} {...props} />
        {hint && !error && <span className="text-xs text-text-muted">{hint}</span>}
        {error && <span className="text-xs text-semantic-error">{error}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string; disabled?: boolean }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={selectId} className="text-xs font-medium text-text-secondary tracking-wide">{label}</label>}
        <select ref={ref} id={selectId} className={`bg-bg-inset border ${error ? 'border-semantic-error' : 'border-border-default'} rounded-lg px-3.5 py-2.5 text-sm text-text-primary transition-all duration-150 focus:outline-none focus:border-accent-brand focus:ring-1 focus:ring-accent-brand/30 hover:border-border-strong disabled:opacity-50 disabled:cursor-not-allowed ${className}`} {...props}>
          {options.map((opt) => (<option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>))}
        </select>
        {error && <span className="text-xs text-semantic-error">{error}</span>}
      </div>
    )
  }
)
Select.displayName = 'Select'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={textareaId} className="text-xs font-medium text-text-secondary tracking-wide">{label}</label>}
        <textarea ref={ref} id={textareaId} className={`bg-bg-inset border ${error ? 'border-semantic-error' : 'border-border-default'} rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 transition-all duration-150 focus:outline-none focus:border-accent-brand focus:ring-1 focus:ring-accent-brand/30 hover:border-border-strong disabled:opacity-50 disabled:cursor-not-allowed resize-y min-h-[80px] ${className}`} {...props} />
        {hint && !error && <span className="text-xs text-text-muted">{hint}</span>}
        {error && <span className="text-xs text-semantic-error">{error}</span>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
