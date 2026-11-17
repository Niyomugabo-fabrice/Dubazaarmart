import type { AdminAccount } from './admin-account'

export const ADMIN_REPOSITORY = Symbol('ADMIN_REPOSITORY')

export interface AdminRepository {
  findByEmail(email: string): Promise<AdminAccount | null>
  findById(id: string): Promise<AdminAccount | null>
}
