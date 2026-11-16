interface Props {
  setPage: (p: string) => void
}

export default function AboutPage({ setPage }: Props) {
  return (
    <div className="min-h-screen pt-20 pb-16" style={{ background: '#0A0A0B' }}>
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <div className="badge mb-2 pt-8" style={{ color: '#D4A843' }}>
          OUR STORY
        </div>
        <h1 className="text-4xl font-bold text-white mb-6">About Dubazaarmart</h1>

        <div className="rounded-3xl overflow-hidden mb-10" style={{ height: '300px' }}>
          <img
            src="https://images.unsplash.com/photo-1426024084828-5da21e13f5dc?w=1200&h=600&fit=crop&auto=format"
            alt="Electronics store"
            className="w-full h-full object-cover opacity-70"
          />
        </div>

        <div className="prose max-w-none space-y-6 mb-12">
          <p className="text-lg leading-relaxed" style={{ color: '#A0A0A8' }}>
            Dubazaarmart.com was founded with a simple mission: to make premium electronics
            accessible to everyone in Rwanda at fair prices. We source our products directly from
            trusted wholesalers in Dubai — one of the world's biggest electronics trading hubs —
            eliminating unnecessary middlemen.
          </p>
          <p className="leading-relaxed" style={{ color: '#A0A0A8' }}>
            Every product we sell is carefully verified for authenticity. We work only with
            authorized distributors and provide official manufacturer warranties on all items. When
            you shop with us, you're guaranteed to receive the real thing.
          </p>
          <p className="leading-relaxed" style={{ color: '#A0A0A8' }}>
            Payment is fast and familiar — we support MTN Mobile Money and Airtel Money, Rwanda's
            most trusted payment platforms. Your PIN never leaves your phone.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: '🇦🇪',
              title: 'Dubai Sourced',
              desc: 'Direct from UAE wholesalers at wholesale prices',
            },
            { icon: '🇷🇼', title: 'Rwanda Delivered', desc: 'Nationwide delivery to all provinces' },
            { icon: '✅', title: '100% Authentic', desc: 'Every product verified and warranted' },
          ].map((item) => (
            <div
              key={item.title}
              className="p-6 rounded-2xl text-center"
              style={{ background: '#111114', border: '1px solid #2A2A30' }}
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className="font-bold text-white mb-2">{item.title}</div>
              <div className="text-sm" style={{ color: '#555560' }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => setPage('shop')}
            className="btn-gold px-8 py-4 rounded-xl font-bold text-base"
          >
            Start Shopping →
          </button>
        </div>
      </div>
    </div>
  )
}
