import { useState, useEffect } from 'react'
import { apiFetch, apiUrl } from '../services/api-client'
import type { StoredProduct } from '../types/product'
import ImageUploader from './ImageUploader'
import { fetchProductsFromBackend } from '../store/productsStore'

interface Props {
  product: StoredProduct | null
  isOpen: boolean
  onClose: () => void
  onProductUpdated: (updatedProduct: StoredProduct) => void
}

export default function EditProductModal({ product, isOpen, onClose, onProductUpdated }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('smartphones')
  const [brand, setBrand] = useState('Samsung')
  const [price, setPrice] = useState(0)
  const [originalPrice, setOriginalPrice] = useState(0)
  const [quantity, setQuantity] = useState(0)
  const [description, setDescription] = useState('')
  const [active, setActive] = useState(true)
  const [featured, setFeatured] = useState(false)
  const [badge, setBadge] = useState('')
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (product) {
      setName(product.name || '')
      setCategory(product.category || 'smartphones')
      setBrand(product.brand || 'Samsung')
      setPrice(product.price || 0)
      setOriginalPrice(product.originalPrice || product.price || 0)
      setQuantity(product.quantity || 0)
      setDescription(product.description || '')
      setActive(product.active !== undefined ? product.active : true)
      setFeatured(Boolean(product.featured))
      setBadge(product.badge || '')
      setImage(product.image || '')
    }
  }, [product])

  if (!isOpen || !product) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Product name is required.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await apiFetch(apiUrl(`/api/admin/products/${product!.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          brand: brand.trim(),
          price: Number(price) || 0,
          originalPrice: Number(originalPrice) || Number(price),
          quantity: Number(quantity) || 0,
          description: description.trim(),
          active,
          featured,
          badge: badge.trim() || undefined,
          image: image.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update product')
      }

      const res = await response.json()
      await fetchProductsFromBackend()
      onProductUpdated(res.product)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
      <div className="max-h-[calc(100dvh_-_2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border-2 border-[#FFB800] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Edit Store Product</h3>
            <p className="text-xs text-gray-500 font-mono">SKU: {product.sku}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 font-bold text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Product Name *</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
              >
                <option value="smartphones">Smartphones</option>
                <option value="laptops">Laptops</option>
                <option value="audio">Audio / AirPods</option>
                <option value="watches">Smartwatches</option>
                <option value="gaming">Gaming</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Price (RWF) *</label>
              <input
                required
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Original Price (RWF)</label>
              <input
                type="number"
                min="0"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono text-gray-500"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Available Quantity *</label>
              <input
                required
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Promotional Badge</label>
              <input
                type="text"
                placeholder="e.g. New Arrival, Hot Deal"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
              />
            </div>
            <div className="flex items-center gap-4 pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded"
                />
                Published (Active)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded"
                />
                Featured
              </label>
            </div>
          </div>

          <ImageUploader
            value={image}
            onChange={setImage}
            label="Product Image (Upload Photo from Device)"
          />

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm resize-none"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs font-bold btn-gold shadow-sm"
            >
              {loading ? 'Saving...' : 'Save Product Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
