const DEFAULT_API_URL = 'http://localhost:3001/api/v1'

export interface AdminSessionUser {
  id: string
  firstName: string
  lastName: string
  name: string
  email: string
  phoneNumber: string | null
  role: 'MANAGER' | 'STAFF'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
  emailVerified: boolean
  permissions: string[]
  createdAt: string
  lastLoginAt: string | null
}

interface StoredAdminSession {
  token: string | null
  user: AdminSessionUser | null
}

let adminSession: StoredAdminSession = { token: null, user: null }
let refreshRequest: Promise<string | null> | null = null
const sessionListeners = new Set<() => void>()

export function setAdminSession(token: string, user: AdminSessionUser): void {
  adminSession = { token, user }
  sessionListeners.forEach((listener) => listener())
}

export function clearAdminSession(): void {
  adminSession = { token: null, user: null }
  sessionListeners.forEach((listener) => listener())
}

export function subscribeAdminSession(listener: () => void): () => void {
  sessionListeners.add(listener)
  return () => sessionListeners.delete(listener)
}

function apiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
  let base = configured.replace(/\/+$/, '')
  if (typeof window !== 'undefined') {
    try {
      const apiUrl = new URL(base)
      const pageIsPrivateNetwork = isPrivateNetworkIPv4(window.location.hostname)
      const apiIsLoopback = apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1'
      if (pageIsPrivateNetwork && apiIsLoopback) {
        apiUrl.hostname = window.location.hostname
        base = apiUrl.toString().replace(/\/+$/, '')
      }
    } catch {
      // Leave invalid configuration unchanged so URL construction reports the error.
    }
  }
  return /\/api\/v1$/i.test(base) ? base : `${base}/api/v1`
}

function isPrivateNetworkIPv4(hostname: string): boolean {
  const octets = hostname.split('.').map(Number)
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false
  return octets[0] === 10 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
}

function backendPath(path: string): string {
  const [pathname, query = ''] = path.split(/(?=\?)/, 2)
  let mapped = pathname
  if (mapped === '/api/admin/login') mapped = '/auth/login'
  else if (mapped === '/api/admin/setup-status') mapped = '/auth/setup-status'
  else if (mapped === '/api/admin/setup') mapped = '/auth/setup'
  else if (mapped === '/api/admin/logout') mapped = '/auth/logout'
  else if (mapped === '/api/admin/verify') mapped = '/auth/verify'
  else if (mapped === '/api/admin/refresh') mapped = '/auth/refresh'
  else if (mapped === '/api/upload') mapped = '/media/upload'
  else if (mapped === '/api/health') mapped = '/health'
  else if (mapped.startsWith('/api/admin/')) mapped = mapped.replace(/^\/api\/admin/, '/admin')
  else if (mapped.startsWith('/api/')) mapped = mapped.slice(4)
  if (!mapped.startsWith('/')) mapped = `/${mapped}`
  return `${mapped}${query}`
}

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const route = backendPath(normalizedPath).replace(/^\/+/, '')
  return new URL(route, `${apiBaseUrl()}/`).toString()
}

export function swaggerUrl(): string {
  return new URL('/docs', apiBaseUrl()).toString()
}

export function mediaUrl(path: string | undefined): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path
  return apiUrl(path)
}

function isProtectedRequest(url: URL, method = 'GET'): boolean {
  const path = url.pathname.toLowerCase()
  if (path.includes('/api/v1/admin/')) return true
  if (path.includes('/api/v1/media/upload') || path.endsWith('/media/upload')) return true
  if (path.includes('/api/v1/auth/verify') || path.endsWith('/auth/verify')) return true
  if (path.includes('/api/v1/auth/logout') || path.endsWith('/auth/logout')) return true
  if ((path.endsWith('/api/v1/products') || path.endsWith('/products')) && method !== 'GET' && method !== 'HEAD') return true
  return false
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshRequest) return refreshRequest
  refreshRequest = (async () => {
    try {
      const response = await fetch(apiUrl('/api/admin/refresh'), {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'include',
      })
      if (!response.ok) {
        clearAdminSession()
        return null
      }
      const payload = await response.json() as { token?: string; user?: AdminSessionUser }
      if (!payload.token || !payload.user) {
        clearAdminSession()
        return null
      }
      setAdminSession(payload.token, payload.user)
      return payload.token
    } catch {
      return null
    } finally {
      refreshRequest = null
    }
  })()
  return refreshRequest
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase()
  const requestUrl = input instanceof URL
    ? input
    : new URL(String(input), typeof window === 'undefined' ? apiBaseUrl() : window.location.origin)
  const headers = new Headers(init.headers)
  const protectedRequest = isProtectedRequest(requestUrl, method) || headers.has('Authorization')

  if (protectedRequest && adminSession.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${adminSession.token}`)
  }

  const response = await fetch(input, { ...init, headers, credentials: 'include' })
  const isAuthEndpoint = /\/auth\/(login|refresh|logout)$/i.test(requestUrl.pathname)
  if (!protectedRequest || isAuthEndpoint || response.status !== 401) return response

  const token = await refreshAccessToken()
  if (!token) return response
  const retryHeaders = new Headers(init.headers)
  retryHeaders.set('Authorization', `Bearer ${token}`)
  return fetch(input, { ...init, headers: retryHeaders, credentials: 'include' })
}

export function getStoredAdminSession(): StoredAdminSession {
  return adminSession
}
