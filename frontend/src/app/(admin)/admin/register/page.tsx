"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import SiteLogo from "@/components/SiteLogo"
import { apiFetch, apiUrl } from "@/services/api-client"

export default function StaffRegistrationPage() {
  const [registrationEnabled, setRegistrationEnabled] = useState(false)
  const [checkingSettings, setCheckingSettings] = useState(true)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let active = true
    apiFetch(apiUrl("/api/settings"))
      .then(async (response) => {
        if (!response.ok) throw new Error("Staff registration settings could not be loaded.")
        const result = await response.json() as { settings?: { allowStaffRegistration?: boolean } }
        if (active) setRegistrationEnabled(result.settings?.allowStaffRegistration === true)
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Staff registration settings could not be loaded.")
      })
      .finally(() => {
        if (active) setCheckingSettings(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function submitRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    setSubmitting(true)
    try {
      const response = await apiFetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
          password,
        }),
      })
      const result = await response.json() as { message?: string; error?: string }
      if (!response.ok) throw new Error(result.message || result.error || "Registration could not be submitted.")
      setSubmitted(true)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Registration could not be submitted.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF7E8] px-4 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-[#FFB800] bg-white p-7 shadow-xl sm:p-9">
        <div className="mb-6 text-center">
          <SiteLogo className="mx-auto mb-3 h-14 w-14" />
          <div className="badge mb-2" style={{ color: "#FF6A00" }}>STAFF ACCESS</div>
          <h1 className="text-2xl font-bold text-[#111111]">Request staff account</h1>
          <p className="mt-2 text-sm text-slate-600">Staff access requires manager approval and permission assignment.</p>
        </div>

        {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        {checkingSettings ? (
          <p className="py-6 text-center text-sm text-slate-500">Checking registration availability…</p>
        ) : submitted ? (
          <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-sm text-emerald-900">
            Your request was submitted. A manager must activate your account before you can sign in.
          </div>
        ) : registrationEnabled ? (
          <form onSubmit={submitRegistration} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-[#111111]">
                First name
                <input required minLength={2} maxLength={60} value={firstName} onChange={(event) => setFirstName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-3 text-sm" />
              </label>
              <label className="text-xs font-semibold text-[#111111]">
                Last name
                <input required minLength={2} maxLength={60} value={lastName} onChange={(event) => setLastName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-3 text-sm" />
              </label>
            </div>
            <label className="block text-xs font-semibold text-[#111111]">
              Email address
              <input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-3 text-sm" />
            </label>
            <label className="block text-xs font-semibold text-[#111111]">
              Phone number (optional)
              <input maxLength={32} autoComplete="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-3 text-sm" />
            </label>
            <label className="block text-xs font-semibold text-[#111111]">
              Password (12-72 characters)
              <input required type="password" minLength={12} maxLength={72} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-3 text-sm" />
            </label>
            <label className="block text-xs font-semibold text-[#111111]">
              Confirm password
              <input required type="password" minLength={12} maxLength={72} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-3 text-sm" />
            </label>
            <button disabled={submitting} className="btn-gold w-full rounded-xl py-3 font-bold disabled:opacity-60">
              {submitting ? "Submitting…" : "Submit staff request"}
            </button>
          </form>
        ) : (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center text-sm text-amber-900">
            Public staff registration is currently disabled. Please contact a manager to request access.
          </p>
        )}

        <Link href="/admin/login" className="mt-6 block text-center text-sm font-semibold text-[#FF6A00] hover:underline">
          Back to manager/staff login
        </Link>
      </section>
    </main>
  )
}
