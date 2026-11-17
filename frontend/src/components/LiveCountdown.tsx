import { useState, useEffect } from 'react'

interface Props {
  targetDate: string | Date | null | undefined
  isCompleted?: boolean
  completedText?: string
  variant?: 'customer' | 'company'
}

export default function LiveCountdown({
  targetDate,
  isCompleted = false,
  completedText = 'Delivered',
  variant = 'customer',
}: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!targetDate) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
        <span>⏰</span> Standard 24–48h Dispatch
      </span>
    )
  }

  const targetTime = new Date(targetDate).getTime()
  if (isNaN(targetTime)) {
    return null
  }

  const diff = targetTime - now

  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
        <span className="text-emerald-600 font-black">✓</span> {completedText}
      </span>
    )
  }

  if (diff <= 0) {
    const overdueMs = Math.abs(diff)
    const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24))
    const overdueHours = Math.floor((overdueMs / (1000 * 60 * 60)) % 24)
    const overdueMins = Math.floor((overdueMs / 1000 / 60) % 60)

    const overdueLabel = overdueDays > 0
      ? `${overdueDays}d ${overdueHours}h`
      : overdueHours > 0
        ? `${overdueHours}h ${overdueMins}m`
        : `${overdueMins}m`

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-600 text-white shadow-md animate-pulse">
        <span>⚠️</span> OVERDUE ({overdueLabel})
      </span>
    )
  }

  const totalSecs = Math.floor(diff / 1000)
  const days = Math.floor(totalSecs / (3600 * 24))
  const hours = Math.floor((totalSecs % (3600 * 24)) / 3600)
  const mins = Math.floor((totalSecs % 3600) / 60)
  const secs = totalSecs % 60

  const pad = (n: number) => n.toString().padStart(2, '0')

  const isUrgent = diff < 1000 * 60 * 60 * 4 // Less than 4 hours

  const themeClasses = isUrgent
    ? 'bg-orange-100 text-orange-900 border-orange-400 ring-2 ring-orange-400/40'
    : variant === 'company'
      ? 'bg-blue-100 text-blue-900 border-blue-400 shadow-xs'
      : 'bg-amber-100 text-amber-950 border-amber-400 shadow-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-black border transition-all ${themeClasses}`}
      title={`Live countdown to ${new Date(targetDate).toLocaleString('en-RW')}`}
    >
      <span className="animate-spin text-sm" style={{ animationDuration: '4s' }}>⏳</span>
      <span>
        {days > 0 && <span className="font-bold">{days}d </span>}
        <span>{pad(hours)}h : </span>
        <span>{pad(mins)}m : </span>
        <span className="text-[#FF6A00] font-black">{pad(secs)}s</span>
      </span>
      <span className="text-[10px] uppercase font-sans font-bold text-gray-600 ml-0.5">left</span>
    </span>
  )
}
