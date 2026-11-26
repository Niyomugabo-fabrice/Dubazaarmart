import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common'
import type { Request } from 'express'
import type { StaffPermission, UserIdentity } from '../domain/user-account'

export const REQUIRED_ROLES = 'required_roles'
export const REQUIRED_PERMISSIONS = 'required_permissions'

export const Roles = (...roles: string[]) => SetMetadata(REQUIRED_ROLES, roles)
export const Permissions = (...permissions: StaffPermission[]) => SetMetadata(REQUIRED_PERMISSIONS, permissions)

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserIdentity | undefined => {
    const request = context.switchToHttp().getRequest<Request & { user?: UserIdentity }>()
    return request.user
  },
)
