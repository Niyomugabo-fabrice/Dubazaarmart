import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { CompanyOrderEntity } from './company-order.entity'

@Entity({ name: 'company_order_items' })
@Check('company_order_items_unit_price_check', 'unit_price >= 0')
@Check('company_order_items_quantity_ordered_check', 'quantity_ordered > 0')
@Check('company_order_items_quantity_received_check', 'quantity_received >= 0')
@Check('company_order_items_total_price_check', 'total_price >= 0')
export class CompanyOrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string

  @ManyToOne(() => CompanyOrderEntity, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: CompanyOrderEntity

  @Column({ name: 'product_name', type: 'text' })
  productName!: string

  @Column({ type: 'text', default: '' })
  category!: string

  @Column({ name: 'unit_price', type: 'numeric', precision: 14, scale: 2 })
  unitPrice!: string

  @Column({ name: 'quantity_ordered', type: 'integer' })
  quantityOrdered!: number

  @Column({ name: 'quantity_received', type: 'integer', default: 0 })
  quantityReceived!: number

  @Column({ name: 'total_price', type: 'numeric', precision: 14, scale: 2 })
  totalPrice!: string

  @Column({ name: 'added_to_stock', type: 'boolean', default: false })
  addedToStock!: boolean
}
