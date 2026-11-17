import { useEffect, useState } from 'react'
import { fetchActiveAnnouncements, type SiteAnnouncement } from '../lib/dashboardApi'

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<SiteAnnouncement[]>([])
  const [dismissed, setDismissed] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetchActiveAnnouncements()
      .then(items => {
        if (items.length > 0) setAnnouncements(items)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (announcements.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex(i => (i + 1) % announcements.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [announcements.length])

  if (dismissed || announcements.length === 0) return null

  const activeAnn = announcements[currentIndex]

  return (
    <div
      className="relative z-40 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all"
      style={{
        background: 'linear-gradient(90deg, #FF6A00 0%, #FFB800 50%, #0B5B24 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center justify-center gap-2 text-center truncate">
          <span className="px-2 py-0.5 rounded bg-black/20 uppercase tracking-wider text-[10px] font-black">
            {activeAnn.tag || 'Announcement'}
          </span>
          <span className="font-bold">{activeAnn.title}:</span>
          <span className="font-normal truncate">{activeAnn.message}</span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 text-white/80 hover:text-white flex-shrink-0 text-sm font-bold"
          aria-label="Dismiss banner"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
