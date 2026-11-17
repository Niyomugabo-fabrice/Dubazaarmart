import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { OrderEntity } from './order.entity'
import { ProductEntity } from '../../../../products/infrastructure/persistence/typeorm/product.entity'

@Entity({ name: 'order_items' })
@Index('order_items_order_id_idx', ['orderId'])
@Check('order_items_quantity_check', 'quantity > 0')
@Check('order_items_unit_price_check', 'unit_price >= 0')
@Check('order_items_line_total_check', 'line_total >= 0')
export class OrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string

  @ManyToOne(() => OrderEntity, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId!: string | null

  @ManyToOne(() => ProductEntity, (product) => product.orderItems, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product!: ProductEntity | null

  @Column({ name: 'product_name', type: 'text' })
  productName!: string

  @Column({ type: 'text', default: '' })
  category!: string

  @Column({ type: 'text', default: '' })
  sku!: string

  @Column({ type: 'integer' })
  quantity!: number

  @Column({ name: 'unit_price', type: 'numeric', precision: 14, scale: 2 })
  unitPrice!: string

  @Column({ name: 'line_total', type: 'numeric', precision: 14, scale: 2 })
  lineTotal!: string
}
