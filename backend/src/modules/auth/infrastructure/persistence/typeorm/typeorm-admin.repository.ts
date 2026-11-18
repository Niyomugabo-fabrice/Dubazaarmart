import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { AdminAccount, AdminIdentity } from '../../../domain/admin-account'
import type { AdminRepository, CreateAdminRecord } from '../../../domain/auth.repository'
import { AdminEntity } from './admin.entity'

@Injectable()
export class TypeOrmAdminRepository implements AdminRepository {
  constructor(@InjectRepository(AdminEntity) private readonly admins: Repository<AdminEntity>) {}

  async findByEmail(email: string): Promise<AdminAccount | null> {
    const admin = await this.admins.createQueryBuilder('admin')
      .addSelect('admin.passwordHash')
      .where('LOWER(admin.email) = LOWER(:email)', { email })
      .getOne()
    return admin ? this.toAccount(admin) : null
  }

  async findById(id: string): Promise<AdminAccount | null> {
    const admin = await this.admins.createQueryBuilder('admin')
      .addSelect('admin.passwordHash')
      .where('admin.id = :id', { id })
      .getOne()
    return admin ? this.toAccount(admin) : null
  }

  async create(record: CreateAdminRecord): Promise<AdminAccount> {
    const entity = this.admins.create({
      id: record.id || randomUUID(),
      email: record.email.trim().toLowerCase(),
      name: record.name.trim(),
      passwordHash: record.passwordHash,
      role: record.role || 'admin',
    })
    const saved = await this.admins.save(entity)
    return this.toAccount(saved)
  }

  async list(): Promise<AdminIdentity[]> {
    const rows = await this.admins.find({
      order: { createdAt: 'DESC' },
    })
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
    }))
  }

  private toAccount(admin: AdminEntity): AdminAccount {
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      passwordHash: admin.passwordHash,
    }
  }
}
