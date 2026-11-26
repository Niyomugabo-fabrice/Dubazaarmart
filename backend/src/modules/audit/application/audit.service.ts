import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AuditLogEntity } from '../infrastructure/persistence/typeorm/audit-log.entity'
import type { UserIdentity } from '../../auth/domain/user-account'

export interface AuditRecord {
  actorUserId?: string | null
  actorName?: string | null
  action: string
  targetResource: string
  targetId?: string | null
  recordNumber?: string | null
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  metadata?: Record<string, unknown>
}

export interface AuditLogFilterOptions {
  page: number
  pageSize: number
  action?: string
  worker?: string
  actorUserId?: string
  targetResource?: string
  recordNumber?: string
  startDate?: string
  endDate?: string
}

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLogEntity) private readonly logs: Repository<AuditLogEntity>) {}

  /**
   * Main reusable method to record an activity event in the database.
   * Can be called by any module, controller, or service.
   */
  async record(record: AuditRecord): Promise<void> {
    await this.logs.insert({
      actorUserId: record.actorUserId ?? null,
      actorName: record.actorName ?? null,
      action: record.action,
      targetResource: record.targetResource,
      targetId: record.targetId ?? null,
      recordNumber: record.recordNumber ?? null,
      oldValues: (record.oldValues ?? null) as any,
      newValues: (record.newValues ?? null) as any,
      metadata: (record.metadata ?? {}) as any,
    })
  }

  /**
   * Convenience helper to record an action with an actor identity.
   */
  async logEvent(options: {
    actor?: UserIdentity | { id?: string; name?: string; email?: string } | null
    action: string
    targetResource: string
    targetId?: string | null
    recordNumber?: string | null
    oldValues?: Record<string, unknown> | null
    newValues?: Record<string, unknown> | null
    metadata?: Record<string, unknown>
  }): Promise<void> {
    const actorName = options.actor
      ? 'name' in options.actor && options.actor.name
        ? options.actor.name
        : 'email' in options.actor && options.actor.email
          ? options.actor.email
          : 'User'
      : null

    await this.record({
      actorUserId: options.actor?.id ?? null,
      actorName,
      action: options.action,
      targetResource: options.targetResource,
      targetId: options.targetId ?? null,
      recordNumber: options.recordNumber ?? null,
      oldValues: options.oldValues ?? null,
      newValues: options.newValues ?? null,
      metadata: options.metadata ?? {},
    })
  }

  /**
   * Helper for Quotations actions (reusable for Sourcing and Shipping quotations)
   */
  async logQuotationEvent(options: {
    actor?: UserIdentity | null
    action: 'quotations.created' | 'quotations.sent' | 'quotations.negotiated' | 'quotations.accepted' | 'quotations.rejected' | string
    quotationId: string
    quotationNumber?: string
    customerEmail?: string
    oldValues?: Record<string, unknown> | null
    newValues?: Record<string, unknown> | null
    metadata?: Record<string, unknown>
  }): Promise<void> {
    await this.logEvent({
      actor: options.actor,
      action: options.action,
      targetResource: 'quotations',
      targetId: options.quotationId,
      recordNumber: options.quotationNumber || options.quotationId,
      oldValues: options.oldValues,
      newValues: options.newValues,
      metadata: {
        customerEmail: options.customerEmail,
        ...options.metadata,
      },
    })
  }

  /**
   * Helper for Freight Batch actions (reusable for Sea and Air freight batches)
   */
  async logBatchEvent(options: {
    actor?: UserIdentity | null
    action: 'batches.created' | 'batches.opened' | 'batches.shipped' | 'batches.closed' | 'batches.totals_calculated' | string
    batchId: string
    batchNumber: string
    oldValues?: Record<string, unknown> | null
    newValues?: Record<string, unknown> | null
    metadata?: Record<string, unknown>
  }): Promise<void> {
    await this.logEvent({
      actor: options.actor,
      action: options.action,
      targetResource: 'batches',
      targetId: options.batchId,
      recordNumber: options.batchNumber,
      oldValues: options.oldValues,
      newValues: options.newValues,
      metadata: options.metadata,
    })
  }

  /**
   * Utility helper to calculate field differences between old and new state.
   */
  static diff(
    oldState: Record<string, unknown>,
    newState: Record<string, unknown>,
    monitoredKeys?: string[],
  ): { oldValues: Record<string, unknown>; newValues: Record<string, unknown>; changed: boolean } {
    const oldValues: Record<string, unknown> = {}
    const newValues: Record<string, unknown> = {}
    let changed = false

    const keys = monitoredKeys || Array.from(new Set([...Object.keys(oldState), ...Object.keys(newState)]))

    for (const key of keys) {
      const prev = oldState[key]
      const next = newState[key]
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        oldValues[key] = prev
        newValues[key] = next
        changed = true
      }
    }

    return { oldValues, newValues, changed }
  }

  /**
   * Filterable query for Manager activity log view.
   */
  async list(options: AuditLogFilterOptions) {
    const query = this.logs.createQueryBuilder('log')

    if (options.action) {
      query.andWhere('log.action ILIKE :action', { action: `%${options.action}%` })
    }

    if (options.worker) {
      query.andWhere(
        '(log.actorName ILIKE :worker OR log.actorUserId::text ILIKE :worker)',
        { worker: `%${options.worker}%` },
      )
    } else if (options.actorUserId) {
      query.andWhere('log.actorUserId = :actorUserId', { actorUserId: options.actorUserId })
    }

    if (options.targetResource) {
      query.andWhere('log.targetResource ILIKE :targetResource', { targetResource: `%${options.targetResource}%` })
    }

    if (options.recordNumber) {
      query.andWhere(
        '(log.recordNumber ILIKE :recordNumber OR log.targetId ILIKE :recordNumber OR log.metadata->>\'orderNumber\' ILIKE :recordNumber OR log.metadata->>\'batchNumber\' ILIKE :recordNumber)',
        { recordNumber: `%${options.recordNumber}%` },
      )
    }

    if (options.startDate) {
      const start = new Date(options.startDate)
      if (!Number.isNaN(start.getTime())) {
        query.andWhere('log.createdAt >= :startDate', { startDate: start })
      }
    }

    if (options.endDate) {
      const end = new Date(options.endDate)
      if (!Number.isNaN(end.getTime())) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(options.endDate.trim())) {
          end.setHours(23, 59, 59, 999)
        }
        query.andWhere('log.createdAt <= :endDate', { endDate: end })
      }
    }

    const [items, total] = await query
      .orderBy('log.createdAt', 'DESC')
      .skip((options.page - 1) * options.pageSize)
      .take(options.pageSize)
      .getManyAndCount()

    return { items, total, page: options.page, pageSize: options.pageSize }
  }
}
