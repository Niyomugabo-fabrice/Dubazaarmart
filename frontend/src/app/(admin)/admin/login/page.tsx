'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SiteLogo from '@/components/SiteLogo'
import { useAdminAuth } from '@/store/adminAuthStore'
import { useToast } from '@/components/ui/Toast'
import { apiFetch, apiUrl } from '@/services/api-client'

export default function AdminLoginPage() {
  const router = useRouter()
  const toast = useToast()
  const { isAuthenticated, isLoading: isAuthLoading, login } = useAdminAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [staffRegistrationEnabled, setStaffRegistrationEnabled] = useState(false)
  const [setupStatus, setSetupStatus] = useState<'checking' | 'required' | 'complete'>('checking')
  const [setupFirstName, setSetupFirstName] = useState('')
  const [setupLastName, setSetupLastName] = useState('')
  const [setupEmail, setSetupEmail] = useState('')
  const [setupPassword, setSetupPassword] = useState('')
  const [setupConfirm, setSetupConfirm] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace('/admin')
    }
  }, [isAuthenticated, isAuthLoading, router])

  useEffect(() => {
    let active = true
    apiFetch(apiUrl('/api/admin/setup-status'))
      .then(async (response) => {
        if (!response.ok) throw new Error('Setup status unavailable.')
        const payload = await response.json() as { needsSetup?: boolean }
        if (active) setSetupStatus(payload.needsSetup === true ? 'required' : 'complete')
      })
      .catch(() => {
        if (active) setSetupStatus('complete')
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    apiFetch(apiUrl('/api/settings'))
      .then(async (response) => {
        if (!response.ok) return
        const payload = await response.json() as { settings?: { allowStaffRegistration?: boolean } }
        if (active) setStaffRegistrationEnabled(payload.settings?.allowStaffRegistration === true)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  // Load remembered email
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dubazaar_admin_remembered_email')
        if (saved) {
          setEmail(saved)
          setRememberMe(true)
        }
      } catch {
        // ignore
      }
    }
  }, [])

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    const cleanEmail = setupEmail.trim()
    if (setupPassword !== setupConfirm) {
      setErrorMessage('The two passwords do not match.')
      return
    }
    if (setupPassword.length < 12) {
      setErrorMessage('Password must be at least 12 characters long.')
      return
    }

    try {
      setSubmitting(true)
      const response = await apiFetch(apiUrl('/api/admin/setup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: setupFirstName.trim(),
          lastName: setupLastName.trim(),
          email: cleanEmail,
          password: setupPassword,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { message?: string | string[] } | null
        const message = Array.isArray(data?.message)
          ? data.message.join(' ')
          : data?.message || 'The manager account could not be created.'
        setErrorMessage(message)
        toast.error(message, 'Setup Failed')
        return
      }

      const res = await login(cleanEmail, setupPassword)
      if (res.success) {
        toast.success('Your manager account is ready.', 'Setup Complete')
        router.push('/admin')
      } else {
        setSetupStatus('complete')
        setEmail(cleanEmail)
        setErrorMessage('Account created. Please sign in with your new credentials.')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'A connection error occurred.'
      setErrorMessage(msg)
      toast.error(msg, 'Network Error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setErrorMessage('Please enter your administrator email.')
      return
    }
    if (!password) {
      setErrorMessage('Please enter your password.')
      return
    }

    try {
      setSubmitting(true)
      const res = await login(cleanEmail, password)
      if (res.success) {
        if (rememberMe) {
          localStorage.setItem('dubazaar_admin_remembered_email', cleanEmail)
        } else {
          localStorage.removeItem('dubazaar_admin_remembered_email')
        }
        toast.success('Welcome back to the DubazaarMart Control Center!', 'Authenticated')
        router.push('/admin')
      } else {
        const err = res.error || 'Invalid administrator credentials.'
        setErrorMessage(err)
        toast.error(err, 'Sign-In Failed')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'A connection error occurred.'
      setErrorMessage(msg)
      toast.error(msg, 'Network Error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6"
      style={{
        background: 'radial-gradient(ellipse at top, #FFF7E8 0%, #FFFFFF 70%)',
      }}
    >
      {/* Return to storefront link */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-semibold text-black/70 hover:text-black transition-colors px-3 py-1.5 rounded-xl border border-black/10 bg-white/80 backdrop-blur-sm"
        >
          <span>←</span> Return to Storefront
        </Link>
      </div>

      <div className="w-full max-w-md">
        {/* Card */}
        <div
          className="rounded-3xl shadow-2xl p-7 sm:p-9 border overflow-hidden backdrop-blur-md"
          style={{
            background: '#FFFFFF',
            borderColor: '#FFB800',
          }}
        >
          {/* Header */}
          <div className="text-center pb-6 border-b border-[#F1FFF0]">
            <div className="inline-block mb-3">
              <SiteLogo />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2" style={{ background: '#FFF7E8', color: '#FF6A00', border: '1px solid #FFB800' }}>
              <span>🔒</span> Admin Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
              {setupStatus === 'required' ? 'Create the First Manager Account' : 'Sign In to DubazaarMart'}
            </h1>
            <p className="text-xs text-black/60 mt-1">
              {setupStatus === 'required'
                ? 'No manager account exists yet. Create one to start managing the store.'
                : 'Restricted management area for authorized staff only'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mt-5 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn"
              style={{
                background: 'rgba(233, 75, 0, 0.08)',
                color: '#E94B00',
                border: '1px solid rgba(233, 75, 0, 0.3)',
              }}
            >
              <span className="text-base flex-shrink-0">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {setupStatus === 'checking' && (
            <div className="mt-8 py-10 text-center text-sm text-black/60">Checking account setup…</div>
          )}

          {setupStatus === 'required' && (
            <form onSubmit={handleSetup} className="mt-6 space-y-4">
              <p className="rounded-2xl px-3.5 py-3 text-[11px] font-semibold leading-relaxed" style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#7A4A00' }}>
                This form is only available while no manager account exists. Once the first manager is created, further accounts are managed from the dashboard.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="setup-first-name" className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">First name</label>
                  <input id="setup-first-name" required minLength={2} maxLength={60} value={setupFirstName} onChange={(e) => setSetupFirstName(e.target.value)} disabled={submitting} placeholder="Admin" className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FFB800]" style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }} />
                </div>
                <div>
                  <label htmlFor="setup-last-name" className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">Last name</label>
                  <input id="setup-last-name" required minLength={2} maxLength={60} value={setupLastName} onChange={(e) => setSetupLastName(e.target.value)} disabled={submitting} placeholder="Manager" className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FFB800]" style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }} />
                </div>
              </div>
              <div>
                <label htmlFor="setup-email" className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">Email address</label>
                <input id="setup-email" type="email" required autoComplete="email" maxLength={254} value={setupEmail} onChange={(e) => setSetupEmail(e.target.value)} disabled={submitting} placeholder="admin@dubazaarmart.rw" className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FFB800]" style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }} />
              </div>
              <div>
                <label htmlFor="setup-password" className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">Password</label>
                <input id="setup-password" type="password" required minLength={12} maxLength={72} autoComplete="new-password" value={setupPassword} onChange={(e) => setSetupPassword(e.target.value)} disabled={submitting} placeholder="At least 12 characters" className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FFB800]" style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }} />
              </div>
              <div>
                <label htmlFor="setup-confirm" className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">Confirm password</label>
                <input id="setup-confirm" type="password" required minLength={12} maxLength={72} autoComplete="new-password" value={setupConfirm} onChange={(e) => setSetupConfirm(e.target.value)} disabled={submitting} placeholder="Repeat the password" className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FFB800]" style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }} />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl text-sm font-bold btn-gold transition-all flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
              >
                {submitting ? 'Creating manager account…' : 'Create Manager Account →'}
              </button>
            </form>
          )}

          {setupStatus === 'complete' && (<>
          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-login-email" className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                Manager or User Email Address
              </label>
              <input
                id="admin-login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@dubazaarmart.rw"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-[#FFB800]"
                style={{
                  background: '#FFF7E8',
                  border: '1px solid #FFB800',
                  color: '#111111',
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="admin-login-password" className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-semibold text-[#FF6A00] hover:underline"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="relative">
                <input
                  id="admin-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className="w-full px-4 py-3 rounded-xl text-sm pr-11 transition-all outline-none focus:ring-2 focus:ring-[#FFB800]"
                  style={{
                    background: '#FFF7E8',
                    border: '1px solid #FFB800',
                    color: '#111111',
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/80"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-black/75">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-[#FF6A00] focus:ring-[#FFB800] w-4 h-4 cursor-pointer"
                />
                <span>Remember Email</span>
              </label>

              <span className="text-[11px] font-medium text-black/50">
                Secure user session
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl text-sm font-bold btn-gold transition-all flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
                  </svg>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                'Sign In to Dashboard →'
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-7 pt-5 border-t border-[#F1FFF0] text-center">
            <p className="text-[11px] text-black/55 leading-relaxed">
              <strong>Need user access?</strong> Registration is manager-controlled. New accounts require manager approval.
            </p>
            {staffRegistrationEnabled && (
              <Link
                href="/admin/register"
                className="inline-block mt-3 text-xs font-semibold text-[#FF6A00] hover:underline"
              >
                Request user access
              </Link>
            )}
          </div>
          </>)}
        </div>
      </div>
    </div>
  )
}
