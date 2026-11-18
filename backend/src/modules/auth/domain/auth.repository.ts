import type { AdminAccount, AdminIdentity } from './admin-account'

export const ADMIN_REPOSITORY = Symbol('ADMIN_REPOSITORY')

export interface CreateAdminRecord {
  id?: string
  email: string
  name: string
  passwordHash: string
  role?: string
}

export interface AdminRepository {
  findByEmail(email: string): Promise<AdminAccount | null>
  findById(id: string): Promise<AdminAccount | null>
  create(record: CreateAdminRecord): Promise<AdminAccount>
  list(): Promise<AdminIdentity[]>
}
