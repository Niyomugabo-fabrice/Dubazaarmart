import { Check, Column, CreateDateColumn, DeleteDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { CompanyOrderItemEntity } from './company-order-item.entity'

@Entity({ name: 'company_orders' })
@Index('company_orders_po_number_key', ['poNumber'], { unique: true })
@Index('company_orders_expected_arrival_idx', ['expectedArrival'])
@Check('company_orders_status_check', "status IN ('ORDERED', 'SHIPPED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED')")
@Check('company_orders_payment_status_check', "payment_status IN ('PENDING', 'PAID', 'PARTIAL')")
export class CompanyOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'po_number', type: 'text' })
  poNumber!: string

  @Column({ name: 'supplier_name', type: 'text' })
  supplierName!: string

  @Column({ name: 'supplier_contact', type: 'text', default: '' })
  supplierContact!: string

  @Column({ name: 'shipping_company', type: 'text', default: '' })
  shippingCompany!: string

  @CreateDateColumn({ name: 'order_date', type: 'timestamptz' })
  orderDate!: Date

  @Column({ name: 'expected_arrival', type: 'timestamptz' })
  expectedArrival!: Date

  @Column({ type: 'text', default: 'USD' })
  currency!: string

  @Column({ name: 'shipping_cost', type: 'numeric', precision: 14, scale: 2, default: 0 })
  shippingCost!: string

  @Column({ name: 'other_charges', type: 'numeric', precision: 14, scale: 2, default: 0 })
  otherCharges!: string

  @Column({ name: 'total_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalAmount!: string

  @Column({ type: 'text', default: 'ORDERED' })
  status!: string

  @Column({ name: 'payment_status', type: 'text', default: 'PAID' })
  paymentStatus!: string

  @Column({ type: 'text', default: '' })
  notes!: string

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null

  @OneToMany(() => CompanyOrderItemEntity, (item) => item.order, { cascade: ['insert'] })
  items!: CompanyOrderItemEntity[]
}
