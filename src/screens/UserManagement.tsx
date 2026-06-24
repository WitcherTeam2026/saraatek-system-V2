import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { LiquidCard, LiquidButton, LiquidInput } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { ArrowLeft, UserPlus, Users, Edit2, Trash2, X } from 'lucide-react'
import { mapError } from '../lib/mapError'
import type { User } from '../types'

const roles = [
  { value: 'admin', label: 'Admin', color: 'text-red-400' },
  { value: 'manager', label: 'Manager', color: 'text-amber-400' },
  { value: 'technician', label: 'Technician', color: 'text-blue-400' },
  { value: 'front_desk', label: 'Front Desk', color: 'text-emerald-400' },
]

export function UserManagement() {
  const navigate = useAppStore((s) => s.navigate)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('technician')
  const [saving, setSaving] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await api.auth.listUsers()
      if (mounted.current) setUsers(data)
    } catch (e) {
      if (mounted.current) setError(mapError(e))
    } finally {
      if (mounted.current) setLoading(false)
    }
  }

  useEffect(() => {
    mounted.current = true
    loadUsers()
    return () => { mounted.current = false }
  }, [])

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!editingUser && !password.trim()) {
      setError('Password is required for new users')
      return
    }

    setSaving(true)
    try {
      if (editingUser) {
        await api.auth.updateUser(editingUser.id, {
          name: name.trim(),
          role,
        })
      } else {
        await api.auth.createUser({
          username: username.trim(),
          password: password.trim(),
          name: name.trim(),
          role,
        })
      }
      setShowForm(false)
      setEditingUser(null)
      resetForm()
      loadUsers()
    } catch (e) {
      if (mounted.current) setError(mapError(e))
    } finally {
      if (mounted.current) setSaving(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setUsername(user.username)
    setName(user.name)
    setRole(user.role)
    setPassword('')
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await api.auth.deleteUser(id)
      loadUsers()
    } catch (e) {
      if (mounted.current) setError(mapError(e))
    }
  }

  const resetForm = () => {
    setUsername('')
    setPassword('')
    setName('')
    setRole('technician')
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('settings')}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">User Management</h1>
            <p className="text-sm text-text-muted mt-0.5">Manage user accounts and roles</p>
          </div>
        </div>
        <LiquidButton icon={<UserPlus size={16} />} onClick={() => { resetForm(); setEditingUser(null); setShowForm(true) }}>
          Add User
        </LiquidButton>
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      {/* User Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md rounded-2xl p-6"
            style={{ background: 'rgba(20, 20, 22, 0.98)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary">{editingUser ? 'Edit User' : 'New User'}</h3>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {!editingUser && (
                <LiquidInput label="Username" value={username} onChange={setUsername} />
              )}
              <LiquidInput label="Full Name" value={name} onChange={setName} />
              {!editingUser && (
                <LiquidInput label="Password" value={password} onChange={setPassword} type="password" />
              )}
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                  style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                >
                  {roles.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <LiquidButton variant="secondary" onClick={() => setShowForm(false)}>Cancel</LiquidButton>
              <LiquidButton onClick={handleSave} loading={saving}>{editingUser ? 'Save' : 'Create'}</LiquidButton>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Users List */}
      <LiquidCard>
        <div className="p-6">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto text-text-muted mb-3" />
              <p className="text-sm text-text-muted">No users yet. Create the first user account.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">User</th>
                  <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Role</th>
                  <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Status</th>
                  <th className="text-left py-2.5 pr-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">Last Login</th>
                  <th className="text-left py-2.5 text-[11px] font-medium text-text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const roleInfo = roles.find(r => r.value === user.role)
                  return (
                    <tr key={user.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-purple/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-brand-purple">{user.name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-medium text-text-primary">{user.name}</div>
                            <div className="text-xs text-text-muted">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`text-xs font-medium ${roleInfo?.color || 'text-text-muted'}`}>
                          {roleInfo?.label || user.role}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`text-xs ${user.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-text-muted text-xs">
                        {user.last_login ? user.last_login.split(' ')[0] : 'Never'}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(user)} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </LiquidCard>
    </motion.div>
  )
}
