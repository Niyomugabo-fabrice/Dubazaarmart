import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { AdminAccount } from '../../../domain/admin-account'
import type { AdminRepository } from '../../../domain/auth.repository'
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
