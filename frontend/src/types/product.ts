export interface StoredProduct {
  id: string
  name: string
  category: string
  brand: string
  description: string
  price: number
  originalPrice: number
  discount: number
  image: string
  images: string[]
  quantity: number
  sku: string
  condition: "New" | "Refurbished"
  specs: Record<string, string>
  warranty: string
  featured: boolean
  active: boolean
  rating: number
  reviews: number
  badge?: string
  expectedFullStock?: number
  unitCost?: number
  minStock?: number
  createdAt: string
  updatedAt: string
}
