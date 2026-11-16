import { useState, useEffect } from 'react'

export interface AdminUser {
  email: string
  name: string
  role?: string
}

const AUTH_STORAGE_KEY = 'dubazaar_admin_auth'

function getInitialAuth(): { token: string | null; admin: AdminUser | null } {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return { token: null, admin: null }
    const parsed = JSON.parse(raw)
    return { token: parsed.token ?? null, admin: parsed.admin ?? null }
  } catch {
    return { token: null, admin: null }
  }
}

let authState = getInitialAuth()
let listeners: Array<() => void> = []

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

export async function loginAdmin(email: string, pass: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: pass }),
    })

    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error || 'Invalid credentials' }
    }

    authState = {
      token: data.token,
      admin: data.admin,
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState))
    notify()
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}

export function logoutAdmin() {
  authState = { token: null, admin: null }
  localStorage.removeItem(AUTH_STORAGE_KEY)
  fetch('/api/admin/logout', { method: 'POST' }).catch(() => {})
  notify()
}

export function useAdminAuth() {
  const [current, setCurrent] = useState(authState)

  useEffect(() => {
    const update = () => setCurrent({ ...authState })
    listeners.push(update)
    return () => {
      listeners = listeners.filter(l => l !== update)
    }
  }, [])

  return {
    token: current.token,
    admin: current.admin,
    isAuthenticated: Boolean(current.token && current.admin),
    login: loginAdmin,
    logout: logoutAdmin,
  }
}
