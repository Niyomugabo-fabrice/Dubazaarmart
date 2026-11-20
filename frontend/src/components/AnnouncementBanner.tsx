"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { fetchActiveAnnouncements, type SiteAnnouncement } from "../lib/dashboardApi"

const ROTATION_INTERVAL_MS = 6000

function isExternalLink(link: string): boolean {
  return /^https?:\/\//i.test(link)
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<SiteAnnouncement[]>([])
  const [dismissed, setDismissed] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetchActiveAnnouncements()
      .then((items) => {
        if (items.length > 0) setAnnouncements(items)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (announcements.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((index) => (index + 1) % announcements.length)
    }, ROTATION_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [announcements.length])

  if (dismissed || announcements.length === 0) return null

  const hasMultiple = announcements.length > 1

  return (
    <div
      className="relative z-40 text-xs font-semibold text-white shadow-sm"
      style={{ background: "linear-gradient(90deg, #FF6A00 0%, #FFB000 100%)" }}
      role="region"
      aria-label="Store announcements"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2">
        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {announcements.map((announcement) => {
              const content = <span className="truncate font-bold">{announcement.title}</span>

              return (
                <div key={announcement.id} className="flex min-w-full items-center justify-center gap-2 text-center">
                  {announcement.link ? (
                    isExternalLink(announcement.link) ? (
                      <a
                        href={announcement.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-w-0 items-center justify-center gap-2 hover:opacity-90"
                      >
                        {content}
                      </a>
                    ) : (
                      <Link href={announcement.link} className="flex min-w-0 items-center justify-center gap-2 hover:opacity-90">
                        {content}
                      </Link>
                    )
                  ) : (
                    <div className="flex min-w-0 items-center justify-center gap-2">{content}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {hasMultiple && (
          <div className="flex flex-shrink-0 items-center gap-1.5" role="tablist" aria-label="Announcements">
            {announcements.map((announcement, index) => (
              <button
                key={announcement.id}
                type="button"
                role="tab"
                aria-selected={index === currentIndex}
                aria-label={`Show announcement ${index + 1} of ${announcements.length}`}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 text-sm font-bold text-white/80 hover:text-white"
          aria-label="Dismiss announcements"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
