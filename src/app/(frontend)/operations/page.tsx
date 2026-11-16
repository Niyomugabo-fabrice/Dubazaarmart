import Link from 'next/link'
import { getCustomerOrders, getShipmentDashboard } from '../actions'
import OperationsClient from './operations-client'

export const dynamic = 'force-dynamic'

export default async function OperationsPage() {
  try {
    const [orders, shipments] = await Promise.all([
      getCustomerOrders({ page: 1, limit: 10 }),
      getShipmentDashboard({ page: 1, limit: 10 }),
    ])
    return <OperationsClient initialOrders={orders} initialShipments={shipments} />
  } catch {
    return (
      <main className="min-h-screen bg-[#09090b] px-6 py-24 text-white">
        <div className="mx-auto max-w-lg rounded-3xl border border-[#2a2a30] bg-[#111114] p-10 text-center">
          <div className="badge mb-3 text-[#d4a843]">PROTECTED OPERATIONS</div>
          <h1 className="font-serif text-4xl">Administrator access required</h1>
          <p className="mt-4 text-sm leading-6 text-[#8b8b94]">
            Sign in through the secure Payload administration panel, then return to the operations
            console.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/admin" className="btn-gold rounded-xl px-5 py-3 text-sm">
              Sign in
            </Link>
            <Link href="/" className="btn-ghost rounded-xl px-5 py-3 text-sm">
              Back to store
            </Link>
          </div>
        </div>
      </main>
    )
  }
}
