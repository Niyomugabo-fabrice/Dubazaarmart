'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SiteLogo from '@/components/SiteLogo'
import { useAdminAuth } from '@/store/adminAuthStore'
import { useToast } from '@/components/ui/Toast'

export default function AdminLoginPage() {
  const router = useRouter()
  const toast = useToast()
  const { isAuthenticated, login } = useAdminAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/admin')
    }
  }, [isAuthenticated, router])

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
              Sign In to DubazaarMart
            </h1>
            <p className="text-xs text-black/60 mt-1">
              Restricted management area for authorized staff only
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                Admin Email Address
              </label>
              <input
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
                <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
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
                JWT Refresh Session
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
              <strong>Need a staff account?</strong> Public administrator signups are disabled. Authorized staff must be provisioned by a root administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
