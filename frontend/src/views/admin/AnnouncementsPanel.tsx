"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useState } from "react"
import {
  deleteAdminAnnouncement,
  fetchAdminAnnouncements,
  updateAdminAnnouncement,
  type SiteAnnouncement,
} from "../../lib/dashboardApi"
import { useAdminAuth } from "../../store/adminAuthStore"
import { useToast } from "../../components/ui/Toast"

const AnnouncementsModal = dynamic(() => import("../../components/AnnouncementsModal"))
const ConfirmModal = dynamic(() => import("../../components/ConfirmModal"))

function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-RW", { dateStyle: "medium" })
}

function formatSchedule(announcement: SiteAnnouncement): string | null {
  if (!announcement.startDate && !announcement.endDate) return null
  const start = announcement.startDate ? formatDate(announcement.startDate) : "Anytime"
  const end = announcement.endDate ? formatDate(announcement.endDate) : "No end"
  return `${start} → ${end}`
}

function previewMessage(message: string, maxLength = 90): string {
  const compact = message.replace(/\s+/g, " ").trim()
  return compact.length > maxLength ? `${compact.slice(0, maxLength).trimEnd()}…` : compact
}

export default function AnnouncementsPanel({ embedded = false }: { embedded?: boolean }) {
  const { admin } = useAdminAuth()
  const toast = useToast()
  const canManage = admin?.role === "MANAGER" || admin?.role === "STAFF"

  const [announcements, setAnnouncements] = useState<SiteAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [announcementToEdit, setAnnouncementToEdit] = useState<SiteAnnouncement | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SiteAnnouncement | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadAnnouncements = useCallback(async () => {
    setLoading(true)
    try {
      const items = await fetchAdminAnnouncements()
      setAnnouncements(items)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Announcements could not be loaded.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAnnouncements()
  }, [loadAnnouncements])

  function openCreate() {
    setAnnouncementToEdit(null)
    setIsModalOpen(true)
  }

  function openEdit(announcement: SiteAnnouncement) {
    setAnnouncementToEdit(announcement)
    setIsModalOpen(true)
  }

  async function handleToggle(announcement: SiteAnnouncement) {
    if (!canManage || togglingId) return
    const nextState = !announcement.isActive
    setTogglingId(announcement.id)
    setAnnouncements((current) =>
      current.map((item) => (item.id === announcement.id ? { ...item, isActive: nextState } : item)),
    )
    try {
      const saved = await updateAdminAnnouncement(announcement.id, { isActive: nextState })
      setAnnouncements((current) => current.map((item) => (item.id === saved.id ? saved : item)))
    } catch (toggleError) {
      setAnnouncements((current) =>
        current.map((item) => (item.id === announcement.id ? announcement : item)),
      )
      toast.error(
        toggleError instanceof Error ? toggleError.message : "The announcement status could not be changed.",
        "Update Failed",
      )
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteAdminAnnouncement(deleteTarget.id)
      setAnnouncements((current) => current.filter((item) => item.id !== deleteTarget.id))
      toast.success(`Announcement "${deleteTarget.title}" deleted.`)
      setDeleteTarget(null)
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : "The announcement could not be deleted.",
        "Delete Failed",
      )
      throw deleteError
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#111111]">
            {embedded ? "Store announcements" : "All announcements"}
          </h2>
          <p className="text-xs text-[#0B5B24]">
            Active announcements rotate at the top of the customer store.
          </p>
        </div>
        {canManage && (
          <button type="button" onClick={openCreate} className="btn-gold px-4 py-2 rounded-xl text-xs font-bold shadow-sm">
            + New Announcement
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "#FFB800", background: "#FFFFFF" }}>
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr
              className="border-b text-left text-[11px] font-bold uppercase tracking-wider"
              style={{ background: "#FFF7E8", borderColor: "#FFB800", color: "#0B5B24" }}
            >
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Message</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-xs text-[#0B5B24]">
                  Loading announcements…
                </td>
              </tr>
            )}
            {!loading &&
              announcements.map((announcement) => {
                const schedule = formatSchedule(announcement)
                return (
                  <tr
                    key={announcement.id}
                    className="border-t align-top transition-colors hover:bg-[#FFF7E8]/40"
                    style={{ borderColor: "rgba(255,184,0,0.25)" }}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#111111]">{announcement.title}</div>
                      {schedule && <div className="mt-0.5 text-[11px] text-[#0B5B24]">{schedule}</div>}
                    </td>
                    <td className="max-w-xs py-3 px-4 text-xs text-[#0B5B24]" title={announcement.message}>
                      <span className="block truncate">{previewMessage(announcement.message)}</span>
                      {announcement.link && (
                        <span className="mt-0.5 block truncate text-[11px] text-[#FF6A00]">{announcement.link}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {canManage ? (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={announcement.isActive}
                            aria-label={`Toggle ${announcement.title} ${announcement.isActive ? "off" : "on"}`}
                            onClick={() => handleToggle(announcement)}
                            disabled={togglingId === announcement.id}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
                              announcement.isActive ? "bg-green-600" : "bg-slate-300"
                            } disabled:cursor-wait disabled:opacity-60`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                announcement.isActive ? "translate-x-4" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        ) : (
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${announcement.isActive ? "bg-green-600" : "bg-slate-400"}`}
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            announcement.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {announcement.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#0B5B24]">{formatDate(announcement.createdAt)}</td>
                    <td className="py-3 px-4">
                      {canManage ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(announcement)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 border border-slate-300 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(announcement)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#FF6A00] border border-[#FF6A00]/40 hover:bg-[#FF6A00]/10"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <div className="text-right text-[11px] text-[#0B5B24]">View only</div>
                      )}
                    </td>
                  </tr>
                )
              })}
            {!loading && announcements.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-xs text-[#0B5B24]">
                  No announcements yet. {canManage ? "Create one to show a banner on the storefront." : ""}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnnouncementsModal
        isOpen={isModalOpen}
        announcement={announcementToEdit}
        onClose={() => {
          setIsModalOpen(false)
          setAnnouncementToEdit(null)
        }}
        onAnnouncementSaved={(saved, isUpdate) => {
          setAnnouncements((current) =>
            isUpdate ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current],
          )
          toast.success(
            isUpdate ? `Announcement "${saved.title}" updated.` : `Announcement "${saved.title}" created.`,
          )
        }}
      />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete Announcement"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? It will immediately stop showing to customers.`
            : "Delete this announcement?"
        }
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
