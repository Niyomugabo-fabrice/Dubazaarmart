import { useEffect, useState } from 'react'
import type { Product } from '../data/products'
import { categories } from '../data/products'
import ProductImagesField from './ProductImagesField'
import { addProductToBackend } from '../store/productsStore'
import { parseProductSpecs } from '../lib/product-specs'

interface Props {
  isOpen: boolean
  onClose: () => void
  onProductAdded: (newProd: Product) => void
}

export default function AddProductModal({ isOpen, onClose, onProductAdded }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [price, setPrice] = useState('')
  const [wholesalePrice, setWholesalePrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [moq, setMoq] = useState('1')
  const [listingType, setListingType] = useState<'both' | 'wholesale' | 'retail'>('both')
  const [sku, setSku] = useState('')
  const [badge, setBadge] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [specsText, setSpecsText] = useState('')
  const [featured, setFeatured] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setName('')
    setCategory('')
    setBrand('')
    setPrice('')
    setWholesalePrice('')
    setOriginalPrice('')
    setQuantity('0')
    setMoq('1')
    setListingType('both')
    setSku('')
    setBadge('')
    setImages([])
    setDescription('')
    setSpecsText('')
    setFeatured(false)
    setError(null)
  }, [isOpen])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const numPrice = Number(price.replace(/,/g, ''))
    const numWholesale = wholesalePrice.trim() ? Number(wholesalePrice.replace(/,/g, '')) : undefined
    const numOrig = originalPrice ? Number(originalPrice.replace(/,/g, '')) : numPrice
    const numQty = quantity.trim() ? Number(quantity) : 0
    const numMoq = moq.trim() ? Number(moq) : 1

    if (!name.trim()) {
      setError('Please provide a product name.')
      return
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Retail unit price must be positive (greater than 0 RWF).')
      return
    }
    if (numWholesale !== undefined && (isNaN(numWholesale) || numWholesale <= 0)) {
      setError('Wholesale price must be positive (greater than 0 RWF).')
      return
    }
    if (listingType === 'wholesale' && (numWholesale === undefined || numWholesale <= 0)) {
      setError('Please specify a wholesale unit price for wholesale products.')
      return
    }
    if (isNaN(numQty) || !Number.isInteger(numQty) || numQty < 0) {
      setError('Stock quantity must be a whole number of 0 or more.')
      return
    }
    if (isNaN(numMoq) || !Number.isInteger(numMoq) || numMoq < 1) {
      setError('MOQ must be a whole number of 1 or more.')
      return
    }
    if (!category) {
      setError('Please select a product category.')
      return
    }

    let specs: Record<string, string>
    try {
      specs = parseProductSpecs(specsText)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please check the product specifications.')
      return
    }

    setSubmitting(true)

    const productImages = images.filter(Boolean)
    const generatedSku = sku.trim() || `DUB-${category.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

    const payload: Partial<Product> = {
      name: name.trim(),
      category,
      brand: brand.trim(),
      price: numPrice,
      wholesalePrice: numWholesale ?? (listingType === 'wholesale' ? numPrice : null),
      originalPrice: numOrig >= numPrice ? numOrig : numPrice,
      quantity: numQty,
      moq: numMoq,
      listingType,
      sku: generatedSku,
      badge: badge.trim() || undefined,
      image: productImages[0] || '',
      images: productImages,
      description: description.trim(),
      specs,
      featured,
      active: true,
      condition: 'New',
      warranty: '1 year official warranty',
      rating: 5.0,
      reviews: 1,
    }

    try {
      const newProduct = await addProductToBackend(payload)
      if (!newProduct) throw new Error('Failed to save product')

      onProductAdded(newProduct)
      setName('')
      setCategory('')
      setBrand('')
      setPrice('')
      setOriginalPrice('')
      setQuantity('0')
      setMoq('1')
      setListingType('both')
      setSku('')
      setBadge('')
      setImages([])
      setDescription('')
      setSpecsText('')
      setFeatured(false)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding product')
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setName('')
    setCategory('')
    setBrand('')
    setPrice('')
    setWholesalePrice('')
    setOriginalPrice('')
    setQuantity('0')
    setMoq('1')
    setListingType('both')
    setSku('')
    setBadge('')
    setImages([])
    setDescription('')
    setSpecsText('')
    setFeatured(false)
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
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
            onClick={handleClose}
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
                placeholder="Enter product name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm placeholder:text-gray-400 placeholder:opacity-50"
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
                style={{
                  background: '#FFF7E8',
                  border: '1px solid #FFB800',
                  color: category ? '#111111' : '#9CA3AF',
                  opacity: category ? 1 : 0.5,
                }}
              >
                <option value="">Select a category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
                placeholder="Enter brand"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm placeholder:text-gray-400 placeholder:opacity-50"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Retail Unit Price (RWF) *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="e.g. 50000"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm placeholder:text-gray-400 placeholder:opacity-50 font-mono font-bold"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Discount / Original Price
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 60000"
                value={originalPrice}
                onChange={e => setOriginalPrice(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm placeholder:text-gray-400 placeholder:opacity-50"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                placeholder="e.g. 25"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm placeholder:text-gray-400 placeholder:opacity-50 font-mono font-bold"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
              />
            </div>
          </div>

          {/* Where it appears, Wholesale Price & MOQ Section */}
          <div className="grid sm:grid-cols-3 gap-4 rounded-2xl p-3.5 border" style={{ background: '#FAFAFA', borderColor: '#E5E7EB' }}>
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Where it appears *
              </label>
              <select
                value={listingType}
                onChange={e => setListingType(e.target.value as 'both' | 'wholesale' | 'retail')}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#111111' }}
              >
                <option value="both">Both Wholesale &amp; Shopping (Retail)</option>
                <option value="retail">Shopping (Retail) Only</option>
                <option value="wholesale">Wholesale Only</option>
              </select>
              <p className="mt-1 text-[11px] text-gray-500">
                Visible on Wholesale, Shopping, or both.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                Wholesale Price (RWF) {listingType === 'wholesale' ? '*' : '(Wholesale)'}
              </label>
              <input
                type="number"
                min="1"
                step="any"
                placeholder={price ? `e.g. ${Math.round(Number(price) * 0.85)}` : 'e.g. 42000'}
                value={wholesalePrice}
                onChange={e => setWholesalePrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold"
                style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#111111' }}
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Bulk price shown on the Wholesale page. Can differ from retail unit price.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                MOQ (Minimum Order Qty) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                placeholder="e.g. 1, 5, 20"
                value={moq}
                onChange={e => setMoq(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold"
                style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#111111' }}
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Minimum order quantity for wholesale (whole number &ge; 1).
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#111111]">
                SKU (optional, auto-generated if blank)
              </label>
              <input
                type="text"
                placeholder="Optional SKU"
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm placeholder:text-gray-400 placeholder:opacity-50"
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
                style={{
                  background: '#FFF7E8',
                  border: '1px solid #FFB800',
                  color: badge ? '#111111' : '#9CA3AF',
                  opacity: badge ? 1 : 0.5,
                }}
              >
                <option value="">No badge</option>
                <option value="New Arrival">New Arrival</option>
                <option value="Best Seller">Best Seller</option>
                <option value="Hot Deal">Hot Deal</option>
                <option value="Featured">Featured</option>
                <option value="Top Pick">Top Pick</option>
                <option value="Premium">Premium</option>
                <option value="Wholesale">Wholesale</option>
              </select>
            </div>
          </div>

          <ProductImagesField images={images} onChange={setImages} />

          <div>
            <label className="block text-xs font-semibold mb-1 text-[#111111]">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Enter product description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm placeholder:text-gray-400 placeholder:opacity-50 resize-none"
              style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-[#111111]">
              Specifications
            </label>
            <textarea
              rows={3}
              placeholder={'e.g. Color: Space Gray\nRAM: 16 GB\nStorage: 512 GB SSD'}
              value={specsText}
              onChange={e => setSpecsText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm placeholder:text-gray-400 placeholder:opacity-50 resize-y"
              style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
            />
            <p className="mt-1 text-[11px] text-gray-500">Enter one specification per line as “name: value”.</p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="featured-product"
              checked={featured}
              onChange={e => setFeatured(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="featured-product" className="text-xs font-semibold text-[#111111] cursor-pointer">
              Feature on Homepage
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: '#F1FFF0' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-black/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold btn-gold shadow-md hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
