import { cartStore, useCart } from '../store/cartStore'

interface Props {
  setPage: (p: string) => void
}

export default function CartPage({ setPage }: Props) {
  const { cartItems, subtotal, delivery, total } = useCart()

  function formatPrice(n: number) {
    return `RWF ${n.toLocaleString()}`
  }

  if (cartItems.length === 0) {
    return (
      <div
        className="min-h-screen pt-20 flex items-center justify-center"
        style={{ background: '#0A0A0B' }}
      >
        <div className="text-center">
          <div className="text-7xl mb-6">🛒</div>
          <h2 className="text-2xl font-bold text-white mb-3">Your cart is empty</h2>
          <p className="mb-8" style={{ color: '#555560' }}>
            Discover amazing electronics from Dubai
          </p>
          <button
            onClick={() => setPage('shop')}
            className="btn-gold px-8 py-3 rounded-xl font-bold"
          >
            Start Shopping →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ background: '#0A0A0B' }}>
      <div className="max-w-5xl mx-auto px-4 lg:px-8">
        <div className="badge mb-2 pt-6" style={{ color: '#D4A843' }}>
          CART
        </div>
        <h1 className="text-3xl font-bold text-white mb-8">Your Cart ({cartItems.length} items)</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-4 p-4 rounded-2xl"
                style={{ background: '#111114', border: '1px solid #2A2A30' }}
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 product-img-wrap">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="badge mb-1" style={{ color: '#D4A843' }}>
                    {item.product.brand}
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2">
                    {item.product.name}
                  </h3>
                  <div className="text-sm font-bold" style={{ color: '#D4A843' }}>
                    {formatPrice(item.product.price)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <button
                    onClick={() => cartStore.remove(item.product.id)}
                    className="text-xs"
                    style={{ color: '#555560' }}
                  >
                    ✕ Remove
                  </button>
                  <div
                    className="flex items-center rounded-lg overflow-hidden"
                    style={{ border: '1px solid #2A2A30' }}
                  >
                    <button
                      onClick={() => cartStore.updateQty(item.product.id, item.quantity - 1)}
                      className="px-3 py-1.5 text-white hover:bg-white/5 text-sm"
                    >
                      −
                    </button>
                    <span className="px-3 font-mono text-white text-sm">{item.quantity}</span>
                    <button
                      onClick={() => cartStore.updateQty(item.product.id, item.quantity + 1)}
                      className="px-3 py-1.5 text-white hover:bg-white/5 text-sm"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {formatPrice(item.product.price * item.quantity)}
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => cartStore.clear()}
              className="text-sm"
              style={{ color: '#555560' }}
            >
              Clear cart
            </button>
          </div>

          {/* Summary */}
          <div
            className="p-6 rounded-2xl h-fit sticky top-24"
            style={{ background: '#111114', border: '1px solid #2A2A30' }}
          >
            <h2 className="font-bold text-white mb-6">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#A0A0A8' }}>Subtotal</span>
                <span className="text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#A0A0A8' }}>Delivery</span>
                <span className="text-white">{formatPrice(delivery)}</span>
              </div>
              <div className="section-divider" />
              <div className="flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span style={{ color: '#D4A843' }}>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Promo */}
            <div className="flex gap-2 mb-6">
              <input placeholder="Promo code" className="flex-1 px-3 py-2 rounded-lg text-sm" />
              <button className="px-4 py-2 rounded-lg text-sm btn-ghost">Apply</button>
            </div>

            <button
              onClick={() => setPage('checkout')}
              className="w-full py-4 rounded-xl font-bold btn-gold text-base"
            >
              Checkout →
            </button>
            <button
              onClick={() => setPage('shop')}
              className="w-full py-3 rounded-xl font-medium text-sm mt-3 text-center block"
              style={{ color: '#555560' }}
            >
              Continue Shopping
            </button>

            <div
              className="flex items-center justify-center gap-2 mt-4 text-xs"
              style={{ color: '#555560' }}
            >
              <span>🔒</span> Secured by MTN MoMo & Airtel Money
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
