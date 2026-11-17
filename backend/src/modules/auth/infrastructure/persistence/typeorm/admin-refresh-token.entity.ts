import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import { AdminEntity } from './admin.entity'

@Entity({ name: 'admin_refresh_tokens' })
@Index('admin_refresh_tokens_token_hash_key', ['tokenHash'], { unique: true })
@Index('admin_refresh_tokens_admin_id_idx', ['adminId'])
export class AdminRefreshTokenEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string

  @Column({ name: 'admin_id', type: 'uuid' })
  adminId!: string

  @Column({ name: 'token_hash', type: 'text' })
  tokenHash!: string

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @ManyToOne(() => AdminEntity, (admin) => admin.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin!: AdminEntity
}
