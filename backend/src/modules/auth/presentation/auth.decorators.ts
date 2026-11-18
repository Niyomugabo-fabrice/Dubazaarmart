import { SetMetadata } from '@nestjs/common'
import type { StaffPermission } from '../domain/user-account'

export const REQUIRED_ROLES = 'required_roles'
export const REQUIRED_PERMISSIONS = 'required_permissions'

export const Roles = (...roles: string[]) => SetMetadata(REQUIRED_ROLES, roles)
export const Permissions = (...permissions: StaffPermission[]) => SetMetadata(REQUIRED_PERMISSIONS, permissions)
