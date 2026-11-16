import { categories } from '../data/products'

interface Props {
  setPage: (p: string) => void
}

export default function CategoriesPage({ setPage }: Props) {
  return (
    <div className="min-h-screen pt-20 pb-16" style={{ background: '#0A0A0B' }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="badge mb-2 pt-8" style={{ color: '#D4A843' }}>
          BROWSE
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">All Categories</h1>
        <p className="mb-10" style={{ color: '#A0A0A8' }}>
          Browse our full range of electronics sourced from Dubai
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setPage('shop')}
              className="card-hover flex flex-col items-center gap-4 p-6 rounded-2xl text-center"
              style={{ background: '#111114', border: '1px solid #2A2A30' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{
                  background: 'rgba(212,168,67,0.08)',
                  border: '1px solid rgba(212,168,67,0.15)',
                }}
              >
                {cat.icon}
              </div>
              <div>
                <div className="font-semibold text-white text-sm mb-1">{cat.name}</div>
                <div className="badge" style={{ color: '#D4A843' }}>
                  {cat.count} products
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
