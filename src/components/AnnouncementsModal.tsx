import { useState } from 'react'
import { createAdminAnnouncement, type SiteAnnouncement } from '../lib/dashboardApi'

interface Props {
  isOpen: boolean
  onClose: () => void
  onAnnouncementCreated: (ann: SiteAnnouncement) => void
}

export default function AnnouncementsModal({ isOpen, onClose, onAnnouncementCreated }: Props) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [tag, setTag] = useState('Flash Friday')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const ann = await createAdminAnnouncement({
        title: title.trim(),
        message: message.trim(),
        tag: tag.trim() || 'Announcement',
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      })
      onAnnouncementCreated(ann)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish announcement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border-2 border-[#FFB800]">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-[#FF6A00] font-bold">
              📢
            </span>
            <h3 className="font-bold text-gray-900">New Website Announcement</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 font-bold text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tag / Category *</label>
            <input
              required
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. Flash Friday, Special Offer, Holiday Notice"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Title *</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. ⚡ Flash Friday Dubai Deals"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Message *</label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Get up to 25% off authentic electronics direct from Dubai wholesalers! Free nationwide delivery on orders over RWF 500,000."
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Start Date (Optional)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold btn-gold shadow-sm"
            >
              {loading ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
