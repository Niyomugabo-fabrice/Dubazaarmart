import { randomUUID } from 'node:crypto'
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { CatalogQuery, ProductRepository } from '../domain/product.repository'
import { PRODUCT_REPOSITORY } from '../domain/product.repository'
import type { CreateProductDto, UpdateProductDto } from '../presentation/dto/product.dto'
import type { ProductEntity } from '../infrastructure/persistence/typeorm/product.entity'
import { AuditService } from '../../audit/application/audit.service'
import type { UserIdentity } from '../../auth/domain/user-account'

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly audit: AuditService,
  ) {}

  async findCatalog(query: CatalogQuery) {
    return { products: (await this.products.findCatalog(query)).map(serializeProduct) }
  }

  async findAll() {
    return { products: (await this.products.findAll()).map(serializeProduct) }
  }

  findActiveBySkus(skus: string[]) {
    return this.products.findActiveBySkus(skus)
  }

  async create(dto: CreateProductDto, actor?: UserIdentity) {
    const name = dto.name.trim()
    const category = dto.category?.trim() || 'electronics'
    const price = Number(dto.price)
    if (!Number.isFinite(price) || price <= 0) {
      throw new BadRequestException('Unit price must be positive (greater than 0).')
    }

    const moqNumber = dto.moq !== undefined ? Number(dto.moq) : 1
    if (!Number.isInteger(moqNumber) || moqNumber < 1) {
      throw new BadRequestException('MOQ must be a whole number of 1 or more.')
    }

    const listingType = normalizeListingType(dto.listingType)
    const quantity = dto.quantity !== undefined ? Math.max(0, Math.floor(Number(dto.quantity))) : 0

    let wholesalePrice: string | null = null
    if (dto.wholesalePrice !== undefined && dto.wholesalePrice !== null && String(dto.wholesalePrice).trim() !== '') {
      const parsed = Number(dto.wholesalePrice)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new BadRequestException('Wholesale price must be positive (greater than 0).')
      }
      wholesalePrice = String(parsed)
    } else if (listingType === 'wholesale') {
      wholesalePrice = String(price)
    }

    const originalPrice = Number(dto.originalPrice) || price
    const sku = dto.sku?.trim() || `${category.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
    const id = randomUUID()
    const baseSlug = slugify(name) || 'product'
    const slug = await this.createUniqueSlug(baseSlug, id)
    const product = await this.save({
      id,
      slug,
      name,
      brand: dto.brand?.trim() || 'General',
      category,
      description: dto.description?.trim() || '',
      sku,
      price: String(price),
      wholesalePrice,
      originalPrice: String(originalPrice),
      discount: Number(dto.discount) || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0),
      quantity,
      moq: moqNumber,
      listingType,
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

    await this.audit.record({
      actorUserId: actor?.id ?? null,
      actorName: actor?.name ?? 'Staff',
      action: 'products.created',
      targetResource: 'products',
      targetId: product.id,
      recordNumber: product.name,
      newValues: {
        name: product.name,
        sku: product.sku,
        price: product.price,
        wholesalePrice: product.wholesalePrice,
        moq: product.moq,
        listingType: product.listingType,
        quantity: product.quantity,
        category: product.category,
        active: product.active,
        brand: product.brand,
      },
    })

    return { success: true, product: serializeProduct(product) }
  }

  async update(id: string, dto: UpdateProductDto, actor?: UserIdentity) {
    const current = await this.products.findById(id)
    if (!current) throw new NotFoundException('Product not found')
    const data: Partial<ProductEntity> = {}
    if (dto.name !== undefined) data.name = String(dto.name).trim()
    if (dto.price !== undefined) {
      const price = Number(dto.price)
      if (!Number.isFinite(price) || price <= 0) {
        throw new BadRequestException('Unit price must be positive (greater than 0).')
      }
      data.price = String(price)
    }
    if (dto.wholesalePrice !== undefined) {
      if (dto.wholesalePrice === null || String(dto.wholesalePrice).trim() === '') {
        data.wholesalePrice = null
      } else {
        const parsed = Number(dto.wholesalePrice)
        if (!Number.isFinite(parsed) || parsed <= 0) {
          throw new BadRequestException('Wholesale price must be positive (greater than 0).')
        }
        data.wholesalePrice = String(parsed)
      }
    }
    if (dto.originalPrice !== undefined) data.originalPrice = String(dto.originalPrice)
    if (dto.discount !== undefined) {
      data.discount = Number(dto.discount)
    } else if (dto.price !== undefined || dto.originalPrice !== undefined) {
      const price = Number(dto.price ?? current.price)
      const originalPrice = Number(dto.originalPrice ?? current.originalPrice ?? current.price)
      data.discount = originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0
    }
    if (dto.quantity !== undefined) {
      const qty = Number(dto.quantity)
      if (!Number.isInteger(qty) || qty < 0) {
        throw new BadRequestException('Stock quantity must be a whole number of 0 or more.')
      }
      data.quantity = qty
    }
    if (dto.moq !== undefined) {
      const moqNumber = Number(dto.moq)
      if (!Number.isInteger(moqNumber) || moqNumber < 1) {
        throw new BadRequestException('MOQ must be a whole number of 1 or more.')
      }
      data.moq = moqNumber
    }
    if (dto.listingType !== undefined) {
      data.listingType = normalizeListingType(dto.listingType)
    }
    if (dto.category !== undefined) data.category = String(dto.category).trim()
    if (dto.brand !== undefined) data.brand = String(dto.brand).trim()
    if (dto.description !== undefined) data.description = String(dto.description).trim()
    if (dto.image !== undefined) data.image = dto.image || null
    if (dto.images !== undefined) data.images = Array.isArray(dto.images) ? dto.images : []
    if (dto.active !== undefined) data.active = Boolean(dto.active)
    if (dto.featured !== undefined) data.featured = Boolean(dto.featured)
    if (dto.specs !== undefined) data.specs = dto.specs
    if (dto.badge !== undefined) data.badge = dto.badge || null
    if (Object.keys(data).length === 0) throw new BadRequestException('No fields provided for update')

    const updated = await this.save({ ...current, ...data })

    const changes = AuditService.diff(
      {
        name: current.name,
        price: current.price,
        wholesalePrice: current.wholesalePrice,
        moq: current.moq,
        listingType: current.listingType,
        quantity: current.quantity,
        category: current.category,
        active: current.active,
      },
      {
        name: updated.name,
        price: updated.price,
        wholesalePrice: updated.wholesalePrice,
        moq: updated.moq,
        listingType: updated.listingType,
        quantity: updated.quantity,
        category: updated.category,
        active: updated.active,
      },
    )

    await this.audit.record({
      actorUserId: actor?.id ?? null,
      actorName: actor?.name ?? 'Staff',
      action: 'products.updated',
      targetResource: 'products',
      targetId: id,
      recordNumber: updated.name,
      oldValues: changes.oldValues,
      newValues: changes.newValues,
    })

    return { success: true, product: serializeProduct(updated) }
  }

  async remove(id: string, actor?: UserIdentity) {
    const current = await this.products.findById(id)
    if (!(await this.products.archive(id))) throw new NotFoundException('Product not found')

    await this.audit.record({
      actorUserId: actor?.id ?? null,
      actorName: actor?.name ?? 'Staff',
      action: 'products.deleted',
      targetResource: 'products',
      targetId: id,
      recordNumber: current?.name ?? id,
      oldValues: { active: true },
      newValues: { active: false },
    })

    return { success: true, message: 'Product archived successfully' }
  }

  private async createUniqueSlug(baseSlug: string, id: string): Promise<string> {
    let slug = baseSlug
    while (await this.products.findBySlug(slug)) {
      slug = `${baseSlug}-${id}`
      if (await this.products.findBySlug(slug)) slug = `${baseSlug}-${id}-${randomUUID()}`
    }
    return slug
  }

  private async save(product: Partial<ProductEntity>): Promise<ProductEntity> {
    try {
      return await this.products.save(product)
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key') && error.message.includes('slug')) {
        const baseSlug = typeof product.slug === 'string' ? product.slug : 'product'
        if (typeof product.id === 'string') {
          const fallbackSlug = await this.createUniqueSlug(`${baseSlug}-${product.id}`, randomUUID())
          return this.products.save({ ...product, slug: fallbackSlug })
        }
      }
      throw error
    }
  }
}

function normalizeListingType(value: unknown): 'wholesale' | 'retail' | 'both' {
  if (typeof value !== 'string') return 'both'
  const lower = value.toLowerCase().trim()
  if (lower === 'wholesale') return 'wholesale'
  if (lower === 'retail') return 'retail'
  return 'both'
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function serializeProduct(row: ProductEntity) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category,
    description: row.description,
    sku: row.sku,
    price: Number(row.price),
    wholesalePrice: row.wholesalePrice ? Number(row.wholesalePrice) : null,
    originalPrice: row.originalPrice ? Number(row.originalPrice) : null,
    discount: row.discount,
    stock: row.quantity,
    quantity: row.quantity,
    moq: row.moq ?? 1,
    listingType: row.listingType ?? 'both',
    image: row.image,
    images: row.images ?? [],
    active: row.active,
    inStock: row.quantity > 0,
    featured: row.featured,
    rating: row.rating ? Number(row.rating) : 5,
    reviews: row.reviews,
    condition: row.condition,
    warranty: row.warranty,
    badge: row.badge,
    specs: row.specs,
    expectedFullStock: row.expectedFullStock,
    unitCost: row.unitCost ? Number(row.unitCost) : null,
    minStock: row.minStock,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
