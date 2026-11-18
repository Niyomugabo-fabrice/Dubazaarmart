"use client"

import ProductCard from "../components/ProductCard"
import { useAppNavigation } from "../lib/navigation"
import { useCart } from "../store/cartStore"
import { useProducts } from "../store/productsStore"

export default function WishlistPage() {
  const { navigate } = useAppNavigation()
  const { products } = useProducts()
  const { wishlist } = useCart()
  const wishlistProducts = products.filter((product) => wishlist.includes(product.id))

  return (
    <main className="min-h-screen bg-white pb-16 pt-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="badge mb-2" style={{ color: "#FF6A00" }}>SAVED ITEMS</div>
        <h1 className="mb-8 text-3xl font-bold text-[#111111]">Your wishlist</h1>
        {wishlistProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {wishlistProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#FFB800] bg-[#FFF7E8] py-16 text-center">
            <div className="mb-4 text-5xl" aria-hidden="true">♡</div>
            <p className="text-lg font-medium text-[#111111]">Your wishlist is empty.</p>
            <button onClick={() => navigate("shop")} className="btn-gold mt-4 rounded-xl px-6 py-2.5 font-semibold">
              Browse products
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
