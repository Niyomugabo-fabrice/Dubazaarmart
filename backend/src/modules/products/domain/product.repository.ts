import type { ProductEntity } from '../infrastructure/persistence/typeorm/product.entity'

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY')

export interface CatalogQuery {
  activeOnly: boolean
  category?: string
  search?: string
}

export interface ProductRepository {
  findCatalog(query: CatalogQuery): Promise<ProductEntity[]>
  findAll(): Promise<ProductEntity[]>
  findById(id: string): Promise<ProductEntity | null>
  findBySlug(slug: string): Promise<ProductEntity | null>
  findActiveBySkus(skus: string[]): Promise<ProductEntity[]>
  save(product: Partial<ProductEntity>): Promise<ProductEntity>
  archive(id: string): Promise<boolean>
}
