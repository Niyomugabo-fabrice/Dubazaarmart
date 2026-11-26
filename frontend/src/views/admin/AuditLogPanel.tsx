"use client"

import { useEffect, useState } from "react"
import { fetchAuditLogs, type AuditLogRecord } from "../../lib/dashboardApi"

const PAGE_SIZE = 25

const COMMON_ACTION_PRESETS = [
  { label: "All Actions", value: "" },
  { label: "Logins", value: "auth.login" },
  { label: "Order Created", value: "orders.created" },
  { label: "Status Changed", value: "orders.status_changed" },
  { label: "Payment Approved", value: "payments.approved" },
  { label: "Order Cancelled", value: "orders.cancelled" },
  { label: "Worker & Permissions", value: "staff." },
  { label: "Product Created / Edited", value: "products." },
  { label: "Batches & Freight", value: "batches." },
  { label: "Quotations", value: "quotations." },
]

function formatAction(action: string): string {
  if (action === "orders.status_changed") return "Status Changed"
  if (action === "payments.approved") return "Payment Approved"
  if (action === "orders.created") return "Order Created"
  if (action === "orders.created_whatsapp") return "WhatsApp Order"
  if (action === "orders.created_admin") return "Admin Order"
  if (action === "orders.cancelled") return "Order Cancelled"
  if (action === "staff.permissions_changed") return "Permissions Changed"
  if (action === "staff.created") return "Worker Added"
  if (action === "staff.deactivated") return "Worker Deactivated"
  if (action === "staff.activated") return "Worker Activated"
  if (action === "staff.promoted_manager") return "Promoted to Manager"
  if (action === "products.created") return "Product Created"
  if (action === "products.updated") return "Product Edited"
  if (action === "products.deleted") return "Product Deleted"
  if (action === "auth.login.success") return "Login Success"
  if (action === "auth.login.failure") return "Login Failed"

  return action
    .split(/[._-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function actionStyle(action: string): string {
  const normalized = action.toLowerCase()
  if (normalized.includes("fail") || normalized.includes("delete") || normalized.includes("cancel") || normalized.includes("deactivate") || normalized.includes("suspend")) {
    return "bg-rose-50 text-rose-700 ring-rose-200"
  }
  if (normalized.includes("create") || normalized.includes("activate") || normalized.includes("approve") || normalized.includes("success") || normalized.includes("promote")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200"
  }
  if (normalized.includes("update") || normalized.includes("change") || normalized.includes("edit") || normalized.includes("verify") || normalized.includes("status")) {
    return "bg-blue-50 text-blue-700 ring-blue-200"
  }
  return "bg-slate-100 text-slate-700 ring-slate-200"
}

function formatTimestamp(value: string): { date: string; time: string } {
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) return { date: "Unknown date", time: "" }
  return {
    date: new Intl.DateTimeFormat("en-RW", { dateStyle: "medium" }).format(timestamp),
    time: new Intl.DateTimeFormat("en-RW", { timeStyle: "short" }).format(timestamp),
  }
}

function actorInitials(name: string | null): string {
  const initials = (name ?? "System")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
  return initials.toUpperCase() || "SY"
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "boolean") return value ? "true" : "false"
  if (Array.isArray(value)) return `[${value.length} items]`
  if (typeof value === "object") return "{...}"
  return String(value)
}

export default function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  // Filter input states
  const [workerInput, setWorkerInput] = useState("")
  const [actionPreset, setActionPreset] = useState("")
  const [customActionInput, setCustomActionInput] = useState("")
  const [recordNumberInput, setRecordNumberInput] = useState("")
  const [startDateInput, setStartDateInput] = useState("")
  const [endDateInput, setEndDateInput] = useState("")

  // Active filters applied
  const [filters, setFilters] = useState({
    worker: "",
    action: "",
    recordNumber: "",
    startDate: "",
    endDate: "",
  })

  const [refreshKey, setRefreshKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Selected log for detailed changes modal
  const [inspectLog, setInspectLog] = useState<AuditLogRecord | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchAuditLogs({
      page,
      pageSize: PAGE_SIZE,
      worker: filters.worker || undefined,
      action: filters.action || undefined,
      recordNumber: filters.recordNumber || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    })
      .then((result) => {
        if (!active) return
        const pageCount = Math.max(1, Math.ceil(result.total / PAGE_SIZE))
        setTotal(result.total)
        if (page > pageCount) {
          setPage(pageCount)
          return
        }
        setLogs(result.items)
        setError(null)
      })
      .catch((loadError) => {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : "Audit logs could not be loaded.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [filters, page, refreshKey])

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    const effectiveAction = (customActionInput.trim() || actionPreset).trim()
    setFilters({
      worker: workerInput.trim(),
      action: effectiveAction,
      recordNumber: recordNumberInput.trim(),
      startDate: startDateInput.trim(),
      endDate: endDateInput.trim(),
    })
  }

  function clearFilters() {
    setWorkerInput("")
    setActionPreset("")
    setCustomActionInput("")
    setRecordNumberInput("")
    setStartDateInput("")
    setEndDateInput("")
    setFilters({
      worker: "",
      action: "",
      recordNumber: "",
      startDate: "",
      endDate: "",
    })
    setPage(1)
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastItem = Math.min(page * PAGE_SIZE, total)
  const actorsCount = new Set(logs.map((log) => log.actorName).filter(Boolean)).size
  const latest = logs.length ? formatTimestamp(logs[0].createdAt) : null

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="badge mb-2 font-mono text-[11px] font-semibold text-[#FF6A00]">MANAGER ONLY</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Activity Log</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            A permanent, tamper-proof record of every important action on the website. Includes who performed the action, which record was affected, and old value → new value changes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <span aria-hidden="true">↻</span>
          Refresh Log
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recorded events</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{total.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">Matching the selected filters</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active actors on page</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{actorsCount}</p>
          <p className="mt-1 text-xs text-slate-500">Managers, workers, customers &amp; system</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest activity</p>
          <p className="mt-2 text-lg font-bold text-slate-950">{latest?.date ?? "No activity"}</p>
          <p className="mt-1 text-xs text-slate-500">{latest?.time || "New events appear automatically"}</p>
        </article>
      </div>

      {/* Filters Form */}
      <form onSubmit={applyFilters} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Filter Activity</span>
          {(filters.worker || filters.action || filters.recordNumber || filters.startDate || filters.endDate) && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
              Filters Active
            </span>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Worker / Actor</span>
            <input
              value={workerInput}
              onChange={(event) => setWorkerInput(event.target.value)}
              placeholder="e.g. Fabrice, Sourcing Agent"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Action Type</span>
            <select
              value={actionPreset}
              onChange={(event) => {
                setActionPreset(event.target.value)
                setCustomActionInput("")
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            >
              {COMMON_ACTION_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>{preset.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Order / Batch / Record #</span>
            <input
              value={recordNumberInput}
              onChange={(event) => setRecordNumberInput(event.target.value)}
              placeholder="e.g. ORD-102, BATCH-AIR-01"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">From Date</span>
              <input
                type="date"
                value={startDateInput}
                onChange={(event) => setStartDateInput(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-2 py-2 text-xs outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">To Date</span>
              <input
                type="date"
                value={endDateInput}
                onChange={(event) => setEndDateInput(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-2 py-2 text-xs outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Clear Filters
          </button>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            Apply Filters
          </button>
        </div>
      </form>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span>{error}</span>
          <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="font-semibold underline underline-offset-2">Try again</button>
        </div>
      )}

      {/* Activity Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">Activity History</h2>
            <p className="mt-0.5 text-xs text-slate-500">Every change is audited in real-time. Entries cannot be edited or deleted.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{total.toLocaleString()} events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Event</th>
                <th scope="col" className="px-5 py-3 font-semibold">Performed by</th>
                <th scope="col" className="px-5 py-3 font-semibold">Record Affected</th>
                <th scope="col" className="px-5 py-3 font-semibold">What Changed</th>
                <th scope="col" className="px-5 py-3 font-semibold">Date &amp; Time</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">Loading activity…</td></tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">⌕</span>
                    <p className="font-semibold text-slate-800">No matching activity found</p>
                    <p className="mt-1 text-xs text-slate-500">Try adjusting your filters or date range.</p>
                  </td>
                </tr>
              ) : logs.map((log) => {
                const timestamp = formatTimestamp(log.createdAt)
                const hasChanges = Boolean(
                  (log.oldValues && Object.keys(log.oldValues).length > 0) ||
                  (log.newValues && Object.keys(log.newValues).length > 0)
                )

                // Pick top 2 keys to summarize inline
                const changeKeys = Array.from(new Set([
                  ...Object.keys(log.oldValues || {}),
                  ...Object.keys(log.newValues || {}),
                ])).slice(0, 2)

                return (
                  <tr key={log.id} className="transition hover:bg-slate-50/70">
                    {/* Event */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${actionStyle(log.action)}`}>
                        {formatAction(log.action)}
                      </span>
                    </td>

                    {/* Performed by */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900">
                          {actorInitials(log.actorName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800">{log.actorName || "Customer / System"}</p>
                          {log.actorUserId && (
                            <p className="truncate text-[10px] text-slate-500">ID: {log.actorUserId.slice(0, 8)}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Record Affected */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs font-semibold text-slate-900">
                          {log.recordNumber || log.targetId || "—"}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                          {log.targetResource}
                        </span>
                      </div>
                    </td>

                    {/* What Changed */}
                    <td className="max-w-[320px] px-5 py-4 text-xs">
                      {hasChanges ? (
                        <div className="space-y-1">
                          {changeKeys.map((key) => {
                            const oldVal = log.oldValues ? log.oldValues[key] : undefined
                            const newVal = log.newValues ? log.newValues[key] : undefined
                            return (
                              <div key={key} className="flex items-center gap-1.5 font-mono text-[11px]">
                                <span className="font-medium text-slate-600">{key}:</span>
                                {oldVal !== undefined && (
                                  <span className="rounded bg-rose-50 px-1 text-rose-700 line-through">
                                    {renderValue(oldVal)}
                                  </span>
                                )}
                                <span className="text-slate-400">→</span>
                                <span className="rounded bg-emerald-50 px-1 font-semibold text-emerald-800">
                                  {renderValue(newVal)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-500">
                          {typeof log.metadata?.method === "string" ? `${log.metadata.method} request` : "Action completed"}
                        </span>
                      )}
                    </td>

                    {/* Date & Time */}
                    <td className="whitespace-nowrap px-5 py-4 text-xs">
                      <p className="font-medium text-slate-800">{timestamp.date}</p>
                      <p className="mt-0.5 text-slate-500">{timestamp.time}</p>
                    </td>

                    {/* Details button */}
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setInspectLog(log)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
          <span>Showing {firstItem}–{lastItem} of {total.toLocaleString()} events</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="min-w-20 text-center text-xs">Page {page} of {pageCount}</span>
            <button
              type="button"
              disabled={loading || page >= pageCount}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Changes Modal */}
      {inspectLog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${actionStyle(inspectLog.action)}`}>
                  {formatAction(inspectLog.action)}
                </span>
                <h3 className="mt-2 text-lg font-bold text-slate-900">Event Details &amp; Change Diff</h3>
                <p className="text-xs text-slate-500">
                  Recorded on {formatTimestamp(inspectLog.createdAt).date} at {formatTimestamp(inspectLog.createdAt).time}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Event Metadata grid */}
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs sm:grid-cols-3">
                <div>
                  <span className="font-semibold text-slate-500">Actor</span>
                  <p className="font-bold text-slate-900">{inspectLog.actorName || "System / Guest"}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Actor User ID</span>
                  <p className="font-mono text-slate-900">{inspectLog.actorUserId || "N/A"}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Resource</span>
                  <p className="font-semibold text-slate-900">{inspectLog.targetResource}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Record / Identifier</span>
                  <p className="font-mono font-semibold text-slate-900">{inspectLog.recordNumber || inspectLog.targetId || "—"}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Internal Action</span>
                  <p className="font-mono text-[11px] text-slate-700">{inspectLog.action}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Timestamp</span>
                  <p className="text-slate-700">{new Date(inspectLog.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* What Changed Diff Section */}
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">What Changed (Old Value → New Value)</h4>
                {inspectLog.oldValues || inspectLog.newValues ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Field</th>
                          <th className="px-3 py-2 font-semibold">Previous Value (Old)</th>
                          <th className="px-3 py-2 font-semibold">Updated Value (New)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Array.from(new Set([
                          ...Object.keys(inspectLog.oldValues || {}),
                          ...Object.keys(inspectLog.newValues || {}),
                        ])).map((key) => {
                          const oldVal = inspectLog.oldValues ? inspectLog.oldValues[key] : undefined
                          const newVal = inspectLog.newValues ? inspectLog.newValues[key] : undefined
                          return (
                            <tr key={key} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-mono font-bold text-slate-800">{key}</td>
                              <td className="px-3 py-2 font-mono text-rose-800">
                                <span className="rounded bg-rose-50 px-1.5 py-0.5">
                                  {oldVal !== undefined ? JSON.stringify(oldVal, null, 2) : "—"}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-mono text-emerald-900">
                                <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold">
                                  {newVal !== undefined ? JSON.stringify(newVal, null, 2) : "—"}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                    No state changes were recorded for this action.
                  </p>
                )}
              </div>

              {/* Additional Context Metadata */}
              {inspectLog.metadata && Object.keys(inspectLog.metadata).length > 0 && (
                <div>
                  <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-700">Additional Context / Metadata</h4>
                  <pre className="max-h-40 overflow-y-auto rounded-xl bg-slate-900 p-3 font-mono text-xs text-slate-100">
                    {JSON.stringify(inspectLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
