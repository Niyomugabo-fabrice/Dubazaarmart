'use client'

import { useState } from 'react'
import SiteLogo from './SiteLogo'

interface Props {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>
  onBack: () => void
}

export default function AdminLoginView({ onLogin, onBack }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Please provide your administrator or staff email and password.')
      return
    }

    setLoading(true)
    setError(null)

    const res = await onLogin(email.trim(), password)
    setLoading(false)

    if (!res.success) {
      setError(res.error || 'Authentication failed. Please verify your credentials.')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: 'radial-gradient(circle at 50% 20%, #FFF7E8 0%, #FFFFFF 70%)',
      }}
    >
      <div className="w-full max-w-md">
        {/* Card */}
        <div
          className="rounded-3xl p-8 sm:p-10 shadow-xl transition-all"
          style={{
            background: '#FFFFFF',
            border: '1px solid #FFB800',
            boxShadow: '0 20px 50px rgba(255,106,0,0.08)',
          }}
        >
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex justify-center mb-3">
              <SiteLogo className="h-16 w-16" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2" style={{ background: 'rgba(255,106,0,0.1)', color: '#FF6A00', border: '1px solid rgba(255,106,0,0.25)' }}>
              🔒 ADMIN PORTAL
            </div>
            <h1 className="text-2xl font-bold text-[#111111]">Admin Workspace</h1>
            <p className="text-xs text-[#0B5B24] mt-1.5">
              Authorized personnel only. Sessions protected by JWT token pairs.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              className="mb-6 p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 animate-fadeIn"
              style={{
                background: 'rgba(233,75,0,0.08)',
                color: '#E94B00',
                border: '1px solid rgba(233,75,0,0.3)',
              }}
            >
              <span className="text-base flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                Administrator or Staff Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@dubazaarmart.rw"
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: '#FFF7E8',
                  border: '1px solid #FFB800',
                  color: '#111111',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm pr-16"
                  style={{
                    background: '#FFF7E8',
                    border: '1px solid #FFB800',
                    color: '#111111',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-black/60 hover:text-black p-1"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm btn-gold transition-all duration-200 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In to Admin Workspace →'
              )}
            </button>
          </form>

          <div className="mt-6 text-center pt-5 border-t" style={{ borderColor: '#F1FFF0' }}>
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-medium text-black/60 hover:text-black transition-colors"
            >
              ← Return to Public Storefront
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
