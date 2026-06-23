import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface LiquidMetricProps {
  label: string
  value: number | string
  suffix?: string
  icon?: ReactNode
  color?: string
  trend?: number
  className?: string
}

export function LiquidMetric({
  label,
  value,
  suffix,
  icon,
  color = 'text-text-primary',
  trend,
  className = '',
}: LiquidMetricProps) {
  return (
    <motion.div
      className={`relative group ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Glass surface - no card border, just glass */}
      <div className="relative p-4 rounded-xl overflow-hidden">
        {/* Glass background */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(12px) saturate(180%)',
          }}
        />

        {/* Subtle rim on hover */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1), inset 0 -1px 1px rgba(255, 255, 255, 0.05)',
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Label + Icon row */}
          <div className="flex items-center gap-2 mb-2">
            {icon && (
              <div className={`w-5 h-5 flex items-center justify-center ${color}`}>
                {icon}
              </div>
            )}
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</span>
          </div>

          {/* Value - typography-first */}
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold tabular-nums tracking-tight font-display ${color}`}>
              {value}
            </span>
            {suffix && (
              <span className="text-sm text-text-muted">{suffix}</span>
            )}
          </div>

          {/* Trend indicator */}
          {trend !== undefined && (
            <div className="mt-1.5">
              <span className={`text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-xs text-text-muted ml-1">from last period</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
