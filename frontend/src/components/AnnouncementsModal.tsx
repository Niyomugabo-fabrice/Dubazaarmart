"use client"

import { useEffect, useState } from "react"
import {
  createAdminAnnouncement,
  updateAdminAnnouncement,
  type SiteAnnouncement,
} from "../lib/dashboardApi"

interface Props {
  isOpen: boolean
  announcement?: SiteAnnouncement | null
  onClose: () => void
  onAnnouncementSaved: (announcement: SiteAnnouncement, isUpdate: boolean) => void
}

function toDateInputValue(value?: string): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function toDateTime(value: string, endOfDay = false): string | null {
  if (!value) return null
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export default function AnnouncementsModal({ isOpen, announcement, onClose, onAnnouncementSaved }: Props) {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [tag, setTag] = useState("Flash Friday")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = Boolean(announcement)

  useEffect(() => {
    if (!isOpen) return
    setTitle(announcement?.title ?? "")
    setMessage(announcement?.message ?? "")
    setTag(announcement?.tag ?? "Flash Friday")
    setStartDate(toDateInputValue(announcement?.startDate))
    setEndDate(toDateInputValue(announcement?.endDate))
    setActive(announcement?.active ?? true)
    setError(null)
  }, [announcement, isOpen])

  if (!isOpen) return null

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.")
      return
    }
    if (startDate && endDate && startDate > endDate) {
      setError("The end date must be on or after the start date.")
      return
    }

    try {
      setLoading(true)
      setError(null)
      const payload = {
        title: title.trim(),
        message: message.trim(),
        tag: tag.trim() || "Announcement",
        startDate: toDateTime(startDate),
        endDate: toDateTime(endDate, true),
        active,
      }
      const saved = announcement
        ? await updateAdminAnnouncement(announcement.id, payload)
        : await createAdminAnnouncement({
            ...payload,
            startDate: payload.startDate ?? undefined,
            endDate: payload.endDate ?? undefined,
          })
      onAnnouncementSaved(saved, Boolean(announcement))
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The announcement could not be saved.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg text-amber-800" aria-hidden="true">
              {isEditing ? "✎" : "📢"}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Store communications</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {isEditing ? "Edit announcement" : "New announcement"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close announcement editor"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="announcement-tag" className="mb-1.5 block text-sm font-semibold text-slate-700">Tag / category</label>
            <input
              id="announcement-tag"
              required
              maxLength={40}
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              placeholder="Flash Friday, Special Offer, Holiday Notice"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div>
            <label htmlFor="announcement-title" className="mb-1.5 block text-sm font-semibold text-slate-700">Title</label>
            <input
              id="announcement-title"
              required
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Write a concise announcement title"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div>
            <label htmlFor="announcement-message" className="mb-1.5 block text-sm font-semibold text-slate-700">Message</label>
            <textarea
              id="announcement-message"
              required
              maxLength={1000}
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Share the details customers need to know."
              className="w-full resize-y rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="announcement-start-date" className="mb-1.5 block text-sm font-semibold text-slate-700">Start date</label>
              <input
                id="announcement-start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label htmlFor="announcement-end-date" className="mb-1.5 block text-sm font-semibold text-slate-700">End date</label>
              <input
                id="announcement-end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-amber-600"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">Visible in the storefront</span>
              <span className="block text-xs text-slate-500">Hidden announcements remain saved and can be re-enabled later.</span>
            </span>
          </label>

          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Saving…" : isEditing ? "Save changes" : "Publish announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
