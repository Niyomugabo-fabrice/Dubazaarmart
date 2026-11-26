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
import ConfirmModal from "../../components/ConfirmModal"
import { useAdminAuth } from "../../store/adminAuthStore"

type StaffStatus = StaffUserRecord["status"]
type AccountConfirmation = {
  action: "promote" | "remove"
  user: StaffUserRecord
}

export const WORKER_ROLES = [
  {
    id: "SOURCING_AGENT",
    label: "Sourcing Agent",
    description: "Handles product sourcing, quotations, and customer communication",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    defaultPermissions: ["orders.view", "orders.contact", "quotations.manage", "products.view"],
  },
  {
    id: "SHIPPING_AGENT",
    label: "Shipping Agent",
    description: "Manages freight batches, shipping logistics, and order fulfillment status",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    defaultPermissions: ["batches.view", "batches.manage", "batches.totals", "orders.view", "orders.update", "orders.status"],
  },
  {
    id: "FINANCE",
    label: "Finance",
    description: "Reviews and approves payments, monitors batch totals and revenue reports",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    defaultPermissions: ["payments.approve", "orders.view", "batches.totals", "reports.view"],
  },
  {
    id: "CUSTOMER_SUPPORT",
    label: "Customer Support",
    description: "Assists customers, updates order statuses, and inspects product catalog",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    defaultPermissions: ["orders.view", "orders.contact", "orders.status", "products.view"],
  },
  {
    id: "STAFF",
    label: "General Staff",
    description: "Operational staff with customized individual permissions",
    color: "bg-slate-100 text-slate-800 border-slate-200",
    defaultPermissions: ["orders.view", "products.view", "inventory.view"],
  },
] as const

export const PERMISSION_GROUPS = [
  {
    name: "Orders & Customers",
    permissions: [
      { id: "orders.view", label: "View Orders", desc: "View incoming and past customer orders" },
      { id: "orders.contact", label: "Contact Customers", desc: "Access customer phone/email and initiate contact" },
      { id: "orders.status", label: "Change Order Status", desc: "Update delivery and fulfillment status stages" },
      { id: "orders.create", label: "Create Orders", desc: "Manually place new customer orders" },
      { id: "orders.update", label: "Edit Orders", desc: "Update items, notes, and delivery address" },
      { id: "orders.delete", label: "Delete / Archive Orders", desc: "Soft-delete orders from the active list" },
    ],
  },
  {
    name: "Payments & Financials",
    permissions: [
      { id: "payments.approve", label: "Approve Payments", desc: "Verify and mark customer payments as PAID" },
      { id: "reports.view", label: "View Reports & Metrics", desc: "Access revenue KPIs and sales overview charts" },
      { id: "batches.totals", label: "View Batch Totals", desc: "View sea & air freight batch financial/weight totals" },
    ],
  },
  {
    name: "Sourcing & Logistics (Freight Batches)",
    permissions: [
      { id: "quotations.manage", label: "Prepare & Send Quotations", desc: "Manage quotations and sourcing requests" },
      { id: "batches.view", label: "View Freight Batches", desc: "Inspect air and sea freight batch manifests" },
      { id: "batches.manage", label: "Close & Ship Batches", desc: "Dispatch and manage freight batch status" },
      { id: "procurement.view", label: "View Restock POs", desc: "View company supplier purchase orders" },
      { id: "procurement.manage", label: "Manage Restock POs", desc: "Create, edit and receive company POs" },
    ],
  },
  {
    name: "Products & Inventory",
    permissions: [
      { id: "products.view", label: "View Catalog", desc: "Browse product list and inventory counts" },
      { id: "products.manage", label: "Manage Products (All)", desc: "Full control: create, edit, delete products" },
      { id: "products.create", label: "Create Products", desc: "Add new products to the catalog" },
      { id: "products.update", label: "Edit Products", desc: "Update product pricing and descriptions" },
      { id: "products.delete", label: "Delete Products", desc: "Remove products from the catalog" },
      { id: "inventory.view", label: "View Inventory & Stock", desc: "Inspect stock levels and movement history" },
      { id: "inventory.update", label: "Adjust Stock", desc: "Record stock adjustments and inventory removals" },
      { id: "media.upload", label: "Upload Images", desc: "Upload product and banner media" },
    ],
  },
  {
    name: "Store Content & Marketing",
    permissions: [
      { id: "categories.view", label: "View Categories", desc: "View store categories" },
      { id: "categories.manage", label: "Manage Categories", desc: "Create and update categories" },
      { id: "heroSlides.view", label: "View Hero Section", desc: "View homepage carousel slides" },
      { id: "heroSlides.manage", label: "Manage Hero Section", desc: "Add and update hero slides" },
      { id: "testimonials.view", label: "View Testimonials", desc: "View customer testimonials" },
      { id: "testimonials.create", label: "Create Testimonials", desc: "Add customer testimonials" },
      { id: "testimonials.update", label: "Edit Testimonials", desc: "Update customer testimonials" },
      { id: "testimonials.delete", label: "Delete Testimonials", desc: "Remove customer testimonials" },
      { id: "announcements.view", label: "View Announcements", desc: "View site announcement banners" },
      { id: "announcements.manage", label: "Manage Announcements", desc: "Publish and edit announcements" },
    ],
  },
]

