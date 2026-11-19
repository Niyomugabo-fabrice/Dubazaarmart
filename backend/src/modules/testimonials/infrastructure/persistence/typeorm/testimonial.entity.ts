import { Check, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'testimonials' })
@Index('testimonials_visible_created_at_idx', ['isVisible', 'createdAt'])
@Check('testimonials_rating_check', 'rating BETWEEN 1 AND 5')
export class TestimonialEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'customer_name', type: 'text' })
  customerName!: string

  @Column({ type: 'text', nullable: true })
  role!: string | null

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl!: string | null

  @Column({ type: 'integer' })
  rating!: number

  @Column({ type: 'text' })
  message!: string

  @Column({ name: 'is_visible', type: 'boolean', default: true })
  isVisible!: boolean

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date
}
