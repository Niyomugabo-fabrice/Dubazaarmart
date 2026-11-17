import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import type { CatalogQuery, ProductRepository } from '../../../domain/product.repository'
import { ProductEntity } from './product.entity'

@Injectable()
export class TypeOrmProductRepository implements ProductRepository {
  constructor(@InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>) {}

  findCatalog(query: CatalogQuery): Promise<ProductEntity[]> {
    const builder = this.products.createQueryBuilder('product').orderBy('product.createdAt', 'DESC')
    if (query.activeOnly) builder.andWhere('product.active = true')
    if (query.category && query.category !== 'all') {
      builder.andWhere('LOWER(product.category) = LOWER(:category)', { category: query.category })
    }
    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`
      builder.andWhere('(product.name ILIKE :term OR product.brand ILIKE :term OR product.sku ILIKE :term OR product.description ILIKE :term)', { term })
    }
    return builder.getMany()
  }

  findAll(): Promise<ProductEntity[]> {
    return this.products.find({ order: { createdAt: 'DESC' } })
  }

  findById(id: string): Promise<ProductEntity | null> {
    return this.products.findOneBy({ id })
  }

  findActiveBySkus(skus: string[]): Promise<ProductEntity[]> {
    if (!skus.length) return Promise.resolve([])
    return this.products.find({ where: { sku: In(skus), active: true } })
  }

  save(product: Partial<ProductEntity>): Promise<ProductEntity> {
    return this.products.save(this.products.create(product))
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.products.delete({ id })
    return Boolean(result.affected)
  }
}
