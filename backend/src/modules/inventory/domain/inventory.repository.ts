import type { ProductEntity } from '../../products/infrastructure/persistence/typeorm/product.entity'
import type { StockMovementEntity } from '../infrastructure/persistence/typeorm/stock-movement.entity'

export const INVENTORY_REPOSITORY = Symbol('INVENTORY_REPOSITORY')

export type ProductInventoryUpdates = Partial<{
  quantity: number
  expectedFullStock: number
  minStock: number
  unitCost: number
}>

export interface InventoryRepository {
  listProductsByStock(): Promise<ProductEntity[]>
  updateProductTargets(id: string, values: ProductInventoryUpdates): Promise<ProductEntity | null>
  removeStock(id: string, quantity: number, reason: string): Promise<ProductEntity | null>
  listMovements(productId?: string): Promise<StockMovementEntity[]>
}
