import { Check, Column, CreateDateColumn, DeleteDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { OrderItemEntity } from './order-item.entity'

@Entity({ name: 'orders' })
@Index('orders_created_at_idx', ['createdAt'])
@Index('orders_status_idx', ['status'])
@Check('orders_subtotal_check', 'subtotal >= 0')
@Check('orders_delivery_fee_check', 'delivery_fee >= 0')
@Check('orders_total_amount_check', 'total_amount >= 0')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'customer_name', type: 'text' })
  customerName!: string

  @Column({ type: 'text' })
  phone!: string

  @Column({ type: 'text' })
  email!: string

  @Column({ name: 'delivery_address', type: 'jsonb', default: () => "'{}'::jsonb" })
  deliveryAddress!: Record<string, unknown>

  @Column({ type: 'text', default: 'PENDING_PAYMENT' })
  status!: string

  @Column({ name: 'payment_status', type: 'text', default: 'PENDING' })
  paymentStatus!: string

  @Column({ name: 'payment_method', type: 'text', default: 'unknown' })
  paymentMethod!: string

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  subtotal!: string

  @Column({ name: 'delivery_fee', type: 'numeric', precision: 14, scale: 2, default: 0 })
  deliveryFee!: string

  @Column({ name: 'total_amount', type: 'numeric', precision: 14, scale: 2 })
  totalAmount!: string

  @Column({ name: 'requested_delivery_time', type: 'timestamptz', nullable: true })
  requestedDeliveryTime!: Date | null

  @Column({ type: 'text', default: 'web' })
  channel!: string

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason!: string | null

  @Column({ name: 'customer_instructions', type: 'text', nullable: true })
  customerInstructions!: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null

  @OneToMany(() => OrderItemEntity, (item) => item.order, { cascade: ['insert'] })
  items!: OrderItemEntity[]
}
