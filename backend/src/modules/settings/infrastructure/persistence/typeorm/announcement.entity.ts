import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'announcements' })
export class AnnouncementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'text' })
  title!: string

  @Column({ type: 'text' })
  message!: string

  @Column({ type: 'text', default: 'Announcement' })
  tag!: string

  @Column({ type: 'boolean', default: true })
  active!: boolean

  @Column({ name: 'start_date', type: 'timestamptz', nullable: true })
  startDate!: Date | null

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date
}
