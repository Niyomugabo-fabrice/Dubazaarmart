'use client'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 text-center" style={{ background: '#FFFFFF' }}>
      <div>
        <h1 className="text-2xl font-bold text-[#111111] mb-3">Something went wrong</h1>
        <p className="text-sm mb-6" style={{ color: '#0B5B24' }}>The page could not be loaded. Please try again.</p>
        <button onClick={reset} className="rounded-xl px-6 py-3 font-bold btn-gold">Try again</button>
      </div>
    </main>
  )
}
