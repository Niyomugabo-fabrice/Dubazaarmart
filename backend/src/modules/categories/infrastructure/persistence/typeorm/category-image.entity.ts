import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'category_images' })
export class CategoryImageEntity {
  @PrimaryColumn({ name: 'category_id', type: 'text' })
  categoryId!: string

  @Column({ name: 'image_url', type: 'text' })
  imageUrl!: string

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date
}
