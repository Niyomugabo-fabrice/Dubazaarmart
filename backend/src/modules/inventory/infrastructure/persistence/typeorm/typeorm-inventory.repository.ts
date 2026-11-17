import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import type { InventoryRepository, ProductInventoryUpdates } from '../../../domain/inventory.repository'
import { ProductEntity } from '../../../../products/infrastructure/persistence/typeorm/product.entity'
import { StockMovementEntity } from './stock-movement.entity'

@Injectable()
export class TypeOrmInventoryRepository implements InventoryRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  listProductsByStock() {
    return this.dataSource.getRepository(ProductEntity).find({ order: { quantity: 'ASC', name: 'ASC' } })
  }

  async updateProductTargets(id: string, values: ProductInventoryUpdates) {
    const repository = this.dataSource.getRepository(ProductEntity)
    const result = await repository.update({ id }, {
      ...values,
      unitCost: values.unitCost === undefined ? undefined : String(values.unitCost),
    })
    return result.affected ? repository.findOneBy({ id }) : null
  }

  removeStock(id: string, quantity: number, reason: string) {
    return this.dataSource.transaction(async (manager) => {
      const products = manager.getRepository(ProductEntity)
      const product = await products.createQueryBuilder('product')
        .setLock('pessimistic_write')
        .where('product.id = :id', { id })
        .getOne()
      if (!product || product.quantity < quantity) return null

      product.quantity -= quantity
      const updated = await products.save(product)
      await manager.getRepository(StockMovementEntity).insert({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: -quantity,
        movementType: 'MANUAL_REMOVAL',
        reason,
      })
      return updated
    })
  }

  listMovements(productId?: string) {
    return this.dataSource.getRepository(StockMovementEntity).find({
      where: productId ? { productId } : undefined,
      order: { createdAt: 'DESC' },
      take: 200,
    })
  }
}
