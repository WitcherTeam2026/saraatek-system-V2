import { motion } from 'framer-motion'
import { useAppStore } from '../stores/app'
import { LiquidPanel } from '../components/liquid'
import { DollarSign, Wrench, Users, ShieldCheck, ArrowRight } from 'lucide-react'

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

export function Analytics() {
  const navigate = useAppStore((s) => s.navigate)

  const modules = [
    {
      icon: <DollarSign size={20} />,
      title: 'Revenue Analytics',
      description: 'Revenue trends, growth rate, and payment method breakdown',
      color: 'text-emerald-400',
      onClick: () => navigate('revenue-analytics'),
    },
    {
      icon: <Wrench size={20} />,
      title: 'Repair Analytics',
      description: 'Device brands, repair duration, and common issues',
      color: 'text-blue-400',
      onClick: () => navigate('repair-analytics'),
    },
    {
      icon: <Users size={20} />,
      title: 'Customer Analytics',
      description: 'Customer retention, repeat rate, and top customers',
      color: 'text-purple-400',
      onClick: () => navigate('customer-analytics'),
    },
    {
      icon: <ShieldCheck size={20} />,
      title: 'Warranty Analytics',
      description: 'Warranty claims, coverage rates, and duration analysis',
      color: 'text-amber-400',
      onClick: () => navigate('warranty-analytics'),
    },
  ]

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">Analytics</h1>
        <p className="text-sm text-text-muted">Deep insights into your repair business</p>
      </motion.div>

      {/* Modules Grid */}
      <motion.div variants={staggerItem}>
        <LiquidPanel title="Analytics Modules">
          <div className="grid grid-cols-2 gap-4">
            {modules.map((item) => (
              <button
                key={item.title}
                onClick={item.onClick}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.02] transition-all border border-transparent hover:border-white/5 text-left group"
              >
                <div className={`p-3 rounded-xl bg-white/5 ${item.color}`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-text-primary group-hover:text-brand-purple transition-colors">{item.title}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{item.description}</p>
                </div>
                <ArrowRight size={16} className="text-text-muted group-hover:text-brand-purple transition-colors" />
              </button>
            ))}
          </div>
        </LiquidPanel>
      </motion.div>
    </motion.div>
  )
}

export default Analytics
