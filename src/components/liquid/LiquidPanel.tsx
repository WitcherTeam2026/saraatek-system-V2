import type { ReactNode } from 'react'

interface LiquidPanelProps {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
}

export function LiquidPanel({
  children,
  className = '',
  title,
  action,
}: LiquidPanelProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Glass background */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-6">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">{title}</h3>
            {action}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
