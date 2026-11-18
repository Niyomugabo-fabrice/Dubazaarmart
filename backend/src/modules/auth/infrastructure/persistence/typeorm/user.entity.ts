import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import type { StaffPermission, UserRole, UserStatus } from '../../../domain/user-account'

@Entity({ name: 'users' })
@Index('users_role_status_idx', ['role', 'status'])
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'first_name', type: 'text' })
  firstName!: string

  @Column({ name: 'last_name', type: 'text', default: '' })
  lastName!: string

  @Column({ type: 'text' })
  email!: string

  @Column({ name: 'phone_number', type: 'text', nullable: true })
  phoneNumber!: string | null

  @Column({ name: 'password_hash', type: 'text', select: false })
  passwordHash!: string

  @Column({ type: 'text' })
  role!: UserRole

  @Column({ type: 'text', default: 'PENDING' })
  status!: UserStatus

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified!: boolean

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  permissions!: StaffPermission[]

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null
}
