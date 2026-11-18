import type { StaffPermission, UserAccount, UserIdentity, UserStatus } from './user-account'

export const USER_REPOSITORY = Symbol('USER_REPOSITORY')

export interface CreateUserRecord {
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string | null
  passwordHash: string
  status: UserStatus
  emailVerified?: boolean
  permissions?: StaffPermission[]
}

export interface UpdateStaffRecord {
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string | null
  permissions?: StaffPermission[]
  status?: UserStatus
}

export interface StaffListQuery {
  search?: string
  status?: UserStatus
  page: number
  pageSize: number
  sortBy: 'name' | 'email' | 'status' | 'createdAt' | 'lastLoginAt'
  sortOrder: 'ASC' | 'DESC'
}

export interface StaffListResult {
  items: UserIdentity[]
  total: number
  page: number
  pageSize: number
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserAccount | null>
  findById(id: string): Promise<UserAccount | null>
  findIdentityById(id: string): Promise<UserIdentity | null>
  listStaff(query: StaffListQuery): Promise<StaffListResult>
  createStaff(record: CreateUserRecord): Promise<UserAccount>
  updateStaff(id: string, values: UpdateStaffRecord): Promise<UserAccount | null>
  updateStatus(id: string, status: UserStatus): Promise<UserAccount | null>
  softDeleteStaff(id: string): Promise<boolean>
  updateLastLogin(id: string, at: Date): Promise<void>
}
