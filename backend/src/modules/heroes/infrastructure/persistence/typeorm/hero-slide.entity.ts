import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'hero_slides' })
@Index('hero_slides_active_sort_order_idx', ['isActive', 'sortOrder'])
export class HeroSlideEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'image_url', type: 'text' })
  imageUrl!: string

  @Column({ type: 'text', nullable: true })
  heading!: string | null

  @Column({ type: 'text', nullable: true })
  subheading!: string | null

  @Column({ name: 'button_text', type: 'text', nullable: true })
  buttonText!: string | null

  @Column({ name: 'button_link', type: 'text', nullable: true })
  buttonLink!: string | null

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date
}
