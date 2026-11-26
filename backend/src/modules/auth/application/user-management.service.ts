import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import bcrypt from 'bcryptjs'
import { WORKER_ROLE_DEFINITIONS, type UserIdentity, type UserStatus } from '../domain/user-account'
import { USER_REPOSITORY, type UserRepository } from '../domain/user.repository'
import type { CreateStaffDto, ListStaffQueryDto, UpdateStaffDto } from '../presentation/dto/create-staff.dto'
import { isUniqueViolation, validatePassword } from './user-validation'
import { AuditService } from '../../audit/application/audit.service'
import type { UserAccount } from '../domain/user-account'

@Injectable()
export class UserManagementService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly audit: AuditService,
  ) {}

  async listManagedUsers(actor: UserIdentity, query: ListStaffQueryDto) {
    this.assertManager(actor)
    return this.users.listManagedUsers({
      search: query.search?.trim(),
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    })
  }

  async getManagedUser(actor: UserIdentity, id: string): Promise<UserIdentity> {
    this.assertManager(actor)
    const user = await this.users.findById(id)
    if (!user || !isManagedRole(user.role)) throw new NotFoundException('Managed account not found.')
    return identityOf(user)
  }

  async createStaff(actor: UserIdentity, dto: CreateStaffDto): Promise<UserIdentity> {
    this.assertManager(actor)
    const email = dto.email.trim().toLowerCase()
    if (await this.users.findByEmail(email)) throw new ConflictException('An account already exists for this email.')
    validatePassword(dto.password)
    const status = dto.status ?? 'PENDING'
    const workerRole = dto.workerRole || 'STAFF'

    let permissions = dto.permissions
    if (!permissions || permissions.length === 0) {
      const preset = WORKER_ROLE_DEFINITIONS.find((def) => def.id === workerRole)
      permissions = preset ? [...preset.defaultPermissions] : []
    }

    try {
      const user = await this.users.createStaff({
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email,
        phoneNumber: dto.phoneNumber,
        passwordHash: await bcrypt.hash(dto.password, 12),
        workerRole,
        status,
        emailVerified: status === 'ACTIVE',
        permissions,
      })

      await this.audit.record({
        actorUserId: actor.id,
        actorName: actor.name,
        action: 'staff.created',
        targetResource: 'staff',
        targetId: user.id,
        recordNumber: user.email,
        newValues: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          workerRole: user.workerRole,
          permissions: user.permissions,
          status: user.status,
        },
      })

      return identityOf(user)
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('An account already exists for this email.')
      throw error
    }
  }

  async updateManagedUser(actor: UserIdentity, id: string, dto: UpdateStaffDto): Promise<UserIdentity> {
    this.assertManager(actor)
    if (!Object.keys(dto).length) throw new BadRequestException('No user fields were provided.')
    if (dto.email) {
      const existing = await this.users.findByEmail(dto.email.trim().toLowerCase())
      if (existing && existing.id !== id) throw new ConflictException('An account already exists for this email.')
    }

    const existing = await this.users.findById(id)
    if (!existing) throw new NotFoundException('Managed account not found.')

    try {
      const user = await this.users.updateManagedUser(id, dto)
      if (!user) throw new NotFoundException('Managed account not found.')

      const changes = AuditService.diff(
        {
          role: existing.role,
          workerRole: existing.workerRole,
          permissions: existing.permissions,
          status: existing.status,
          email: existing.email,
        },
        {
          role: user.role,
          workerRole: user.workerRole,
          permissions: user.permissions,
          status: user.status,
          email: user.email,
        },
      )

      const isPermissionChange = changes.oldValues.permissions !== undefined || changes.oldValues.workerRole !== undefined
      const action = isPermissionChange ? 'staff.permissions_changed' : 'staff.updated'

      await this.audit.record({
        actorUserId: actor.id,
        actorName: actor.name,
        action,
        targetResource: 'staff',
        targetId: user.id,
        recordNumber: user.email,
        oldValues: changes.oldValues,
        newValues: changes.newValues,
      })

      return identityOf(user)
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('An account already exists for this email.')
      throw error
    }
  }

  async verifyManagedUser(actor: UserIdentity, id: string): Promise<UserIdentity> {
    this.assertManager(actor)
    const user = await this.users.updateManagedUser(id, { emailVerified: true })
    if (!user) throw new NotFoundException('Managed account not found.')

    await this.audit.record({
      actorUserId: actor.id,
      actorName: actor.name,
      action: 'staff.verified',
      targetResource: 'staff',
      targetId: user.id,
      recordNumber: user.email,
      newValues: { emailVerified: true },
    })

    return identityOf(user)
  }

  async promoteStaffToManager(actor: UserIdentity, id: string): Promise<UserIdentity> {
    this.assertManager(actor)
    const target = await this.users.findById(id)
    if (!target || target.role !== 'STAFF') throw new NotFoundException('User account not found.')
    if (target.status !== 'ACTIVE' || !target.emailVerified) {
      throw new BadRequestException('Only active, verified users can be promoted to manager.')
    }
    const promoted = await this.users.promoteStaffToManager(id)
    if (!promoted) throw new ConflictException('This user account can no longer be promoted.')

    await this.audit.record({
      actorUserId: actor.id,
      actorName: actor.name,
      action: 'staff.promoted_manager',
      targetResource: 'staff',
      targetId: id,
      recordNumber: target.email,
      oldValues: { role: 'STAFF' },
      newValues: { role: 'MANAGER' },
    })

    return promoted
  }

  activateManagedUser(actor: UserIdentity, id: string) {
    return this.updateStatus(actor, id, 'ACTIVE')
  }

  deactivateManagedUser(actor: UserIdentity, id: string) {
    return this.updateStatus(actor, id, 'INACTIVE')
  }

  suspendManagedUser(actor: UserIdentity, id: string) {
    return this.updateStatus(actor, id, 'SUSPENDED')
  }

  async deleteManagedUser(actor: UserIdentity, id: string) {
    this.assertManager(actor)
    if (actor.id === id) throw new ForbiddenException('You cannot delete your own account.')
    const target = await this.users.findById(id)
    if (!target || !isManagedRole(target.role)) throw new NotFoundException('Managed account not found.')
    if (!(await this.users.softDeleteManagedUser(id))) throw new NotFoundException('Managed account not found.')

    await this.audit.record({
      actorUserId: actor.id,
      actorName: actor.name,
      action: 'staff.deleted',
      targetResource: 'staff',
      targetId: id,
      recordNumber: target.email,
      oldValues: {
        email: target.email,
        role: target.role,
        workerRole: target.workerRole,
        status: target.status,
      },
      newValues: { status: 'DELETED' },
    })

    return {
      success: true,
      name: [target.firstName, target.lastName].filter(Boolean).join(' '),
      email: target.email,
    }
  }

  private async updateStatus(actor: UserIdentity, id: string, status: UserStatus): Promise<UserIdentity> {
    this.assertManager(actor)
    if (actor.id === id && status !== 'ACTIVE') {
      throw new ForbiddenException('You cannot deactivate or suspend your own account.')
    }
    const existing = await this.users.findById(id)
    if (!existing) throw new NotFoundException('Managed account not found.')

    const user = await this.users.updateManagedUserStatus(id, status)
    if (!user) throw new NotFoundException('Managed account not found.')

    const action = status === 'INACTIVE'
      ? 'staff.deactivated'
      : status === 'ACTIVE'
        ? 'staff.activated'
        : 'staff.status_changed'

    await this.audit.record({
      actorUserId: actor.id,
      actorName: actor.name,
      action,
      targetResource: 'staff',
      targetId: id,
      recordNumber: existing.email,
      oldValues: { status: existing.status },
      newValues: { status },
    })

    return identityOf(user)
  }

  private assertManager(actor: UserIdentity): void {
    if (actor.role !== 'MANAGER') throw new ForbiddenException('Only a MANAGER can manage user accounts.')
  }
}

function isManagedRole(role: UserIdentity['role']): boolean {
  return role === 'MANAGER' || role === 'STAFF'
}

function identityOf(user: UserAccount): UserIdentity {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    workerRole: user.workerRole,
    status: user.status,
    emailVerified: user.emailVerified,
    permissions: user.permissions,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  }
}
