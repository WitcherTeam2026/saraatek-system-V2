import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface LiquidCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  glow?: boolean
}

export function LiquidCard({
  children,
  className = '',
  hover = true,
  onClick,
  glow = false,
}: LiquidCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }

  return (
    <motion.div
      ref={cardRef}
      className={`relative rounded-xl overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Glass base layer */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,${isHovered ? 0.08 : 0.04}) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)`,
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        }}
      />

      {/* Rim highlights */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          boxShadow: `
            inset 0 1px 1px rgba(255, 255, 255, ${isHovered ? 0.15 : 0.08}),
            inset 0 -1px 1px rgba(255, 255, 255, 0.05),
            inset 1px 0 1px rgba(255, 255, 255, ${isHovered ? 0.1 : 0.06}),
            inset -1px 0 1px rgba(255, 255, 255, ${isHovered ? 0.1 : 0.06}),
            0 ${isHovered ? '8px 24px' : '4px 12px'} rgba(0, 0, 0, ${isHovered ? 0.2 : 0.12})
          `,
        }}
      />

      {/* Specular sheen */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl opacity-60"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,${isHovered ? 0.12 : 0.06}) 0%, transparent 50%)`,
        }}
      />

      {/* Border */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl border transition-colors duration-200"
        style={{
          borderColor: isHovered ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
        }}
      />

      {/* Glow effect on hover */}
      {glow && isHovered && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            boxShadow: '0 0 30px rgba(124, 77, 255, 0.15), inset 0 0 30px rgba(124, 77, 255, 0.05)',
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}
