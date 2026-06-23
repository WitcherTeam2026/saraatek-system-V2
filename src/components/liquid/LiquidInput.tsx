import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LiquidInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'number' | 'password'
  error?: string
  hint?: string
  icon?: React.ReactNode
  className?: string
}

export function LiquidInput({
  label,
  value,
  onChange,
  type = 'text',
  error,
  hint,
  icon,
  className = '',
}: LiquidInputProps) {
  const [focused, setFocused] = useState(false)
  const isActive = focused || value.length > 0

  return (
    <div className={`relative ${className}`}>
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted z-10">
          {icon}
        </span>
      )}
      <motion.label
        className="absolute pointer-events-none origin-left z-10"
        animate={{
          x: icon ? 36 : 12,
          y: isActive ? -10 : 12,
          scale: isActive ? 0.75 : 1,
          color: error ? 'var(--color-accent-red)' : isActive ? 'var(--color-brand-purple)' : 'var(--color-text-muted)',
        }}
        transition={{ duration: 0.15 }}
      >
        {label}
      </motion.label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-3 bg-bg-inset border rounded-md text-text-primary text-sm focus:outline-none transition-colors duration-150 ${
          error
            ? 'border-accent-red focus:ring-1 focus:ring-accent-red/20'
            : 'border-border-default focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/20'
        }`}
      />
      <AnimatePresence>
        {(error || hint) && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`text-xs mt-1 ${error ? 'text-accent-red' : 'text-text-muted'}`}
          >
            {error || hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
