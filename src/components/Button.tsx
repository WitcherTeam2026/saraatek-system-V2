type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-purple hover:bg-brand-purple-hover active:bg-brand-purple-active text-white',
  secondary: 'bg-bg-elevated hover:bg-[#252525] border border-border-default text-text-primary',
  danger: 'bg-accent-red/20 hover:bg-accent-red/30 text-accent-red border border-accent-red/30',
  ghost: 'hover:bg-bg-elevated text-text-secondary',
}

export function Button({ variant = 'primary', loading, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-purple/50 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}
