"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useCart } from "../store/cartStore"

interface StoredOrderSummary {
  orderNumber?: string
  total?: number
  createdAt?: string
  status?: string
}

export default function AccountPage() {
  const { cartItems, wishlist, count } = useCart()
  const [recentOrder, setRecentOrder] = useState<StoredOrderSummary | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("dubazaar_last_receipt")
      if (raw) {
        setRecentOrder(JSON.parse(raw))
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF6A00]">
            Customer Hub
          </span>
          <h1 className="mt-1 text-3xl font-extrabold text-[#0A1F44]">My Account</h1>
          <p className="mt-1 text-sm text-[#475569]">
            Manage your shopping cart, saved wishlist items, and recent order activity.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <Link
            href="/cart"
            className="rounded-2xl border border-[#E2E8F0] bg-white p-6 transition-colors hover:border-[#FF6A00]"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-[#FF6A00]">Cart</div>
            <div className="mt-2 text-2xl font-extrabold text-[#0A1F44]">{count}</div>
            <p className="mt-1 text-sm text-[#475569]">
              {cartItems.length} product{cartItems.length === 1 ? "" : "s"} ready for checkout
            </p>
          </Link>

          <Link
            href="/wishlist"
            className="rounded-2xl border border-[#E2E8F0] bg-white p-6 transition-colors hover:border-[#FF6A00]"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-[#FF6A00]">Wishlist</div>
            <div className="mt-2 text-2xl font-extrabold text-[#0A1F44]">{wishlist.length}</div>
            <p className="mt-1 text-sm text-[#475569]">Saved favorite products</p>
          </Link>

          <Link
            href="/shop"
            className="rounded-2xl border border-[#E2E8F0] bg-white p-6 transition-colors hover:border-[#FF6A00]"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-[#FF6A00]">
              Retail Shop
            </div>
            <div className="mt-2 text-lg font-extrabold text-[#0A1F44]">Browse Catalog →</div>
            <p className="mt-1 text-sm text-[#475569]">Shop electronics &amp; ready stock</p>
          </Link>
        </div>

        {recentOrder && (
          <div className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-6">
            <h2 className="text-lg font-bold text-[#0A1F44]">Most Recent Order</h2>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4 text-sm text-[#475569]">
              <div>
                <span className="font-semibold text-[#0A1F44]">Order:</span>{" "}
                {recentOrder.orderNumber || "Submitted"}
              </div>
              {typeof recentOrder.total === "number" && (
                <div>
                  <span className="font-semibold text-[#0A1F44]">Total:</span> RWF{" "}
                  {recentOrder.total.toLocaleString()}
                </div>
              )}
              <Link
                href="/checkout/success"
                className="font-bold text-[#FF6A00] hover:underline"
              >
                View Receipt →
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/sourcing"
            className="rounded-full bg-[#FF6A00] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#E55A00]"
          >
            Request Sourcing
          </Link>
          <Link
            href="/shipping"
            className="rounded-full border border-[#0A1F44] bg-white px-6 py-2.5 text-sm font-bold text-[#0A1F44] hover:bg-[#0A1F44] hover:text-white"
          >
            Shipping Quote
          </Link>
          <Link
            href="/contact?topic=tracking"
            className="rounded-full border border-[#E2E8F0] bg-white px-6 py-2.5 text-sm font-bold text-[#0A1F44] hover:border-[#FF6A00]"
          >
            Track an Order
          </Link>
        </div>
      </div>
    </div>
  )
}
