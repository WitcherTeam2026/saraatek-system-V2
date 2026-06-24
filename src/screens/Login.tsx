import { useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { setAuth } from '../lib/secureStore'
import { LiquidButton } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { Lock, User, KeyRound } from 'lucide-react'
import { mapError } from '../lib/mapError'

interface LoginProps {
  onLogin?: () => void
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await api.auth.login({ username: username.trim(), password })
      await setAuth(result.session.token, result.user, result.session.expires_at)

      if (result.user.must_change_password) {
        setMustChangePassword(true)
      } else {
        onLogin?.()
      }
    } catch (e) {
      setError(mapError(e))
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      setError('Please enter a new password')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setChangingPassword(true)
    setError('')
    try {
      await api.auth.changePassword({ old_password: password, new_password: newPassword })
      onLogin?.()
    } catch (e) {
      setError(mapError(e))
    } finally {
      setChangingPassword(false)
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
          <h2 className="text-lg font-semibold text-text-primary mb-6 text-center">
            {mustChangePassword ? 'Set New Password' : 'Sign In'}
          </h2>

          {error && <ErrorBanner message={error} onClose={() => setError('')} />}

          {!mustChangePassword ? (
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
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-text-muted text-center mb-4">
                You must set a new password before continuing.
              </p>

              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">New Password</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-purple/30 transition-all"
                    style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                    placeholder="Enter new password"
                    onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-purple/30 transition-all"
                    style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                    placeholder="Confirm new password"
                    onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                  />
                </div>
              </div>

              <LiquidButton
                onClick={handleChangePassword}
                loading={changingPassword}
                className="w-full mt-6"
              >
                Set Password
              </LiquidButton>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
