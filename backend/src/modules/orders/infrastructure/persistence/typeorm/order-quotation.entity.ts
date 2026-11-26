import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { OrderEntity } from './order.entity'

@Entity({ name: 'order_quotations' })
@Index('order_quotations_order_idx', ['orderId', 'version'])
@Check('order_quotations_product_cost_check', 'product_cost >= 0')
@Check('order_quotations_sourcing_fee_check', 'sourcing_fee >= 0')
@Check('order_quotations_shipping_cost_check', 'shipping_cost >= 0')
@Check('order_quotations_total_amount_check', 'total_amount >= 0')
export class OrderQuotationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string

  @Column({ type: 'integer' })
  version!: number

  @Column({ name: 'product_cost', type: 'numeric', precision: 14, scale: 2, default: 0 })
  productCost!: string

  @Column({ name: 'sourcing_fee', type: 'numeric', precision: 14, scale: 2, default: 0 })
  sourcingFee!: string

  @Column({ name: 'shipping_cost', type: 'numeric', precision: 14, scale: 2, default: 0 })
  shippingCost!: string

  @Column({ name: 'total_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalAmount!: string

  @Column({ type: 'text', nullable: true })
  notes!: string | null

  @Column({ type: 'text', default: 'PENDING' })
  status!: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED'

  @Column({ name: 'created_by', type: 'text' })
  createdBy!: string

  @Column({ name: 'created_by_user_id', type: 'text', nullable: true })
  createdByUserId!: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @ManyToOne(() => OrderEntity, (order) => order.quotations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity
}
