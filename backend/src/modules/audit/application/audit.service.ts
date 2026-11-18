import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AuditLogEntity } from '../infrastructure/persistence/typeorm/audit-log.entity'

export interface AuditRecord {
  actorUserId?: string | null
  actorName?: string | null
  action: string
  targetResource: string
  targetId?: string | null
  metadata?: Record<string, string | number | boolean | null>
}

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLogEntity) private readonly logs: Repository<AuditLogEntity>) {}

  async record(record: AuditRecord): Promise<void> {
    await this.logs.insert({
      actorUserId: record.actorUserId ?? null,
      actorName: record.actorName ?? null,
      action: record.action,
      targetResource: record.targetResource,
      targetId: record.targetId ?? null,
      metadata: record.metadata ?? {},
    })
  }

  async list(options: {
    page: number
    pageSize: number
    action?: string
    actorUserId?: string
    targetResource?: string
  }) {
    const query = this.logs.createQueryBuilder('log')
    if (options.action) query.andWhere('log.action ILIKE :action', { action: `%${options.action}%` })
    if (options.actorUserId) query.andWhere('log.actorUserId = :actorUserId', { actorUserId: options.actorUserId })
    if (options.targetResource) {
      query.andWhere('log.targetResource ILIKE :targetResource', { targetResource: `%${options.targetResource}%` })
    }
    const [items, total] = await query
      .orderBy('log.createdAt', 'DESC')
      .skip((options.page - 1) * options.pageSize)
      .take(options.pageSize)
      .getManyAndCount()
    return { items, total, page: options.page, pageSize: options.pageSize }
  }
}
