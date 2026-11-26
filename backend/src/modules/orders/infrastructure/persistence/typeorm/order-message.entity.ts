import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { OrderEntity } from './order.entity'

@Entity({ name: 'order_messages' })
@Index('order_messages_order_idx', ['orderId', 'createdAt'])
export class OrderMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string

  @Column({ name: 'sender_type', type: 'text' })
  senderType!: 'customer' | 'staff' | 'system'

  @Column({ name: 'sender_name', type: 'text' })
  senderName!: string

  @Column({ name: 'sender_id', type: 'text', nullable: true })
  senderId!: string | null

  @Column({ type: 'text' })
  message!: string

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  attachments!: string[]

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @ManyToOne(() => OrderEntity, (order) => order.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity
}
