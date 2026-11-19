import { Check, Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { OrderItemEntity } from '../../../../orders/infrastructure/persistence/typeorm/order-item.entity'

@Entity({ name: 'products' })
@Index('products_sku_key', ['sku'], { unique: true })
@Index('products_slug_key', ['slug'], { unique: true })
@Index('products_quantity_idx', ['quantity'])
@Check('products_price_check', 'price >= 0')
@Check('products_quantity_check', 'quantity >= 0')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'text' })
  name!: string

  @Column({ type: 'text' })
  slug!: string

  @Column({ type: 'text', default: '' })
  brand!: string

  @Column({ type: 'text', default: '' })
  category!: string

  @Column({ type: 'text', default: '' })
  description!: string

  @Column({ type: 'text' })
  sku!: string

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  price!: string

  @Column({ name: 'original_price', type: 'numeric', precision: 14, scale: 2, default: 0 })
  originalPrice!: string

  @Column({ type: 'integer', default: 0 })
  discount!: number

  @Column({ type: 'integer', default: 0 })
  quantity!: number

  @Column({ type: 'boolean', default: true })
  active!: boolean

  @Column({ type: 'text', nullable: true })
  image!: string | null

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  images!: string[]

  @Column({ type: 'text', default: 'New' })
  condition!: string

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  specs!: Record<string, unknown>

  @Column({ type: 'text', default: '1 year warranty' })
  warranty!: string

  @Column({ type: 'boolean', default: false })
  featured!: boolean

  @Column({ type: 'numeric', precision: 3, scale: 1, default: 5.0 })
  rating!: string

  @Column({ type: 'integer', default: 0 })
  reviews!: number

  @Column({ type: 'text', nullable: true })
  badge!: string | null

  @Column({ name: 'expected_full_stock', type: 'integer', default: 20 })
  expectedFullStock!: number

  @Column({ name: 'unit_cost', type: 'numeric', precision: 14, scale: 2, default: 0 })
  unitCost!: string

  @Column({ name: 'min_stock', type: 'integer', default: 5 })
  minStock!: number

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date

  @OneToMany(() => OrderItemEntity, (item) => item.product)
  orderItems!: OrderItemEntity[]
}
