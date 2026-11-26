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

    if (!user) {
      throw new ForbiddenException('You must be signed in to access this resource.')
    }

    if (roles?.length && !roles.includes(user.role)) {
      throw new ForbiddenException('You do not have access to this resource.')
    }

    // The Manager has full access to everything
    if (user.role === 'MANAGER') {
      return true
    }

    if (permissions?.length) {
      const userPermissions = Array.isArray(user.permissions) ? user.permissions : []
      const hasAllRequired = permissions.every((required) => checkPermission(userPermissions, required))
      if (!hasAllRequired) {
        throw new ForbiddenException('You do not have permission to perform this action.')
      }
    }

    return true
  }
}

function checkPermission(userPermissions: string[], required: string): boolean {
  if (userPermissions.includes(required)) return true

  // Product management aliases
  if (required.startsWith('products.') && userPermissions.includes('products.manage')) {
    return true
  }

  // Batch management aliases
  if (required.startsWith('batches.') && userPermissions.includes('batches.manage')) {
    return true
  }

  // Order status alias
  if (required === 'orders.status' && (userPermissions.includes('orders.update') || userPermissions.includes('orders.status'))) {
    return true
  }

  // Payment approval alias
  if (required === 'payments.approve' && (userPermissions.includes('payments.approve') || userPermissions.includes('orders.update'))) {
    return true
  }

  // Customer contact alias
  if (required === 'orders.contact' && (userPermissions.includes('orders.contact') || userPermissions.includes('orders.view') || userPermissions.includes('orders.update'))) {
    return true
  }

  // Media upload alias (staff managing products can upload media)
  if (required === 'media.upload' && (userPermissions.includes('media.upload') || userPermissions.includes('products.manage'))) {
    return true
  }

  // Procurement management alias
  if (required === 'procurement.view' && userPermissions.includes('procurement.manage')) {
    return true
  }

  return false
}
