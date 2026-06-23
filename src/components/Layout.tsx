import { Titlebar } from './Titlebar'
import { Sidebar } from './Sidebar'
import { AIAssistant } from './AIAssistant'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-bg-canvas relative overflow-hidden">
      {/* Ambient gradient mesh background - premium depth */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Primary purple orb - top right */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{
            top: '-15%',
            right: '-8%',
            background: 'radial-gradient(circle, #7C4DFF 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'float 25s ease-in-out infinite',
          }}
        />
        {/* Secondary blue orb - bottom left */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{
            bottom: '-10%',
            left: '-5%',
            background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'float 30s ease-in-out infinite reverse',
          }}
        />
        {/* Subtle green accent - center */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.03]"
          style={{
            top: '40%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, #10B981 0%, transparent 70%)',
            filter: 'blur(120px)',
            animation: 'float 35s ease-in-out infinite',
            animationDelay: '5s',
          }}
        />
        {/* Grid overlay for depth */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
      `}</style>

      <div className="relative z-10 flex flex-col h-screen">
        <Titlebar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
        <AIAssistant />
      </div>
    </div>
  )
}
