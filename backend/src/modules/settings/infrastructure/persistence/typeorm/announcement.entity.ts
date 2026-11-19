import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'announcements' })
export class AnnouncementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'text' })
  title!: string

  @Column({ type: 'text' })
  message!: string

  @Column({ type: 'text', nullable: true })
  link!: string | null

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive!: boolean

  @Column({ name: 'start_date', type: 'timestamptz', nullable: true })
  startDate!: Date | null

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date
}
