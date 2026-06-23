import { useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidButton } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { Lock, User } from 'lucide-react'

interface LoginProps {
  onLogin?: () => void
}

export function Login({ onLogin }: LoginProps) {
  const navigate = useAppStore((s) => s.navigate)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await api.auth.login({ username: username.trim(), password })
      localStorage.setItem('auth_token', result.session.token)
      localStorage.setItem('auth_user', JSON.stringify(result.user))
      onLogin?.()
      navigate('dashboard')
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #7C4DFF 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)', filter: 'blur(100px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-purple-hover flex items-center justify-center shadow-lg shadow-brand-purple/30">
            <span className="text-2xl font-bold text-white font-display">S</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">SaraaTEK</h1>
          <p className="text-sm text-text-muted mt-1">Repair Management System</p>
        </div>

        {/* Login Form */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <h2 className="text-lg font-semibold text-text-primary mb-6 text-center">Sign In</h2>

          {error && <ErrorBanner message={error} onClose={() => setError('')} />}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-purple/30 transition-all"
                  style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                  placeholder="Enter username"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-purple/30 transition-all"
                  style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                  placeholder="Enter password"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <LiquidButton
              onClick={handleLogin}
              loading={loading}
              className="w-full mt-6"
            >
              Sign In
            </LiquidButton>

            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('user-management')}
                className="text-xs text-brand-purple hover:text-brand-purple-hover transition-colors"
              >
                Create new account
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          Default: admin / admin123
        </p>
      </motion.div>
    </div>
  )
}
