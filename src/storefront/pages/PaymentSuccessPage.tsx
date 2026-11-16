interface Props {
  setPage: (p: string) => void
}

export default function PaymentSuccessPage({ setPage }: Props) {
  const orderId = `DBZ-${Date.now().toString().slice(-6)}`

  return (
    <div
      className="min-h-screen pt-20 flex items-center justify-center px-4"
      style={{ background: '#0A0A0B' }}
    >
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8"
          style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid #22c55e' }}
        >
          <svg
            width="40"
            height="40"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div className="badge mb-3" style={{ color: '#D4A843' }}>
          PAYMENT CONFIRMED
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Order Placed!</h1>
        <p className="mb-8 leading-relaxed" style={{ color: '#A0A0A8' }}>
          Your payment was authorized successfully via Mobile Money. Your order is now being
          processed.
        </p>

        <div
          className="p-5 rounded-2xl mb-8 text-left"
          style={{ background: '#111114', border: '1px solid #2A2A30' }}
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div style={{ color: '#555560' }}>Order ID</div>
              <div className="font-mono font-bold text-white">{orderId}</div>
            </div>
            <div>
              <div style={{ color: '#555560' }}>Status</div>
              <div className="font-semibold" style={{ color: '#22c55e' }}>
                ● Confirmed
              </div>
            </div>
            <div>
              <div style={{ color: '#555560' }}>Payment</div>
              <div className="font-semibold text-white">MTN Mobile Money</div>
            </div>
            <div>
              <div style={{ color: '#555560' }}>Est. Delivery</div>
              <div className="font-semibold text-white">2–4 Business Days</div>
            </div>
          </div>
        </div>

        {/* Tracking steps */}
        <div
          className="text-left mb-8 p-5 rounded-2xl"
          style={{ background: '#111114', border: '1px solid #2A2A30' }}
        >
          <h3 className="font-semibold text-white mb-4 text-sm">Order Progress</h3>
          {[
            { label: 'Order Confirmed', done: true, active: false },
            { label: 'Payment Verified', done: true, active: false },
            { label: 'Processing & Packing', done: false, active: true },
            { label: 'Shipped from Dubai', done: false, active: false },
            { label: 'Out for Delivery', done: false, active: false },
            { label: 'Delivered', done: false, active: false },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0`}
                style={{
                  background: s.done ? '#22c55e' : s.active ? 'rgba(212,168,67,0.2)' : '#1A1A1E',
                  border: s.active ? '1px solid #D4A843' : 'none',
                }}
              >
                {s.done ? (
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    stroke="#000"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : s.active ? (
                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                ) : null}
              </div>
              <span
                className="text-sm"
                style={{ color: s.done ? '#22c55e' : s.active ? '#D4A843' : '#555560' }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setPage('account')}
            className="flex-1 py-3 rounded-xl font-semibold btn-ghost"
          >
            Track Order
          </button>
          <button
            onClick={() => setPage('shop')}
            className="flex-1 py-3 rounded-xl font-bold btn-gold"
          >
            Shop More →
          </button>
        </div>
      </div>
    </div>
  )
}
