import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { AdminRefreshTokenEntity } from './admin-refresh-token.entity'

@Entity({ name: 'admins' })
@Index('admins_email_key', ['email'], { unique: true })
export class AdminEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'text' })
  email!: string

  @Column({ name: 'password_hash', type: 'text', select: false })
  passwordHash!: string

  @Column({ type: 'text', default: 'IntoreTech Admin' })
  name!: string

  @Column({ type: 'text', default: 'admin' })
  role!: string

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @OneToMany(() => AdminRefreshTokenEntity, (token) => token.admin)
  refreshTokens!: AdminRefreshTokenEntity[]
}
