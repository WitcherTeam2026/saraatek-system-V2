import { Store } from '@tauri-apps/plugin-store'

let store: Store | null = null

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load('auth.json')
  }
  return store
}

export async function setAuth(token: string, user: object, expiresAt: string): Promise<void> {
  const s = await getStore()
  await s.set('auth_token', token)
  await s.set('auth_user', JSON.stringify(user))
  await s.set('auth_expires_at', expiresAt)
  await s.save()
}

export async function getAuthToken(): Promise<string> {
  const s = await getStore()
  return ((await s.get('auth_token')) as string) || ''
}

export async function getAuthUser(): Promise<string> {
  const s = await getStore()
  return ((await s.get('auth_user')) as string) || '{}'
}

export async function getAuthExpiresAt(): Promise<string> {
  const s = await getStore()
  return ((await s.get('auth_expires_at')) as string) || ''
}

export async function clearAuth(): Promise<void> {
  const s = await getStore()
  await s.delete('auth_token')
  await s.delete('auth_user')
  await s.delete('auth_expires_at')
  await s.save()
}

export async function isSessionExpired(): Promise<boolean> {
  const expiresAt = await getAuthExpiresAt()
  if (!expiresAt) return false
  return new Date(expiresAt) <= new Date()
}

// Supabase settings — encrypted via tauri-plugin-store
export interface SupabaseSettings {
  url: string
  anon_key: string
  service_role_key: string
  database_password: string
  is_enabled: boolean
}

export async function getSupabaseSettings(): Promise<SupabaseSettings> {
  const s = await getStore()
  const settings = await s.get('supabase_settings')
  if (!settings) {
    return {
      url: '',
      anon_key: '',
      service_role_key: '',
      database_password: '',
      is_enabled: false,
    }
  }
  return settings as SupabaseSettings
}

export async function saveSupabaseSettings(settings: SupabaseSettings): Promise<void> {
  const s = await getStore()
  await s.set('supabase_settings', settings)
  await s.save()
}
