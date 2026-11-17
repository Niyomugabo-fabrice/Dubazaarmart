import { useState } from 'react'
import SiteLogo from './SiteLogo'

interface Props {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>
  onBack: () => void
}

export default function AdminLoginView({ onLogin, onBack }: Props) {
  const [email, setEmail] = useState('IntoreTech@gmail.com')
  const [password, setPassword] = useState('Bahoo!123')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await onLogin(email, password)
    setLoading(false)

    if (!res.success) {
      setError(res.error || 'Authentication failed. Please verify your credentials.')
    }
  }

  function handleAutofill() {
    setEmail('IntoreTech@gmail.com')
    setPassword('Bahoo!123')
    setError(null)
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
            <p className="text-xs sm:text-sm mt-1" style={{ color: '#0B5B24' }}>
              Sign in to manage products, customer orders, and store operations.
            </p>
          </div>

          {/* Quick Credential Hint */}
          <div
            onClick={handleAutofill}
            role="button"
            tabIndex={0}
            className="mb-6 p-3 rounded-2xl cursor-pointer transition-all hover:brightness-95 flex items-start gap-2.5 text-left"
            style={{
              background: '#FFF7E8',
              border: '1px dashed #FFB800',
            }}
            title="Click to auto-fill credentials"
          >
            <span className="text-lg leading-none" aria-hidden="true">🔑</span>
            <div className="text-xs leading-relaxed flex-1">
              <div className="font-semibold text-[#111111]">Authorized Admin Credentials:</div>
              <div className="mt-0.5 text-[#0B5B24]">
                Email: <span className="font-mono font-bold text-[#FF6A00]">IntoreTech@gmail.com</span>
              </div>
              <div className="text-[#0B5B24]">
                Password: <span className="font-mono font-bold text-[#FF6A00]">Bahoo!123</span>
              </div>
              <div className="text-[10px] text-black/50 mt-1">Tap to auto-fill</div>
            </div>
          </div>

          {error && (
            <div
              className="mb-5 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2"
              style={{
                background: 'rgba(233,75,0,0.08)',
                border: '1px solid rgba(233,75,0,0.3)',
                color: '#E94B00',
              }}
            >
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-[#111111]">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="IntoreTech@gmail.com"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none"
                style={{
                  background: '#FFF7E8',
                  border: '1px solid #FFB800',
                  color: '#111111',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-[#111111]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none pr-12"
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
