"use client"

import { useEffect, useState } from "react"
import { fetchAuditLogs, type AuditLogRecord } from "../../lib/dashboardApi"

const PAGE_SIZE = 25

function formatAction(action: string): string {
  return action
    .split(/[._-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function actionStyle(action: string): string {
  const normalized = action.toLowerCase()
  if (normalized.includes("fail") || normalized.includes("delete") || normalized.includes("suspend")) {
    return "bg-rose-50 text-rose-700 ring-rose-200"
  }
  if (normalized.includes("create") || normalized.includes("activate") || normalized.includes("success")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200"
  }
  if (normalized.includes("update") || normalized.includes("verify") || normalized.includes("edit")) {
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

export default function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [actionInput, setActionInput] = useState("")
  const [resourceInput, setResourceInput] = useState("")
  const [filters, setFilters] = useState({ action: "", targetResource: "" })
  const [refreshKey, setRefreshKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchAuditLogs({
      page,
      pageSize: PAGE_SIZE,
      action: filters.action || undefined,
      targetResource: filters.targetResource || undefined,
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
        if (active) setError(loadError instanceof Error ? loadError.message : "Audit logs could not be loaded.")
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
    setFilters({ action: actionInput.trim(), targetResource: resourceInput.trim() })
  }

  function clearFilters() {
    setActionInput("")
    setResourceInput("")
    setFilters({ action: "", targetResource: "" })
    setPage(1)
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastItem = Math.min(page * PAGE_SIZE, total)
  const actors = new Set(logs.map((log) => log.actorName).filter(Boolean)).size
  const latest = logs.length ? formatTimestamp(logs[0].createdAt) : null

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="badge mb-2" style={{ color: "#FF6A00" }}>MANAGER ONLY</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Audit log</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            A clear record of sign-ins and administrative activity. Credentials and request bodies are never displayed here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <span aria-hidden="true">↻</span>
          Refresh
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recorded events</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{total.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">Matching the current filters</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actors on this page</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{actors}</p>
          <p className="mt-1 text-xs text-slate-500">Managers, staff, and system events</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest activity</p>
          <p className="mt-2 text-lg font-bold text-slate-950">{latest?.date ?? "No activity"}</p>
          <p className="mt-1 text-xs text-slate-500">{latest?.time || "New events will appear here"}</p>
        </article>
      </div>

      <form onSubmit={applyFilters} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Action</span>
          <input
            value={actionInput}
            onChange={(event) => setActionInput(event.target.value)}
            placeholder="e.g. login, update, delete"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Resource</span>
          <input
            value={resourceInput}
            onChange={(event) => setResourceInput(event.target.value)}
            placeholder="e.g. auth, products, staff"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          />
        </label>
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
          Apply filters
        </button>
        <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          Clear
        </button>
      </form>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span>{error}</span>
          <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="font-semibold underline underline-offset-2">Try again</button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">Activity history</h2>
            <p className="mt-0.5 text-xs text-slate-500">Newest events appear first.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{total.toLocaleString()} events</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Event</th>
                <th scope="col" className="px-5 py-3 font-semibold">Performed by</th>
                <th scope="col" className="px-5 py-3 font-semibold">Resource</th>
                <th scope="col" className="px-5 py-3 font-semibold">Target</th>
                <th scope="col" className="px-5 py-3 font-semibold">Date &amp; time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Loading activity…</td></tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">⌕</span>
                    <p className="font-semibold text-slate-800">No matching activity</p>
                    <p className="mt-1 text-xs text-slate-500">Try another action or resource filter.</p>
                  </td>
                </tr>
              ) : logs.map((log) => {
                const timestamp = formatTimestamp(log.createdAt)
                return (
                  <tr key={log.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${actionStyle(log.action)}`}>
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900">
                          {actorInitials(log.actorName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800">{log.actorName || "System / unknown"}</p>
                          {log.actorUserId && <p className="truncate text-[11px] text-slate-500">ID {log.actorUserId.slice(0, 8)}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {log.targetResource || "—"}
                      </span>
                    </td>
                    <td className="max-w-48 truncate px-5 py-4 font-mono text-xs text-slate-600" title={log.targetId ?? undefined}>
                      {log.targetId ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <p className="font-medium text-slate-800">{timestamp.date}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{timestamp.time}</p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
          <span>Showing {firstItem}–{lastItem} of {total.toLocaleString()}</span>
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
    </section>
  )
}
