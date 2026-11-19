import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Repository } from 'typeorm'
import { STAFF_OPERATIONAL_PERMISSION_KEYS, type StaffPermission, type UserAccount, type UserIdentity } from '../../../domain/user-account'
import type {
  CreateUserRecord,
  StaffListQuery,
  StaffListResult,
  UpdateStaffRecord,
  UserRepository,
} from '../../../domain/user.repository'
import { UserEntity } from './user.entity'

const SORT_COLUMNS = {
  name: 'user.firstName',
  email: 'user.email',
  status: 'user.status',
  createdAt: 'user.createdAt',
  lastLoginAt: 'user.lastLoginAt',
} as const

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(@InjectRepository(UserEntity) private readonly users: Repository<UserEntity>) {}

  async findByEmail(email: string): Promise<UserAccount | null> {
    const user = await this.users.createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = LOWER(:email)', { email: email.trim() })
      .getOne()
    return user ? this.toAccount(user) : null
  }

  async findById(id: string): Promise<UserAccount | null> {
    const user = await this.users.createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne()
    return user ? this.toAccount(user) : null
  }

  async findIdentityById(id: string): Promise<UserIdentity | null> {
    const user = await this.users.findOneBy({ id })
    return user ? this.toIdentity(user) : null
  }

  async listManagedUsers(query: StaffListQuery): Promise<StaffListResult> {
    const builder = this.users.createQueryBuilder('user')
      .where('user.role IN (:...roles)', { roles: ['STAFF', 'MANAGER'] })

    if (query.status) builder.andWhere('user.status = :status', { status: query.status })
    if (query.search) {
      builder.andWhere(
        `(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.phoneNumber ILIKE :search)`,
        { search: `%${query.search.trim()}%` },
      )
    }

    const [users, total] = await builder
      .orderBy(SORT_COLUMNS[query.sortBy], query.sortOrder)
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount()

    return {
      items: users.map((user) => this.toIdentity(user)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    }
  }

  async createStaff(record: CreateUserRecord): Promise<UserAccount> {
    const user = this.users.create({
      id: randomUUID(),
      firstName: record.firstName.trim(),
      lastName: record.lastName.trim(),
      email: record.email.trim().toLowerCase(),
      phoneNumber: record.phoneNumber?.trim() || null,
      passwordHash: record.passwordHash,
      role: 'STAFF',
      status: record.status,
      emailVerified: record.emailVerified ?? false,
      permissions: record.permissions ?? [],
    })
    return this.toAccount(await this.users.save(user))
  }

  async updateManagedUser(id: string, values: UpdateStaffRecord): Promise<UserAccount | null> {
    const user = await this.users.createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where("user.id = :id AND user.role IN ('STAFF', 'MANAGER') AND user.deleted_at IS NULL", { id })
      .getOne()
    if (!user) return null

    if (values.firstName !== undefined) user.firstName = values.firstName.trim()
    if (values.lastName !== undefined) user.lastName = values.lastName.trim()
    if (values.phoneNumber !== undefined) user.phoneNumber = values.phoneNumber?.trim() || null
    if (values.emailVerified !== undefined) user.emailVerified = values.emailVerified
    if (values.status !== undefined) user.status = values.status
    if (values.email !== undefined && values.email.trim().toLowerCase() !== user.email) {
      user.email = values.email.trim().toLowerCase()
      user.emailVerified = false
      user.status = 'PENDING'
    }
    return this.toAccount(await this.users.save(user))
  }

  async updateManagedUserStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'): Promise<UserAccount | null> {
    const user = await this.users.createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where("user.id = :id AND user.role IN ('STAFF', 'MANAGER') AND user.deleted_at IS NULL", { id })
      .getOne()
    if (!user) return null
    user.status = status
    return this.toAccount(await this.users.save(user))
  }

  async promoteStaffToManager(id: string): Promise<UserIdentity | null> {
    const result = await this.users.createQueryBuilder()
      .update(UserEntity)
      .set({ role: 'MANAGER' })
      .where(
        "id = :id AND role = 'STAFF' AND status = 'ACTIVE' AND email_verified = true AND deleted_at IS NULL",
        { id },
      )
      .execute()
    if (!result.affected) return null
    return this.findIdentityById(id)
  }

  async softDeleteManagedUser(id: string): Promise<boolean> {
    const result = await this.users.createQueryBuilder()
      .update(UserEntity)
      .set({ status: 'INACTIVE', deletedAt: new Date() })
      .where("id = :id AND role IN ('STAFF', 'MANAGER') AND deleted_at IS NULL", { id })
      .execute()
    return Boolean(result.affected)
  }

  async updateLastLogin(id: string, at: Date): Promise<void> {
    await this.users.update({ id, status: 'ACTIVE', deletedAt: IsNull() }, { lastLoginAt: at })
  }

  private toAccount(user: UserEntity): UserAccount {
    return {
      ...this.toIdentity(user),
      passwordHash: user.passwordHash,
      updatedAt: user.updatedAt,
    }
  }

  private toIdentity(user: UserEntity): UserIdentity {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: [user.firstName, user.lastName].filter(Boolean).join(' '),
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      permissions: user.role === 'STAFF' ? [...STAFF_OPERATIONAL_PERMISSION_KEYS] : user.permissions as StaffPermission[],
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    }
  }
}
