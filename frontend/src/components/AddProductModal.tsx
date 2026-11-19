import { useEffect, useState } from 'react'
import type { Product } from '../data/products'
import { categories } from '../data/products'
import ImageUploader from './ImageUploader'
import { addProductToBackend } from '../store/productsStore'

interface Props {
  isOpen: boolean
  onClose: () => void
  onProductAdded: (newProd: Product) => void
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=600&fit=crop&auto=format'

export default function AddProductModal({ isOpen, onClose, onProductAdded }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('smartphones')
  const [brand, setBrand] = useState('Samsung')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [quantity, setQuantity] = useState('15')
  const [sku, setSku] = useState('')
  const [badge, setBadge] = useState('New Arrival')
  const [image, setImage] = useState('')
  const [description, setDescription] = useState('')
  const [featured, setFeatured] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploaderKey, setUploaderKey] = useState(0)

  useEffect(() => {
    if (!isOpen) return
    setName('')
    setCategory('smartphones')
    setBrand('Samsung')
    setPrice('')
    setOriginalPrice('')
    setQuantity('15')
    setSku('')
    setBadge('New Arrival')
    setImage('')
    setDescription('')
    setFeatured(true)
    setError(null)
    setUploaderKey((key) => key + 1)
  }, [isOpen])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const numPrice = Number(price.replace(/,/g, ''))
    const numOrig = originalPrice ? Number(originalPrice.replace(/,/g, '')) : numPrice
    const numQty = Number(quantity)

    if (!name.trim()) {
      setError('Please provide a product name.')
      return
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please provide a valid price in RWF.')
      return
    }

    setSubmitting(true)

    const generatedSku = sku.trim() || `DUB-${category.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

    const payload: Partial<Product> = {
      name: name.trim(),
      category,
      brand: brand.trim() || 'Dubai Sourced',
      price: numPrice,
      originalPrice: numOrig >= numPrice ? numOrig : numPrice,
      quantity: isNaN(numQty) || numQty < 0 ? 10 : numQty,
      sku: generatedSku,
      badge: badge === 'None' ? undefined : badge,
      image: image.trim() || DEFAULT_IMAGE,
      images: [image.trim() || DEFAULT_IMAGE],
      description: description.trim() || `${name.trim()} - authentic Dubai-sourced product with full warranty.`,
      featured,
      active: true,
      condition: 'New',
      warranty: '1 year official warranty',
      rating: 5.0,
      reviews: 1,
    }

    try {
      // Use the productsStore helper so the global store notifies all listeners immediately
      const newProduct = await addProductToBackend(payload)
      if (!newProduct) throw new Error('Failed to save product')

      onProductAdded(newProduct)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding product')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div
        className="max-h-[calc(100dvh_-_2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-3xl p-6 shadow-2xl animate-scaleUp sm:p-8"
        style={{ background: '#FFFFFF', border: '1px solid #FFB800' }}
      >
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: '#F1FFF0' }}>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#FF6A00]">
              CATALOG MANAGEMENT
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#111111] mt-0.5">
              Add New Product
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-black/60 hover:text-black hover:bg-black/5 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div
            className="my-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2"
            style={{ background: 'rgba(233,75,0,0.08)', color: '#E94B00', border: '1px solid rgba(233,75,0,0.3)' }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sony PlayStation 5 Slim 1TB"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Category *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Brand
              </label>
              <input
                type="text"
                placeholder="e.g. Sony"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Selling Price (RWF) *
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 780000"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Original Price (RWF)
              </label>
              <input
                type="number"
                placeholder="e.g. 920000"
                value={originalPrice}
                onChange={e => setOriginalPrice(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 15"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                SKU (optional, auto-generated if blank)
              </label>
              <input
                type="text"
                placeholder="e.g. SNY-PS5S-1TB"
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Promotional Badge
              </label>
              <select
                value={badge}
                onChange={e => setBadge(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              >
                <option value="None">None</option>
                <option value="New Arrival">New Arrival</option>
                <option value="Best Seller">Best Seller</option>
                <option value="Hot Deal">Hot Deal</option>
                <option value="Featured">Featured</option>
                <option value="Top Pick">Top Pick</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
          </div>

          <ImageUploader
            key={uploaderKey}
            value={image}
            onChange={setImage}
            label="Product Image (Upload Photo from Device)"
          />

          <div>
            <label className="block text-xs font-semibold mb-1 text-[#111111]">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Product highlights, specifications, and warranty details..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm resize-none"
              style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="featuredCheck"
              checked={featured}
              onChange={e => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded accent-[#FF6A00]"
            />
            <label htmlFor="featuredCheck" className="text-xs font-medium text-[#111111] cursor-pointer">
              Show in Featured Collection on Home Page
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: '#F1FFF0' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold btn-gold flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Saving Product...
                </>
              ) : (
                'Add Product to Store'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
