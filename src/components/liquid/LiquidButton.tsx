import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface LiquidButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
  className?: string
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand-purple text-white hover:bg-brand-purple-hover active:bg-brand-purple-active shadow-glass-sm',
  secondary: 'glass-surface text-text-primary hover:bg-glass-2 active:bg-glass-3',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-glass-1 active:bg-glass-2',
  danger: 'bg-accent-red text-white hover:opacity-90 active:opacity-80',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-2.5 text-base gap-2.5',
}

export function LiquidButton({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled,
  loading,
  icon,
  className = '',
}: LiquidButtonProps) {
  const baseStyles = 'relative rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas inline-flex items-center justify-center'

  return (
    <motion.button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  )
}
