import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4 text-center" style={{ background: '#FFFFFF' }}>
      <div>
        <div className="badge mb-2" style={{ color: '#FF6A00' }}>NOT FOUND</div>
        <h1 className="text-3xl font-bold text-[#111111] mb-3">We could not find that page</h1>
        <p className="text-sm mb-6" style={{ color: '#0B5B24' }}>The link may be out of date, or the page may have moved.</p>
        <Link href="/shop" className="inline-block rounded-xl px-6 py-3 font-bold btn-gold">Browse Products</Link>
      </div>
    </main>
  )
}
