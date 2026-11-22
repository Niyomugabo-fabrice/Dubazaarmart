import Image from 'next/image'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-6 pb-16" style={{ background: '#FFFFFF' }}>
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <div className="badge mb-2 pt-8" style={{ color: '#FF6A00' }}>OUR STORY</div>
        <h1 className="text-4xl font-bold text-[#111111] mb-6">About Dubazaarmart</h1>

        <div className="rounded-3xl overflow-hidden mb-10" style={{ height: '300px' }}>
          <Image
            src="https://images.unsplash.com/photo-1426024084828-5da21e13f5dc?w=1200&h=600&fit=crop&auto=format"
            alt="Electronics store"
            width={1200}
            height={600}
            sizes="(min-width: 896px) 896px, 100vw"
            unoptimized
            className="h-full w-full object-cover opacity-70"
          />
        </div>

        <div className="prose max-w-none space-y-6 mb-12">
          <p className="text-lg leading-relaxed" style={{ color: '#111111' }}>
            DubazaarMart helps customers in Rwanda shop smarter by offering quality electronics and other products, plus dependable shipping services from China and Dubai. We source, buy, and ship products to make international shopping simpler and more accessible.
          </p>
          <p className="leading-relaxed" style={{ color: '#111111' }}>
            Customers can buy items listed on our website, ask us to find and purchase a product from China or Dubai, or use our shipping-only service for products they have already bought. Every option is handled with clear communication from purchase or collection through delivery.
          </p>
          <p className="leading-relaxed" style={{ color: '#111111' }}>
            Shipping from China and Dubai is one of our main services. We coordinate trusted suppliers and shipping partners, then arrange delivery to the customer&apos;s location in Rwanda. Payment is available by familiar local methods, including MTN Mobile Money and Airtel Money.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { icon: '🇦🇪', title: 'China & Dubai Shipping', desc: 'Main international shipping service for products and customer purchases' },
            { icon: '🔎', title: 'Product Sourcing', desc: 'We find and buy requested products from China or Dubai' },
            { icon: '🇷🇼', title: 'Rwanda Delivered', desc: 'Nationwide delivery to all provinces' },
          ].map(item => (
            <div key={item.title} className="p-6 rounded-2xl text-center" style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}>
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className="font-bold text-[#111111] mb-2">{item.title}</div>
              <div className="text-sm" style={{ color: '#0B5B24' }}>{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/shop" className="btn-gold px-8 py-4 rounded-xl font-bold text-base inline-block">
            Start Shopping →
          </Link>
        </div>
      </div>
    </div>
  )
}
