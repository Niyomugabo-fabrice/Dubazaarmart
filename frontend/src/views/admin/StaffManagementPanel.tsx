"use client"

import { Fragment, useCallback, useEffect, useState } from "react"
import {
  createStaffUser,
  deleteStaffUser,
  fetchStaffUsers,
  promoteStaffUserToManager,
  updateStaffStatus,
  updateStaffUser,
  verifyStaffUser,
  type StaffUserRecord,
} from "../../lib/dashboardApi"
import { useAdminAuth } from "../../store/adminAuthStore"

type StaffStatus = StaffUserRecord["status"]
type StaffProfileDraft = Pick<StaffUserRecord, "firstName" | "lastName" | "email"> & {
  phoneNumber: string
}

const PAGE_SIZE = 20
const STATUS_OPTIONS: StaffStatus[] = ["PENDING", "ACTIVE", "INACTIVE", "SUSPENDED"]

const STATUS_STYLES: Record<StaffStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  INACTIVE: "bg-slate-100 text-slate-700",
  PENDING: "bg-amber-100 text-amber-800",
  SUSPENDED: "bg-red-100 text-red-800",
}

function formatLastLogin(value: string | null): string {
  if (!value) return "Never"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString()
}

export default function StaffManagementPanel() {
  const { admin } = useAdminAuth()
  const [staff, setStaff] = useState<StaffUserRecord[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | StaffStatus>("ALL")
  const [page, setPage] = useState(1)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<StaffProfileDraft | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadStaff = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchStaffUsers({
        search: search.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        page,
        pageSize: PAGE_SIZE,
      })
      setTotal(result.total)
      setError(null)
      const lastPage = Math.max(1, Math.ceil(result.total / PAGE_SIZE))
      if (page > lastPage) {
        setPage(lastPage)
        return
      }
      setStaff(result.items)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Staff accounts could not be loaded.")
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadStaff(), 250)
    return () => window.clearTimeout(timeout)
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
      setSearch("")
      setStatusFilter("ALL")
      setPage(1)
      setMessage("Staff account created as pending. Verify the email and activate the account when ready.")
      if (page === 1 && search === "" && statusFilter === "ALL") void loadStaff()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Staff account could not be created.")
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(user: StaffUserRecord, action: "activate" | "deactivate" | "suspend") {
    setError(null)
    setMessage(null)
    setSavingUserId(user.id)
    try {
      await updateStaffStatus(user.id, action)
      setMessage(`${user.name} was ${action === "activate" ? "activated" : action === "deactivate" ? "deactivated" : "suspended"}.`)
      await loadStaff()
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Staff status could not be updated.")
    } finally {
      setSavingUserId(null)
    }
  }

  async function verifyEmail(user: StaffUserRecord) {
    setError(null)
    setMessage(null)
    setSavingUserId(user.id)
    try {
      await verifyStaffUser(user.id)
      setMessage(`Email verified for ${user.name}.`)
      await loadStaff()
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : "Staff email could not be verified.")
    } finally {
      setSavingUserId(null)
    }
  }

  async function promoteToManager(user: StaffUserRecord) {
    const confirmed = window.confirm(
      `Promote ${user.name} to manager? Managers can manage staff, edit settings, and view audit logs.`,
    )
    if (!confirmed) return
    setError(null)
    setMessage(null)
    setSavingUserId(user.id)
    try {
      await promoteStaffUserToManager(user.id)
      setMessage(`${user.name} is now a manager.`)
      await loadStaff()
    } catch (promotionError) {
      setError(promotionError instanceof Error ? promotionError.message : "Staff member could not be promoted.")
    } finally {
      setSavingUserId(null)
    }
  }

  function startEditing(user: StaffUserRecord) {
    setEditingUserId(user.id)
    setEditDraft({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber ?? "",
    })
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>, user: StaffUserRecord) {
    event.preventDefault()
    if (!editDraft) return
    setError(null)
    setMessage(null)
    setSavingUserId(user.id)
    try {
      const updated = await updateStaffUser(user.id, {
        firstName: editDraft.firstName.trim(),
        lastName: editDraft.lastName.trim(),
        email: editDraft.email.trim(),
        phoneNumber: editDraft.phoneNumber.trim() || null,
      })
      setEditingUserId(null)
      setEditDraft(null)
      setMessage(`Staff details updated for ${updated.name}.`)
      await loadStaff()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Staff details could not be updated.")
    } finally {
      setSavingUserId(null)
    }
  }

  async function removeStaff(user: StaffUserRecord) {
    if (!window.confirm(`Remove ${user.name} from staff access?`)) return
    setError(null)
    setMessage(null)
    setSavingUserId(user.id)
    try {
      await deleteStaffUser(user.id)
      setMessage(`${user.name} was removed from staff access.`)
      setEditingUserId(null)
      setEditDraft(null)
      if (staff.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        await loadStaff()
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Staff account could not be removed.")
    } finally {
      setSavingUserId(null)
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastItem = Math.min(page * PAGE_SIZE, total)

  return (
    <section className="space-y-6">
      <header>
        <div className="badge mb-2" style={{ color: "#FF6A00" }}>MANAGER CONTROLS</div>
        <h1 className="text-2xl font-bold text-[#111111]">User management</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage staff and manager accounts. User Management, Audit Log, and store settings/content—including announcement publishing—remain manager-only.
        </p>
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
        <button disabled={saving} type="submit" className="btn-gold rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60">
          {saving ? "Creating…" : "Create pending staff account"}
        </button>
      </form>

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#111111]">Managed accounts ({total})</h2>
            <p className="text-xs text-slate-500">Search staff and managers, review verification, and manage account access.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search name, email, or phone"
              aria-label="Search staff accounts"
              className="min-w-60 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as "ALL" | StaffStatus)
                setPage(1)
              }}
              aria-label="Filter staff by status"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="ALL">All statuses</option>
              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#FFB800] bg-white">
          <table className="min-w-[1050px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#FFF7E8] text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3">Name</th>
                <th scope="col" className="px-4 py-3">Role</th>
                <th scope="col" className="px-4 py-3">Email</th>
                <th scope="col" className="px-4 py-3">Phone</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Email verification</th>
                <th scope="col" className="px-4 py-3">Last login</th>
                <th scope="col" className="px-4 py-3">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading accounts…</td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No accounts match this search.</td></tr>
              ) : staff.map((user) => (
                <Fragment key={user.id}>
                  <tr key={user.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{user.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === "MANAGER" ? "bg-violet-100 text-violet-800" : "bg-slate-100 text-slate-700"}`}>
                        {user.role === "MANAGER" ? "Manager" : "Staff"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{user.email}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{user.phoneNumber || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[user.status]}`}>{user.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.emailVerified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {user.emailVerified ? "Verified" : "Not verified"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatLastLogin(user.lastLoginAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-64 flex-wrap gap-2">
                        {!user.emailVerified && (
                          <button disabled={Boolean(savingUserId)} onClick={() => void verifyEmail(user)} type="button" className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800 disabled:opacity-50">
                            Verify email
                          </button>
                        )}
                        {user.status !== "ACTIVE" && (
                          <button disabled={Boolean(savingUserId)} onClick={() => void changeStatus(user, "activate")} type="button" className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 disabled:opacity-50">
                            Activate
                          </button>
                        )}
                        {user.status === "ACTIVE" && user.id !== admin?.id && (
                          <button disabled={Boolean(savingUserId)} onClick={() => void changeStatus(user, "deactivate")} type="button" className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 disabled:opacity-50">
                            Deactivate
                          </button>
                        )}
                        {user.status !== "SUSPENDED" && user.id !== admin?.id && (
                          <button disabled={Boolean(savingUserId)} onClick={() => void changeStatus(user, "suspend")} type="button" className="rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-800 disabled:opacity-50">
                            Suspend
                          </button>
                        )}
                        {user.status === "ACTIVE" && user.emailVerified && (
                          <button disabled={Boolean(savingUserId)} onClick={() => void promoteToManager(user)} type="button" className="rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-800 disabled:opacity-50">
                            Make manager
                          </button>
                        )}
                        <button disabled={Boolean(savingUserId)} onClick={() => startEditing(user)} type="button" className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 disabled:opacity-50">
                          Edit
                        </button>
                        {user.id !== admin?.id && (
                          <button disabled={Boolean(savingUserId)} onClick={() => void removeStaff(user)} type="button" className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800 disabled:opacity-50">
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {editingUserId === user.id && editDraft && (
                    <tr key={`${user.id}-edit`}>
                      <td colSpan={8} className="bg-slate-50 px-4 py-4">
                        <form onSubmit={(event) => void saveProfile(event, user)} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <input required minLength={2} maxLength={60} value={editDraft.firstName} onChange={(event) => setEditDraft({ ...editDraft, firstName: event.target.value })} aria-label="Staff first name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                          <input required minLength={2} maxLength={60} value={editDraft.lastName} onChange={(event) => setEditDraft({ ...editDraft, lastName: event.target.value })} aria-label="Staff last name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                          <input required type="email" maxLength={254} value={editDraft.email} onChange={(event) => setEditDraft({ ...editDraft, email: event.target.value })} aria-label="Staff email" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                          <input maxLength={32} value={editDraft.phoneNumber} onChange={(event) => setEditDraft({ ...editDraft, phoneNumber: event.target.value })} aria-label="Staff phone number" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
                            <button disabled={Boolean(savingUserId)} type="submit" className="btn-gold rounded-lg px-4 py-2 text-xs font-bold disabled:opacity-50">
                              Save changes
                            </button>
                            <button disabled={Boolean(savingUserId)} onClick={() => { setEditingUserId(null); setEditDraft(null) }} type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold disabled:opacity-50">
                              Cancel
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <span>Showing {firstItem}–{lastItem} of {total}</span>
          <div className="flex items-center gap-2">
            <button disabled={loading || page <= 1} onClick={() => setPage((current) => current - 1)} type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50">
              Previous
            </button>
            <span>Page {page} of {pageCount}</span>
            <button disabled={loading || page >= pageCount} onClick={() => setPage((current) => current + 1)} type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
