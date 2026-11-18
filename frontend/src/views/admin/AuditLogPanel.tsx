"use client"

import { useEffect, useState } from "react"
import { fetchAuditLogs, type AuditLogRecord } from "../../lib/dashboardApi"

export default function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchAuditLogs()
      .then((items) => {
        if (active) setLogs(items)
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
  }, [])

  return (
    <section>
      <header className="mb-6">
        <div className="badge mb-2" style={{ color: "#FF6A00" }}>MANAGER ONLY</div>
        <h1 className="text-2xl font-bold text-[#111111]">Audit log</h1>
        <p className="mt-1 text-sm text-slate-600">Recent sign-in attempts and administrative changes. Request bodies and credentials are never recorded.</p>
      </header>
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {loading ? <p className="rounded-xl bg-white p-5 text-sm text-slate-500">Loading audit log…</p> : (
        <div className="overflow-x-auto rounded-2xl border border-[#FFB800] bg-white">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-[#FFF7E8] text-xs uppercase text-slate-600">
              <tr><th className="p-3">Time</th><th className="p-3">Actor</th><th className="p-3">Action</th><th className="p-3">Resource</th><th className="p-3">Target</th></tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100">
                  <td className="whitespace-nowrap p-3">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-3">{log.actorName || "System/unknown"}</td>
                  <td className="p-3 font-medium">{log.action}</td>
                  <td className="p-3">{log.targetResource}</td>
                  <td className="p-3">{log.targetId || "—"}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">No audit entries recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
