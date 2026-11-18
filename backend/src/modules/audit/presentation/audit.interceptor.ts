import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import type { Request } from 'express'
import { concatMap, Observable } from 'rxjs'
import type { UserIdentity } from '../../auth/domain/user-account'
import { AuditService } from '../application/audit.service'

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: UserIdentity }>()
    const method = request.method.toUpperCase()
    const path = request.route?.path ? `${request.baseUrl}${request.route.path}` : request.path
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    const isAdminRoute = path.startsWith('/api/v1/admin/')
    const isAdminProductCreation = method === 'POST' && /^\/api\/v1\/products\/?$/.test(path)
    const isMediaUpload = method === 'POST' && path === '/api/v1/media/upload'
    if (!isMutation || (!isAdminRoute && !isAdminProductCreation && !isMediaUpload)) return next.handle()

    const user = request.user
    const segments = path.split('/').filter(Boolean)
    const targetResource = segments[3] || segments[2] || 'admin'
    const rawTargetId = request.params.id || request.params.productId
    const targetId = typeof rawTargetId === 'string' ? rawTargetId : null
    return next.handle().pipe(concatMap(async (response) => {
      await this.audit.record({
        actorUserId: user?.id,
        actorName: user?.name,
        action: `${method.toLowerCase()}.${targetResource}`,
        targetResource,
        targetId,
        metadata: { method, path },
      })
      return response
    }))
  }
}
