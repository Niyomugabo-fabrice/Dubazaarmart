import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { CatalogQuery, ProductRepository } from '../domain/product.repository'
import { PRODUCT_REPOSITORY } from '../domain/product.repository'
import type { CreateProductDto, UpdateProductDto } from '../presentation/dto/product.dto'
import type { ProductEntity } from '../infrastructure/persistence/typeorm/product.entity'

@Injectable()
export class ProductService {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository) {}

  async findCatalog(query: CatalogQuery) {
    return { products: (await this.products.findCatalog(query)).map(serializeProduct) }
  }

  async findAll() {
    return { products: (await this.products.findAll()).map(serializeProduct) }
  }

  findActiveBySkus(skus: string[]) {
    return this.products.findActiveBySkus(skus)
  }

  async create(dto: CreateProductDto) {
    const name = dto.name.trim()
    const category = dto.category?.trim() || 'electronics'
    const price = Number(dto.price)
    const originalPrice = Number(dto.originalPrice) || price
    const sku = dto.sku?.trim() || `${category.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
    const product = await this.save({
      name,
      brand: dto.brand?.trim() || 'General',
      category,
      description: dto.description?.trim() || '',
      sku,
      price: String(price),
      originalPrice: String(originalPrice),
      discount: Number(dto.discount) || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0),
      quantity: Math.max(0, Number(dto.quantity) || 0),
      active: dto.active !== false,
      image: dto.image || null,
      images: Array.isArray(dto.images) ? dto.images : dto.image ? [dto.image] : [],
      condition: dto.condition === 'Refurbished' ? 'Refurbished' : 'New',
      specs: dto.specs && typeof dto.specs === 'object' ? dto.specs : {},
      warranty: dto.warranty || '1 year warranty',
      featured: Boolean(dto.featured),
      rating: String(Number(dto.rating) || 5),
      reviews: Number(dto.reviews) || 0,
      badge: dto.badge || null,
      expectedFullStock: Number(dto.expectedFullStock) || 20,
      unitCost: String(Number(dto.unitCost) || 0),
      minStock: Number(dto.minStock) || 5,
    })
    return { success: true, product: serializeProduct(product) }
  }

  async update(id: string, dto: UpdateProductDto) {
    const current = await this.products.findById(id)
    if (!current) throw new NotFoundException('Product not found')
    const data: Partial<ProductEntity> = {}
    if (dto.name !== undefined) data.name = String(dto.name).trim()
    if (dto.price !== undefined) data.price = String(dto.price)
    if (dto.originalPrice !== undefined) data.originalPrice = String(dto.originalPrice)
    if (dto.quantity !== undefined) data.quantity = Number(dto.quantity)
    if (dto.category !== undefined) data.category = String(dto.category).trim()
    if (dto.brand !== undefined) data.brand = String(dto.brand).trim()
    if (dto.description !== undefined) data.description = String(dto.description).trim()
    if (dto.image !== undefined) data.image = dto.image || null
    if (dto.images !== undefined) data.images = Array.isArray(dto.images) ? dto.images : []
    if (dto.active !== undefined) data.active = Boolean(dto.active)
    if (dto.badge !== undefined) data.badge = dto.badge || null
    if (Object.keys(data).length === 0) throw new BadRequestException('No fields provided for update')
    return { success: true, product: serializeProduct(await this.save({ ...current, ...data })) }
  }

  async remove(id: string) {
    if (!(await this.products.delete(id))) throw new NotFoundException('Product not found')
    return { success: true, message: 'Product deleted successfully' }
  }

  private async save(product: Partial<ProductEntity>) {
    try {
      return await this.products.save(product)
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('A product with this SKU already exists.')
      throw error
    }
  }
}

export function serializeProduct(row: ProductEntity) {
  return {
    id: String(row.id),
    name: row.name,
    category: row.category,
    brand: row.brand,
    description: row.description || '',
    price: Number(row.price),
    originalPrice: Number(row.originalPrice || row.price),
    discount: Number(row.discount || 0),
    image: row.image || '',
    images: Array.isArray(row.images) ? row.images : row.image ? [row.image] : [],
    quantity: Number(row.quantity),
    sku: row.sku,
    condition: row.condition || 'New',
    specs: row.specs && typeof row.specs === 'object' ? row.specs : {},
    warranty: row.warranty || '1 year warranty',
    featured: Boolean(row.featured),
    active: Boolean(row.active),
    rating: Number(row.rating || 5),
    reviews: Number(row.reviews || 0),
    badge: row.badge || undefined,
    expectedFullStock: Number(row.expectedFullStock || 20),
    unitCost: Number(row.unitCost || 0),
    minStock: Number(row.minStock || 5),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'driverError' in error &&
    (error as { driverError?: { code?: string } }).driverError?.code === '23505')
}
