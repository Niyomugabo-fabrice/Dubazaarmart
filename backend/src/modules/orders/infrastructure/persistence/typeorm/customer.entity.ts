import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { OrderEntity } from './order.entity'

@Entity({ name: 'customers' })
@Index('customers_email_key', ['email'], { unique: true })
export class CustomerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'text' })
  name!: string

  @Column({ type: 'text' })
  email!: string

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @OneToMany(() => OrderEntity, (order) => order.customer)
  orders!: OrderEntity[]
}
