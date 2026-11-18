'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import SiteLogo from '@/components/SiteLogo'
import { useAdminAuth } from '@/store/adminAuthStore'
import { useToast } from '@/components/ui/Toast'
import { createAdminAccount, fetchAdminAccounts, type AdminAccountRecord } from '@/lib/dashboardApi'

export default function AdminRegisterPage() {
  const toast = useToast()
  const { isAuthenticated, admin } = useAdminAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'staff'>('staff')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [existingAdmins, setExistingAdmins] = useState<AdminAccountRecord[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)

  // Load existing administrators if authenticated
  useEffect(() => {
    if (isAuthenticated && admin?.role === 'admin') {
      setLoadingAdmins(true)
      fetchAdminAccounts()
        .then((list) => setExistingAdmins(list))
        .catch(() => {})
        .finally(() => setLoadingAdmins(false))
    }
  }, [isAuthenticated, admin?.role])

  // Password strength calculation
  const hasLength = password.length >= 12
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  const strengthScore = [hasLength, hasUpperLower, hasNumber, hasSpecial].filter(Boolean).length
  const strengthLabel =
    strengthScore === 4
      ? 'Very Strong'
      : strengthScore === 3
      ? 'Strong'
      : strengthScore === 2
      ? 'Moderate'
      : strengthScore === 1
      ? 'Weak'
      : 'Too Weak'

  const strengthColor =
    strengthScore >= 3 ? '#17D719' : strengthScore === 2 ? '#FFB800' : '#FF6A00'

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!name.trim()) {
      setErrorMessage('Full name is required.')
      return
    }
    if (!email.trim()) {
      setErrorMessage('Email address is required.')
      return
    }
    if (password.length < 12) {
      setErrorMessage('Password must be at least 12 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    try {
      setSubmitting(true)
      const newAdmin = await createAdminAccount({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      })
      const accountType = newAdmin.role === 'staff' ? 'Staff' : 'Administrator'
      const successText = `${accountType} account "${newAdmin.name}" (${newAdmin.email}) has been provisioned successfully!`
      setSuccessMessage(successText)
      toast.success(successText, `${accountType} Account Provisioned`)
      setName('')
      setEmail('')
      setRole('staff')
      setPassword('')
      setConfirmPassword('')

      // Refresh list
      const updated = await fetchAdminAccounts()
      setExistingAdmins(updated)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to provision team account.'
      setErrorMessage(msg)
      toast.error(msg, 'Provisioning Error')
    } finally {
      setSubmitting(false)
    }
  }

  // 1. Unauthenticated Security Gate
  if (!isAuthenticated || admin?.role !== 'admin') {
    const isStaff = isAuthenticated && admin?.role === 'staff'
    return (
      <div
        className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6"
        style={{
          background: 'radial-gradient(ellipse at top, #FFF7E8 0%, #FFFFFF 70%)',
        }}
      >
        <div className="w-full max-w-md text-center p-8 rounded-3xl shadow-xl border bg-white" style={{ borderColor: '#FF6A00' }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl" style={{ background: 'rgba(233,75,0,0.1)', color: '#FF6A00' }}>
            🛡️
          </div>
          <h2 className="text-2xl font-bold text-[#111111] mb-2">
            {isStaff ? 'Administrator access required' : 'Restricted Team Provisioning'}
          </h2>
          <p className="text-sm text-black/70 mb-6 leading-relaxed">
            {isStaff
              ? 'Staff accounts cannot provision other accounts. Contact an administrator for access.'
              : <>Public registration is <strong>disabled</strong>. Only an authenticated administrator may provision team accounts.</>}
          </p>
          <div className="space-y-3">
            <Link
              href={isStaff ? '/admin' : '/admin/login'}
              className="block w-full py-3.5 rounded-xl font-bold btn-gold text-sm transition-all"
            >
              {isStaff ? 'Return to Admin Workspace' : 'Sign In as Administrator →'}
            </Link>
            <Link
              href="/"
              className="block w-full py-2.5 rounded-xl text-xs font-semibold text-black/60 hover:text-black"
            >
              ← Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 2. Authenticated Administrator Provisioning Dashboard
  return (
    <div
      className="min-h-screen p-4 sm:p-8"
      style={{
        background: '#FAF9F6',
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#F1FFF0]">
          <div className="flex items-center gap-3">
            <SiteLogo />
            <span className="hidden sm:inline text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md" style={{ background: '#FFF7E8', color: '#FF6A00', border: '1px solid #FFB800' }}>
              Staff Management
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl text-xs font-bold border border-black/15 bg-white text-black hover:bg-black/5 transition-colors"
            >
              ← Admin Dashboard
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Creation Form */}
          <div className="lg:col-span-3">
            <div
              className="rounded-3xl p-6 sm:p-8 shadow-xl border bg-white"
              style={{ borderColor: '#FFB800' }}
            >
              <div className="pb-4 mb-4 border-b border-[#F1FFF0]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#FF6A00]">Authorized Action</div>
                <h1 className="text-2xl font-bold text-[#111111] mt-0.5">
                  Provision New Team Account
                </h1>
                <p className="text-xs text-black/60 mt-1">
                  Staff access covers orders, catalog/media, inventory, procurement, reports, and announcements. Only administrators can manage accounts and store settings.
                </p>
              </div>

              {errorMessage && (
                <div
                  className="mb-4 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5"
                  style={{
                    background: 'rgba(233, 75, 0, 0.08)',
                    color: '#E94B00',
                    border: '1px solid rgba(233, 75, 0, 0.3)',
                  }}
                >
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div
                  className="mb-4 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5"
                  style={{
                    background: 'rgba(23, 215, 25, 0.1)',
                    color: '#0B5B24',
                    border: '1px solid rgba(23, 215, 25, 0.3)',
                  }}
                >
                  <span>✓</span>
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                    Staff Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eric Manzi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FFB800]"
                    style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                    Staff Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="staff@dubazaarmart.rw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FFB800]"
                    style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
                  />
                </div>

                <div>
                  <label htmlFor="account-role" className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                    Account Type
                  </label>
                  <select
                    id="account-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value === 'admin' ? 'admin' : 'staff')}
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FFB800]"
                    style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
                  >
                    <option value="staff">Staff — operational access</option>
                    <option value="admin">Administrator — full access</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
                      Initial Password * (min 12 chars)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs font-semibold text-[#FF6A00] hover:underline"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FFB800]"
                    style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
                  />

                  {/* Password Strength Meter */}
                  {password.length > 0 && (
                    <div className="mt-2.5 p-3 rounded-xl bg-[#FFF7E8]/60 border border-[#FFB800]/50 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>Strength:</span>
                        <span style={{ color: strengthColor }}>{strengthLabel}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${(strengthScore / 4) * 100}%`,
                            background: strengthColor,
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                        <span className={hasLength ? 'text-[#0B5B24] font-semibold' : 'text-gray-500'}>
                          {hasLength ? '✓' : '○'} 12+ Characters
                        </span>
                        <span className={hasUpperLower ? 'text-[#0B5B24] font-semibold' : 'text-gray-500'}>
                          {hasUpperLower ? '✓' : '○'} Upper & Lower
                        </span>
                        <span className={hasNumber ? 'text-[#0B5B24] font-semibold' : 'text-gray-500'}>
                          {hasNumber ? '✓' : '○'} Numbers (0-9)
                        </span>
                        <span className={hasSpecial ? 'text-[#0B5B24] font-semibold' : 'text-gray-500'}>
                          {hasSpecial ? '✓' : '○'} Special Symbol
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#FFB800]"
                    style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || (password.length > 0 && password.length < 12)}
                  className="w-full py-3.5 rounded-xl text-sm font-bold btn-gold transition-all flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-[0.99] disabled:opacity-50 mt-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
                      </svg>
                      <span>Encrypting & Provisioning...</span>
                    </>
                  ) : (
                    role === 'staff' ? 'Provision Staff Account' : 'Provision Administrator Account'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Existing Administrators List */}
          <div className="lg:col-span-2">
            <div
              className="rounded-3xl p-6 shadow-xl border bg-white sticky top-8"
              style={{ borderColor: '#FFB800' }}
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F1FFF0]">
                <div>
                  <h3 className="font-bold text-[#111111] text-base">Team Accounts</h3>
                  <p className="text-xs text-black/50">Administrator and staff access</p>
                </div>
                <span className="badge px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: '#FFF7E8', color: '#FF6A00' }}>
                  {existingAdmins.length} Total
                </span>
              </div>

              {loadingAdmins ? (
                <div className="py-8 text-center text-xs text-black/50">Loading staff records...</div>
              ) : existingAdmins.length === 0 ? (
                <div className="py-8 text-center text-xs text-black/50">No staff records found.</div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {existingAdmins.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl flex items-center justify-between transition-colors"
                      style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-[#111111] truncate">{item.name}</div>
                        <div className="text-[11px] text-black/60 truncate">{item.email}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(255,106,0,0.15)', color: '#FF6A00' }}>
                        {item.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
