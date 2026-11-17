import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'stock_movements' })
@Index('stock_movements_created_at_idx', ['createdAt'])
export class StockMovementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'product_id', type: 'text' })
  productId!: string

  @Column({ name: 'product_name', type: 'text' })
  productName!: string

  @Column({ type: 'text', default: '' })
  sku!: string

  @Column({ type: 'integer' })
  quantity!: number

  @Column({ name: 'movement_type', type: 'text' })
  movementType!: string

  @Column({ type: 'text', default: '' })
  reason!: string

  @Column({ name: 'reference_id', type: 'text', nullable: true })
  referenceId!: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date
}