const ALL_PERMISSION_IDS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.id))
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

function getWorkerRoleBadge(role: "MANAGER" | "STAFF", workerRole?: string | null) {
  if (role === "MANAGER") {
    return (
      <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-800">
        👑 Manager
      </span>
    )
  }
  const match = WORKER_ROLES.find((r) => r.id === workerRole)
  const label = match ? match.label : workerRole || "General Staff"
  const color = match ? match.color : "bg-slate-100 text-slate-800 border-slate-200"
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}>
      {label}
    </span>
  )
}

export default function StaffManagementPanel() {
  const { admin } = useAdminAuth()
  const [staff, setStaff] = useState<StaffUserRecord[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | StaffStatus>("ALL")
  const [page, setPage] = useState(1)

  // Creation form state
  const [createRole, setCreateRole] = useState<string>("SOURCING_AGENT")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [createPermissions, setCreatePermissions] = useState<string[]>([])
  const [showPermissionCheckboxes, setShowPermissionCheckboxes] = useState(false)

  // Editing modal/drawer state
  const [editingUser, setEditingUser] = useState<StaffUserRecord | null>(null)
  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editWorkerRole, setEditWorkerRole] = useState("")
  const [editPermissions, setEditPermissions] = useState<string[]>([])

  const [accountConfirmation, setAccountConfirmation] = useState<AccountConfirmation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Initialize create permissions when role changes
  function handleCreateRoleChange(roleId: string) {
    setCreateRole(roleId)
    const match = WORKER_ROLES.find((r) => r.id === roleId)
    if (match) {
      setCreatePermissions([...match.defaultPermissions])
    }
  }

  useEffect(() => {
    const match = WORKER_ROLES.find((r) => r.id === createRole)
    if (match) {
      setCreatePermissions([...match.defaultPermissions])
    }
  }, [])

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
      setError(loadError instanceof Error ? loadError.message : "User accounts could not be loaded.")
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
    if (password !== confirmPassword) {
      setError("The two passwords do not match.")
      return
    }
    setSaving(true)
    try {
      await createStaffUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneNumber: phone.trim() || undefined,
        password,
        workerRole: createRole,
        permissions: createPermissions,
        status: "ACTIVE",
      })
      setFirstName("")
      setLastName("")
      setEmail("")
      setPhone("")
      setPassword("")
      setConfirmPassword("")
      setSearch("")
      setStatusFilter("ALL")
      setPage(1)
      setMessage(`Worker account created for ${firstName.trim()} with role ${WORKER_ROLES.find(r => r.id === createRole)?.label || createRole}.`)
      void loadStaff()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "User account could not be created.")
    } finally {
      setSaving(false)
    }
  }

  function startEditing(user: StaffUserRecord) {
    setEditingUser(user)
    setEditFirstName(user.firstName)
    setEditLastName(user.lastName)
    setEditEmail(user.email)
    setEditPhone(user.phoneNumber || "")
    setEditWorkerRole(user.workerRole || "STAFF")
    setEditPermissions(Array.isArray(user.permissions) ? [...user.permissions] : [])
  }

  function handleEditRoleChange(roleId: string) {
    setEditWorkerRole(roleId)
    const match = WORKER_ROLES.find((r) => r.id === roleId)
    if (match) {
      setEditPermissions([...match.defaultPermissions])
    }
  }

  async function handleSaveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingUser) return
    setError(null)
    setMessage(null)
    setSavingUserId(editingUser.id)
    try {
      const updated = await updateStaffUser(editingUser.id, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        email: editEmail.trim(),
        phoneNumber: editPhone.trim() || null,
        workerRole: editWorkerRole,
        permissions: editPermissions,
      })
      setEditingUser(null)
      setMessage(`Worker details and permissions updated for ${updated.name}.`)
      await loadStaff()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Worker could not be updated.")
    } finally {
      setSavingUserId(null)
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
      setError(statusError instanceof Error ? statusError.message : "User status could not be updated.")
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
      setError(verificationError instanceof Error ? verificationError.message : "User email could not be verified.")
    } finally {
      setSavingUserId(null)
    }
  }

  async function promoteToManager(user: StaffUserRecord) {
    setError(null)
    setMessage(null)
    setSavingUserId(user.id)
    try {
      await promoteStaffUserToManager(user.id)
      setMessage(`${user.name} is now a Manager with full access.`)
      await loadStaff()
    } catch (promotionError) {
      setError(promotionError instanceof Error ? promotionError.message : "User could not be promoted.")
    } finally {
      setSavingUserId(null)
    }
  }

  async function removeStaff(user: StaffUserRecord) {
    setError(null)
    setMessage(null)
    setSavingUserId(user.id)
    try {
      await deleteStaffUser(user.id)
      setMessage(`${user.name} was removed from user access.`)
      setEditingUser(null)
      if (staff.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        await loadStaff()
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "User account could not be removed.")
    } finally {
      setSavingUserId(null)
    }
  }

  async function confirmAccountAction() {
    if (!accountConfirmation) return
    if (accountConfirmation.action === "promote") {
      await promoteToManager(accountConfirmation.user)
    } else {
      await removeStaff(accountConfirmation.user)
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastItem = Math.min(page * PAGE_SIZE, total)

  return (
    <section className="space-y-6">
      <header>
        <div className="badge mb-2" style={{ color: "#FF6A00" }}>MANAGER ACCESS CONTROL</div>
        <h1 className="text-2xl font-bold text-[#111111]">Workers &amp; Permissions</h1>
        <p className="mt-1 text-sm text-slate-600">
          The Manager has full access to everything. Add workers, assign operational roles, customize individual permissions, and deactivate accounts without deleting their history.
        </p>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}

      {/* Add Worker Form */}
      <form onSubmit={handleCreate} className="rounded-2xl border border-[#FFB800] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#111111]">Add New Worker</h2>
            <p className="text-xs text-slate-500">Provision a staff member with a specific role and granular permissions.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPermissionCheckboxes((prev) => !prev)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {showPermissionCheckboxes ? "Hide Permission Customization ▲" : "Customize Permissions (" + createPermissions.length + " active) ▼"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
            <input
              required
              minLength={2}
              maxLength={60}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="e.g. Jean"
              className="w-full rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
            <input
              required
              minLength={2}
              maxLength={60}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="e.g. Mugisha"
              className="w-full rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Worker Role *</label>
            <select
              value={createRole}
              onChange={(event) => handleCreateRoleChange(event.target.value)}
              className="w-full rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-2 text-sm font-semibold text-slate-900"
            >
              {WORKER_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              required
              type="email"
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="worker@dubazaarmart.rw"
              className="w-full rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              maxLength={32}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+250 78X XXX XXX"
              className="w-full rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password (12+ chars) *</label>
            <input
              required
              type="password"
              minLength={12}
              maxLength={72}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password *</label>
            <input
              required
              type="password"
              minLength={12}
              maxLength={72}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-[#FFB800] bg-[#FFF7E8] px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Granular Permissions Section */}
        {showPermissionCheckboxes && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Granted Permissions ({createPermissions.length} selected)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCreatePermissions([...ALL_PERMISSION_IDS])}
                  className="text-xs font-semibold text-[#FF6A00] hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setCreatePermissions([])}
                  className="text-xs font-semibold text-slate-500 hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.name} className="rounded-lg border border-slate-200 bg-white p-3">
                  <h4 className="text-xs font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1">
                    {group.name}
                  </h4>
                  <div className="space-y-2">
                    {group.permissions.map((p) => {
                      const checked = createPermissions.includes(p.id)
                      return (
                        <label key={p.id} className="flex items-start gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCreatePermissions([...createPermissions, p.id])
                              } else {
                                setCreatePermissions(createPermissions.filter((id) => id !== p.id))
                              }
                            }}
                            className="mt-0.5 rounded border-slate-300 text-[#FF6A00] focus:ring-[#FF6A00]"
                          />
                          <div>
                            <span className="font-semibold text-slate-800">{p.label}</span>
                            <p className="text-[11px] text-slate-500 leading-tight">{p.desc}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            disabled={saving}
            type="submit"
            className="btn-gold rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-60 shadow-sm"
          >
            {saving ? "Creating Worker…" : "Create & Activate Worker Account"}
          </button>
        </div>
      </form>

      {/* Workers List */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#111111]">Active &amp; Managed Workers ({total})</h2>
            <p className="text-xs text-slate-500">
              Manage accounts, assign roles, edit permissions, and toggle active status.
            </p>
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
              aria-label="Search worker accounts"
              className="min-w-60 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as "ALL" | StaffStatus)
                setPage(1)
              }}
              aria-label="Filter workers by status"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="ALL">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#FFB800] bg-white shadow-sm">
          <table className="min-w-[1150px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#FFF7E8] text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3">Worker Name</th>
                <th scope="col" className="px-4 py-3">Assigned Role</th>
                <th scope="col" className="px-4 py-3">Permissions</th>
                <th scope="col" className="px-4 py-3">Email</th>
                <th scope="col" className="px-4 py-3">Phone</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Last Login</th>
                <th scope="col" className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Loading worker accounts…
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No worker accounts match your search.
                  </td>
                </tr>
              ) : (
                staff.map((user) => {
                  const permCount = Array.isArray(user.permissions) ? user.permissions.length : 0
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                        {user.name}
                      </td>
                      <td className="px-4 py-3">
                        {getWorkerRoleBadge(user.role, user.workerRole)}
                      </td>
                      <td className="px-4 py-3">
                        {user.role === "MANAGER" ? (
                          <span className="text-xs font-semibold text-violet-700">Full Access (All)</span>
                        ) : (
                          <span
                            title={user.permissions.join(", ")}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 cursor-help"
                          >
                            🔑 {permCount} permission{permCount === 1 ? "" : "s"}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">{user.email}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {user.phoneNumber || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[user.status]}`}>
                          {user.status === "INACTIVE" ? "DEACTIVATED" : user.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatLastLogin(user.lastLoginAt ?? null)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-64 flex-wrap gap-1.5">
                          {/* Permissions & Edit */}
                          <button
                            disabled={Boolean(savingUserId)}
                            onClick={() => startEditing(user)}
                            type="button"
                            className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-200 disabled:opacity-50"
                          >
                            Edit &amp; Permissions
                          </button>

                          {/* Verify */}
                          {!user.emailVerified && (
                            <button
                              disabled={Boolean(savingUserId)}
                              onClick={() => void verifyEmail(user)}
                              type="button"
                              className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-200 disabled:opacity-50"
                            >
                              Verify
                            </button>
                          )}

                          {/* Activate / Deactivate (Preserves History) */}
                          {user.status !== "ACTIVE" && (
                            <button
                              disabled={Boolean(savingUserId)}
                              onClick={() => void changeStatus(user, "activate")}
                              type="button"
                              className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-200 disabled:opacity-50"
                            >
                              Activate
                            </button>
                          )}
                          {user.status === "ACTIVE" && user.id !== admin?.id && (
                            <button
                              disabled={Boolean(savingUserId)}
                              onClick={() => void changeStatus(user, "deactivate")}
                              type="button"
                              title="Deactivates worker login without deleting their history"
                              className="rounded-lg bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-300 disabled:opacity-50"
                            >
                              Deactivate
                            </button>
                          )}

                          {/* Promote to Manager */}
                          {user.role === "STAFF" && user.status === "ACTIVE" && (
                            <button
                              disabled={Boolean(savingUserId)}
                              onClick={() => setAccountConfirmation({ action: "promote", user })}
                              type="button"
                              className="rounded-lg bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800 hover:bg-violet-200 disabled:opacity-50"
                            >
                              Make Manager
                            </button>
                          )}

                          {/* Soft Delete */}
                          {user.id !== admin?.id && (
                            <button
                              disabled={Boolean(savingUserId)}
                              onClick={() => setAccountConfirmation({ action: "remove", user })}
                              type="button"
                              className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 hover:bg-red-200 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <span>Showing {firstItem}–{lastItem} of {total}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={loading || page <= 1}
              onClick={() => setPage((current) => current - 1)}
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {page} of {pageCount}</span>
            <button
              disabled={loading || page >= pageCount}
              onClick={() => setPage((current) => current + 1)}
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Edit Worker & Permissions Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="relative my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Edit Worker &amp; Permissions: {editingUser.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Update role assignment, contact details, and granular feature permissions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {editingUser.role === "STAFF" && (
                <div className="border-t pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Assigned Role Preset:
                      </label>
                      <select
                        value={editWorkerRole}
                        onChange={(e) => handleEditRoleChange(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800"
                      >
                        {WORKER_ROLES.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setEditPermissions([...ALL_PERMISSION_IDS])}
                        className="text-[#FF6A00] hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setEditPermissions([])}
                        className="text-slate-500 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Permission Groups */}
                  <div className="max-h-72 overflow-y-auto space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {PERMISSION_GROUPS.map((group) => (
                      <div key={group.name} className="rounded-lg border border-slate-200 bg-white p-3">
                        <h4 className="text-xs font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1">
                          {group.name}
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {group.permissions.map((p) => {
                            const checked = editPermissions.includes(p.id)
                            return (
                              <label key={p.id} className="flex items-start gap-2 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditPermissions([...editPermissions, p.id])
                                    } else {
                                      setEditPermissions(editPermissions.filter((id) => id !== p.id))
                                    }
                                  }}
                                  className="mt-0.5 rounded border-slate-300 text-[#FF6A00] focus:ring-[#FF6A00]"
                                />
                                <div>
                                  <span className="font-semibold text-slate-800">{p.label}</span>
                                  <p className="text-[11px] text-slate-500 leading-tight">{p.desc}</p>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  disabled={Boolean(savingUserId)}
                  type="submit"
                  className="btn-gold rounded-xl px-5 py-2 text-xs font-bold disabled:opacity-50 shadow-sm"
                >
                  {savingUserId ? "Saving…" : "Save Role & Permissions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={accountConfirmation !== null}
        title={accountConfirmation?.action === "promote" ? "Promote to Manager" : "Remove Account"}
        message={
          accountConfirmation?.action === "promote"
            ? `Promote ${accountConfirmation.user.name} to Manager? Managers have full access to manage all workers, store settings, and view the activity log.`
            : accountConfirmation
              ? `Remove ${accountConfirmation.user.name} from worker access?`
              : ""
        }
        confirmLabel={accountConfirmation?.action === "promote" ? "Make Manager" : "Remove Account"}
        danger={accountConfirmation?.action === "remove"}
        onConfirm={confirmAccountAction}
        onClose={() => setAccountConfirmation(null)}
      />
    </section>
  )
}
