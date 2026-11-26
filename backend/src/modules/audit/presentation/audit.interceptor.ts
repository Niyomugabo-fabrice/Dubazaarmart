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
    const request = context.switchToHttp().getRequest<Request & { user?: UserIdentity; auditLogged?: boolean }>()
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
      // If controller or service already recorded a specific audit action, skip duplicate generic record
      if (request.auditLogged) {
        return response
      }

      const target = describeTarget(response)
      await this.audit.record({
        actorUserId: user?.id,
        actorName: user?.name,
        action: `${method.toLowerCase()}.${targetResource}`,
        targetResource,
        targetId,
        recordNumber: target.label || targetId,
        metadata: {
          method,
          path,
          ...(target.label ? { targetLabel: target.label } : {}),
          ...(target.detail ? { targetDetail: target.detail } : {}),
        },
      })
      return response
    }))
  }
}

function describeTarget(response: unknown): { label: string | null; detail: string | null } {
  if (!response || typeof response !== 'object') return { label: null, detail: null }
  const record = response as Record<string, unknown>
  const label = firstText(record.name, record.title, record.poNumber, record.orderNumber, record.customerName)
  const detail = firstText(record.email, record.sku)
  return { label, detail }
}

function firstText(...values: unknown[]): string | null {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? null
}
