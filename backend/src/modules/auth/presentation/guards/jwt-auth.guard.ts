import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'
import { AuthService } from '../../application/auth.service'
import type { AdminIdentity } from '../../domain/admin-account'

type AuthenticatedRequest = Request & { user?: AdminIdentity }

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const admin = this.auth.authenticateRequest(request)
    if (!admin) throw new UnauthorizedException('Admin authentication token required or expired.')
    ;(request as AuthenticatedRequest).user = admin
    return true
  }
}
