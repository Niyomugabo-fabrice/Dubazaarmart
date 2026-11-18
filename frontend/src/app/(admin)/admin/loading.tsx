export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white" role="status" aria-live="polite">
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#FFB800] border-t-transparent" />
      <span className="sr-only">Loading admin workspace</span>
    </div>
  )
}
