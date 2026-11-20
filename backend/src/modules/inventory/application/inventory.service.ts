import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { InventoryRepository } from '../domain/inventory.repository'
import { INVENTORY_REPOSITORY } from '../domain/inventory.repository'

@Injectable()
export class InventoryService {
  constructor(@Inject(INVENTORY_REPOSITORY) private readonly inventory: InventoryRepository) {}

  async getSummary() {
    const rows = await this.inventory.listProductsByStock()
    let totalStockUnits = 0
    let totalInventoryValue = 0
    let lowStockCount = 0
    let averageStockCount = 0
    let fullStockCount = 0
    const items = rows.map((row) => {
      const quantity = Number(row.quantity || 0)
      const targetStock = Number(row.expectedFullStock || 20)
      const minStock = Number(row.minStock || 5)
      const sellingPrice = Number(row.price || 0)
      const unitCost = Number(row.unitCost || 0)
      const totalValue = quantity * sellingPrice
      totalStockUnits += quantity
      totalInventoryValue += totalValue
      let statusColor: 'RED' | 'YELLOW' | 'GREEN' = 'GREEN'
      if (quantity <= minStock) { statusColor = 'RED'; lowStockCount++ }
      else if (quantity < targetStock) { statusColor = 'YELLOW'; averageStockCount++ }
      else fullStockCount++
      return {
        id: String(row.id), name: row.name, sku: row.sku, brand: row.brand, category: row.category,
        quantity, targetStock, minStock, unitCost, sellingPrice, totalValue, statusColor,
        active: Boolean(row.active), image: row.image, lastUpdated: row.updatedAt,
      }
    })
    return { items, totalProducts: rows.length, totalStockUnits, totalInventoryValue, lowStockCount, averageStockCount, fullStockCount }
  }

  async updateTargets(productId: string, body: Record<string, unknown>) {
    const values: Record<string, number> = {}
    if (body.quantity !== undefined) values.quantity = Math.max(0, Number(body.quantity))
    if (body.expectedFullStock !== undefined) values.expectedFullStock = Math.max(1, Number(body.expectedFullStock))
    if (body.minStock !== undefined) values.minStock = Math.max(0, Number(body.minStock))
    if (body.unitCost !== undefined) values.unitCost = Math.max(0, Number(body.unitCost))
    if (Object.keys(values).length === 0) throw new BadRequestException('No fields to update')
    if (Object.values(values).some((value) => !Number.isFinite(value))) throw new BadRequestException('Stock values must be valid numbers.')
    const product = await this.inventory.updateProductTargets(productId, values)
    if (!product) throw new NotFoundException('Product not found')
    return { success: true, product }
  }

  async removeStock(body: Record<string, any>) {
    const productId = typeof body.productId === 'string' ? body.productId : ''
    if (!productId) throw new BadRequestException('productId is required')
    const quantity = Math.max(1, Number(body.quantity || 1))
    if (!Number.isInteger(quantity)) throw new BadRequestException('quantity must be a whole number')
    const product = await this.inventory.removeStock(productId, quantity, String(body.reason || 'Manual Admin Removal'))
    if (!product) throw new NotFoundException('Product not found or there is not enough stock.')
    return { success: true, product, removed: quantity }
  }

  async getMovements(productId?: string) {
    const movements = await this.inventory.listMovements(productId)
    return {
      movements: movements.map((movement) => ({
        id: String(movement.id),
        productId: movement.productId,
        productName: movement.productName,
        sku: movement.sku,
        quantity: Number(movement.quantity),
        movementType: movement.movementType,
        reason: movement.reason,
        referenceId: movement.referenceId,
        createdAt: movement.createdAt,
      })),
    }
  }
}
