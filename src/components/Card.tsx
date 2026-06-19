export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-bg-surface border border-border-default rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  )
}
