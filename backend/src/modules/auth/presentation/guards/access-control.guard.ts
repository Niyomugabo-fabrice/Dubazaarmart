import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import type { StaffPermission, UserIdentity } from '../../domain/user-account'
import { REQUIRED_PERMISSIONS, REQUIRED_ROLES } from '../auth.decorators'

@Injectable()
export class AccessControlGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(REQUIRED_ROLES, [context.getHandler(), context.getClass()])
    const permissions = this.reflector.getAllAndOverride<StaffPermission[]>(REQUIRED_PERMISSIONS, [context.getHandler(), context.getClass()])
    const user = (context.switchToHttp().getRequest<Request>() as Request & { user?: UserIdentity }).user

    if (roles?.length && (!user || !roles.includes(user.role))) {
      throw new ForbiddenException('You do not have access to this resource.')
    }

    if (permissions?.length) {
      const granted = user?.role === 'MANAGER' ||
        permissions.every((permission) => (user?.permissions ?? []).includes(permission))
      if (!granted) throw new ForbiddenException('You do not have permission to perform this action.')
    }

    return true
  }
}
