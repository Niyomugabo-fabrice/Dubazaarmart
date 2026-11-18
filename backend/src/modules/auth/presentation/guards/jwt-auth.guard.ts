import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'
import { AuthService } from '../../application/auth.service'
import type { UserIdentity } from '../../domain/user-account'

type AuthenticatedRequest = Request & { user?: UserIdentity }

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const user = await this.auth.authenticateRequest(request)
    if (!user) throw new UnauthorizedException('Authentication token required or expired.')
    ;(request as AuthenticatedRequest).user = user
    return true
  }
}
