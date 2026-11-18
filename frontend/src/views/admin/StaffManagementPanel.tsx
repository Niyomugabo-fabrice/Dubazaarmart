"use client"

import { useCallback, useEffect, useState } from "react"
import {
  createStaffUser,
  deleteStaffUser,
  fetchStaffUsers,
  updateStaffPermissions,
  updateStaffStatus,
  type StaffUserRecord,
} from "../../lib/dashboardApi"

const STAFF_PERMISSIONS = [
  ["products.view", "View products"],
  ["products.create", "Create products"],
  ["products.update", "Edit products"],
  ["products.delete", "Delete products"],
  ["media.upload", "Upload media"],
  ["inventory.view", "View inventory"],
  ["inventory.update", "Update inventory"],
  ["orders.view", "View orders"],
  ["orders.create", "Create orders"],
  ["orders.update", "Update orders"],
  ["orders.delete", "Delete orders"],
  ["procurement.view", "View procurement"],
  ["procurement.manage", "Manage procurement"],
  ["reports.view", "View reports"],
  ["announcements.view", "View announcements"],
  ["announcements.manage", "Manage announcements"],
] as const

export default function StaffManagementPanel() {
  const [staff, setStaff] = useState<StaffUserRecord[]>([])
  const [permissionDrafts, setPermissionDrafts] = useState<Record<string, string[]>>({})
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadStaff = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchStaffUsers({ pageSize: 100 })
      setStaff(result.items)
      setPermissionDrafts(Object.fromEntries(result.items.map((user) => [user.id, user.permissions])))
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Staff accounts could not be loaded.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStaff()
  }, [loadStaff])

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setSaving(true)
    try {
      await createStaffUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        password,
      })
      setFirstName("")
      setLastName("")
      setEmail("")
      setPhoneNumber("")
      setPassword("")
      setMessage("Staff account created as pending. Assign permissions and activate it when ready.")
      await loadStaff()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Staff account could not be created.")
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(user: StaffUserRecord, action: "activate" | "deactivate" | "suspend") {
    setError(null)
    try {
      await updateStaffStatus(user.id, action)
      await loadStaff()
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Staff status could not be updated.")
    }
  }

  async function savePermissions(user: StaffUserRecord) {
    setError(null)
    try {
      await updateStaffPermissions(user.id, permissionDrafts[user.id] ?? [])
      setMessage(`Permissions saved for ${user.name}.`)
      await loadStaff()
    } catch (permissionError) {
      setError(permissionError instanceof Error ? permissionError.message : "Permissions could not be saved.")
    }
  }

  async function removeStaff(user: StaffUserRecord) {
    if (!window.confirm(`Remove ${user.name} from staff access?`)) return
    setError(null)
    try {
      await deleteStaffUser(user.id)
      await loadStaff()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Staff account could not be removed.")
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <div className="badge mb-2" style={{ color: "#FF6A00" }}>MANAGER CONTROLS</div>
        <h1 className="text-2xl font-bold text-[#111111]">Staff management</h1>
        <p className="mt-1 text-sm text-slate-600">Create staff accounts, review registration requests, and assign least-privilege access.</p>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}

      <form onSubmit={handleCreate} className="grid gap-3 rounded-2xl border border-[#FFB800] bg-white p-5 md:grid-cols-2">
        <h2 className="md:col-span-2 text-lg font-bold text-[#111111]">Create staff account</h2>
        <input required minLength={2} maxLength={60} value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" className="rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-2.5 text-sm" />
        <input required minLength={2} maxLength={60} value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" className="rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-2.5 text-sm" />
        <input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Staff email" className="rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-2.5 text-sm" />
        <input maxLength={32} value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="Phone (optional)" className="rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-2.5 text-sm" />
        <input required type="password" minLength={12} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Temporary password (12+ characters)" className="rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-2.5 text-sm" />
        <button disabled={saving} className="btn-gold rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60">
          {saving ? "Creating…" : "Create pending staff account"}
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#111111]">Staff accounts ({staff.length})</h2>
        {loading ? (
          <p className="rounded-xl bg-white p-5 text-sm text-slate-500">Loading staff accounts…</p>
        ) : staff.length === 0 ? (
          <p className="rounded-xl bg-white p-5 text-sm text-slate-500">No staff accounts yet.</p>
        ) : staff.map((user) => {
          const permissions = permissionDrafts[user.id] ?? []
          return (
            <article key={user.id} className="rounded-2xl border border-[#FFB800] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-[#111111]">{user.name}</h3>
                  <p className="text-sm text-slate-600">{user.email}{user.phoneNumber ? ` · ${user.phoneNumber}` : ""}</p>
                  <p className="mt-1 text-xs text-slate-500">Status: <strong>{user.status}</strong> · Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.status !== "ACTIVE" && <button onClick={() => void changeStatus(user, "activate")} className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">Activate</button>}
                  {user.status === "ACTIVE" && <button onClick={() => void changeStatus(user, "deactivate")} className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">Deactivate</button>}
                  {user.status !== "SUSPENDED" && <button onClick={() => void changeStatus(user, "suspend")} className="rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-800">Suspend</button>}
                  <button onClick={() => void removeStaff(user)} className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800">Remove</button>
                </div>
              </div>
              <fieldset className="mt-4 border-t border-slate-100 pt-4">
                <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-600">Permissions</legend>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {STAFF_PERMISSIONS.map(([permission, label]) => (
                    <label key={permission} className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={permissions.includes(permission)}
                        onChange={(event) => setPermissionDrafts((current) => ({
                          ...current,
                          [user.id]: event.target.checked
                            ? [...permissions, permission]
                            : permissions.filter((item) => item !== permission),
                        }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <button onClick={() => void savePermissions(user)} type="button" className="btn-gold mt-4 rounded-lg px-4 py-2 text-xs font-bold">
                  Save permissions
                </button>
              </fieldset>
            </article>
          )
        })}
      </div>
    </section>
  )
}
