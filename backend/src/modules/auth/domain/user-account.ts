export const STAFF_PERMISSION_KEYS = [
  'products.view',
  'products.create',
  'products.update',
  'products.delete',
  'media.upload',
  'inventory.view',
  'inventory.update',
  'orders.view',
  'orders.create',
  'orders.update',
  'orders.delete',
  'procurement.view',
  'procurement.manage',
  'reports.view',
  'announcements.view',
  'announcements.manage',
] as const

export type StaffPermission = typeof STAFF_PERMISSION_KEYS[number]
export type UserRole = 'MANAGER' | 'STAFF'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'

export interface UserAccount {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  passwordHash: string
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  permissions: StaffPermission[]
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date | null
}

export interface UserIdentity {
  id: string
  firstName: string
  lastName: string
  name: string
  email: string
  phoneNumber: string | null
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  permissions: StaffPermission[]
  createdAt: Date
  lastLoginAt: Date | null
}
