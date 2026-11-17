const AUTH_STORAGE_KEY = 'dubazaar_admin_auth'
const DEFAULT_API_URL = 'http://localhost:3001/api/v1'

interface StoredAdminSession {
  token?: string | null
  refreshToken?: string | null
  admin?: unknown
}

let refreshRequest: Promise<string | null> | null = null

function apiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
  const base = configured.replace(/\/+$/, '')
  return /\/api\/v1$/i.test(base) ? base : `${base}/api/v1`
}

function backendPath(path: string): string {
  const [pathname, query = ''] = path.split(/(?=\?)/, 2)
  let mapped = pathname
  if (mapped === '/api/admin/login') mapped = '/auth/login'
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
  return new URL(backendPath(normalizedPath), `${apiBaseUrl()}/`).toString()
}

export function mediaUrl(path: string | undefined): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path
  return apiUrl(path)
}

function readSession(): StoredAdminSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? JSON.parse(raw) as StoredAdminSession : null
  } catch {
    return null
  }
}

function isProtectedRequest(url: URL): boolean {
  return url.pathname.includes('/api/v1/admin/') || url.pathname.endsWith('/api/v1/media/upload')
}

async function refreshAccessToken(): Promise<string | null> {
  const session = readSession()
  if (!session?.refreshToken) return null
  if (refreshRequest) return refreshRequest

  refreshRequest = (async () => {
    try {
      const response = await fetch(apiUrl('/api/admin/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      })
      if (!response.ok) return null
      const payload = await response.json() as { token?: string; refreshToken?: string; admin?: unknown }
      if (!payload.token || !payload.refreshToken) return null
      const nextSession = {
        ...session,
        token: payload.token,
        refreshToken: payload.refreshToken,
        admin: payload.admin ?? session.admin,
      }
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession))
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
  const requestUrl = input instanceof URL ? input : new URL(String(input), typeof window === 'undefined' ? apiBaseUrl() : window.location.origin)
  const protectedRequest = isProtectedRequest(requestUrl)
  const headers = new Headers(init.headers)
  const session = readSession()
  if (protectedRequest && session?.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  const response = await fetch(input, { ...init, headers })
  if (!protectedRequest || response.status !== 401 || !session?.refreshToken) return response

  const token = await refreshAccessToken()
  if (!token) return response
  const retryHeaders = new Headers(init.headers)
  retryHeaders.set('Authorization', `Bearer ${token}`)
  return fetch(input, { ...init, headers: retryHeaders })
}

export function getStoredAdminSession(): StoredAdminSession | null {
  return readSession()
}
