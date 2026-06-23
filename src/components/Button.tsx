import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  icon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent-brand hover:bg-accent-brand-hover active:bg-accent-brand-active text-white shadow-sm shadow-accent-brand/15 hover:shadow-accent-brand/25',
  secondary: 'bg-bg-raised hover:bg-bg-hover border border-border-default text-text-primary hover:border-border-strong',
  ghost: 'hover:bg-bg-hover text-text-secondary hover:text-text-primary',
  danger: 'bg-semantic-error-subtle hover:bg-semantic-error/25 text-semantic-error border border-semantic-error/20 hover:border-semantic-error/30',
}

const sizeClasses = { sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5', md: 'px-4 py-2 text-sm rounded-xl gap-2', lg: 'px-5 py-2.5 text-sm rounded-xl gap-2' }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading, icon, size = 'md', children, className = '', disabled, ...props }, ref) => {
    return (
      <button ref={ref} className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent-brand/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        disabled={disabled || loading} {...props}>
        {loading ? <Loader2 size={14} className="animate-spin" /> : icon || null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
