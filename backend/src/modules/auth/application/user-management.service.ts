import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import bcrypt from 'bcryptjs'
import type { StaffPermission, UserIdentity, UserStatus } from '../domain/user-account'
import { USER_REPOSITORY, type UserRepository } from '../domain/user.repository'
import type { CreateStaffDto, ListStaffQueryDto, UpdateStaffDto } from '../presentation/dto/create-staff.dto'
import { isUniqueViolation, validatePassword } from './user-validation'

@Injectable()
export class UserManagementService {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async listStaff(actor: UserIdentity, query: ListStaffQueryDto) {
    this.assertManager(actor)
    return this.users.listStaff({
      search: query.search?.trim(),
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    })
  }

  async getStaff(actor: UserIdentity, id: string): Promise<UserIdentity> {
    this.assertManager(actor)
    const user = await this.users.findById(id)
    if (!user || user.role !== 'STAFF') throw new NotFoundException('Staff account not found.')
    return identityOf(user)
  }

  async createStaff(actor: UserIdentity, dto: CreateStaffDto): Promise<UserIdentity> {
    this.assertManager(actor)
    const email = dto.email.trim().toLowerCase()
    if (await this.users.findByEmail(email)) throw new ConflictException('An account already exists for this email.')
    validatePassword(dto.password)

    try {
      const user = await this.users.createStaff({
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email,
        phoneNumber: dto.phoneNumber,
        passwordHash: await bcrypt.hash(dto.password, 12),
        status: dto.status ?? 'PENDING',
        emailVerified: dto.status === 'ACTIVE',
        permissions: dto.permissions,
      })
      return identityOf(user)
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('An account already exists for this email.')
      throw error
    }
  }

  async updateStaff(actor: UserIdentity, id: string, dto: UpdateStaffDto): Promise<UserIdentity> {
    this.assertManager(actor)
    if (!Object.keys(dto).length) throw new BadRequestException('No staff fields were provided.')
    if (dto.email) {
      const existing = await this.users.findByEmail(dto.email.trim().toLowerCase())
      if (existing && existing.id !== id) throw new ConflictException('An account already exists for this email.')
    }
    try {
      const user = await this.users.updateStaff(id, dto)
      if (!user) throw new NotFoundException('Staff account not found.')
      return identityOf(user)
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('An account already exists for this email.')
      throw error
    }
  }

  async updatePermissions(actor: UserIdentity, id: string, permissions: StaffPermission[]): Promise<UserIdentity> {
    this.assertManager(actor)
    const user = await this.users.updateStaff(id, { permissions })
    if (!user) throw new NotFoundException('Staff account not found.')
    return identityOf(user)
  }

  activateStaff(actor: UserIdentity, id: string) {
    return this.updateStatus(actor, id, 'ACTIVE')
  }

  deactivateStaff(actor: UserIdentity, id: string) {
    return this.updateStatus(actor, id, 'INACTIVE')
  }

  suspendStaff(actor: UserIdentity, id: string) {
    return this.updateStatus(actor, id, 'SUSPENDED')
  }

  async deleteStaff(actor: UserIdentity, id: string) {
    this.assertManager(actor)
    if (actor.id === id) throw new ForbiddenException('You cannot delete your own account.')
    if (!(await this.users.softDeleteStaff(id))) throw new NotFoundException('Staff account not found.')
    return { success: true }
  }

  private async updateStatus(actor: UserIdentity, id: string, status: UserStatus): Promise<UserIdentity> {
    this.assertManager(actor)
    const user = await this.users.updateStatus(id, status)
    if (!user) throw new NotFoundException('Staff account not found.')
    return identityOf(user)
  }

  private assertManager(actor: UserIdentity): void {
    if (actor.role !== 'MANAGER') throw new ForbiddenException('Only a MANAGER can manage staff accounts.')
  }
}

function identityOf(user: {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  role: 'MANAGER' | 'STAFF'
  status: UserStatus
  emailVerified: boolean
  permissions: UserIdentity['permissions']
  createdAt: Date
  lastLoginAt: Date | null
}): UserIdentity {
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
    permissions: user.permissions,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  }
}
