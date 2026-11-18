import { useEffect, useState } from 'react'
import {
  apiFetch,
  apiUrl,
  clearAdminSession,
  getStoredAdminSession,
  setAdminSession,
  subscribeAdminSession,
  type AdminSessionUser,
} from '../services/api-client'

export type AdminUser = AdminSessionUser

let authState = getStoredAdminSession()
let listeners: Array<() => void> = []
let restoreRequest: Promise<void> | null = null
let authVersion = 0

function notify() {
  authState = getStoredAdminSession()
  for (const listener of listeners) listener()
}

subscribeAdminSession(notify)

export async function restoreAdminSession(): Promise<void> {
  if (authState.token || restoreRequest) return restoreRequest ?? Promise.resolve()
  const version = authVersion
  restoreRequest = (async () => {
    try {
      const response = await fetch(apiUrl('/api/admin/refresh'), {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'include',
      })
      if (!response.ok || version !== authVersion) return
      const payload = await response.json() as { token?: string; user?: AdminUser }
      if (payload.token && payload.user && version === authVersion) {
        setAdminSession(payload.token, payload.user)
      }
    } catch {
      // The visitor may have no manager/staff session; remain signed out.
    } finally {
      restoreRequest = null
    }
  })()
  return restoreRequest
}

export async function loginAdmin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await apiFetch(apiUrl('/api/admin/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    })
    const data = await response.json() as { token?: string; user?: AdminUser; message?: string; error?: string }
    if (!response.ok || !data.token || !data.user) {
      return { success: false, error: data.message || data.error || 'Invalid email or password.' }
    }
    authVersion += 1
    setAdminSession(data.token, data.user)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error.' }
  }
}

export function logoutAdmin(): void {
  authVersion += 1
  clearAdminSession()
  void apiFetch(apiUrl('/api/admin/logout'), { method: 'POST' }).catch(() => undefined)
}

export function useAdminAuth() {
  const [current, setCurrent] = useState(authState)
  const [isLoading, setIsLoading] = useState(!authState.token)

  useEffect(() => {
    let active = true
    const update = () => setCurrent(getStoredAdminSession())
    listeners.push(update)
    void restoreAdminSession().finally(() => {
      if (active) setIsLoading(false)
    })
    return () => {
      active = false
      listeners = listeners.filter((listener) => listener !== update)
    }
  }, [])

  return {
    token: current.token,
    admin: current.user,
    isLoading,
    isAuthenticated: Boolean(current.token && current.user),
    login: loginAdmin,
    logout: logoutAdmin,
  }
}
