export const STAFF_OPERATIONAL_PERMISSION_KEYS = [
  'products.view',
  'products.create',
  'products.update',
  'products.delete',
  'products.manage',
  'media.upload',
  'inventory.view',
  'inventory.update',
  'orders.view',
  'orders.create',
  'orders.update',
  'orders.delete',
  'orders.status',
  'orders.contact',
  'payments.approve',
  'quotations.manage',
  'batches.view',
  'batches.manage',
  'batches.totals',
  'procurement.view',
  'procurement.manage',
  'reports.view',
  'announcements.view',
  'testimonials.view',
  'testimonials.create',
  'testimonials.update',
  'testimonials.delete',
  'categories.view',
  'categories.manage',
  'heroSlides.view',
  'heroSlides.manage',
] as const

export const STAFF_PERMISSION_KEYS = [
  ...STAFF_OPERATIONAL_PERMISSION_KEYS,
  'announcements.manage',
] as const

export type StaffPermission = typeof STAFF_PERMISSION_KEYS[number]
export type UserRole = 'MANAGER' | 'STAFF'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'

export const WORKER_ROLE_DEFINITIONS = [
  {
    id: 'SOURCING_AGENT',
    label: 'Sourcing Agent',
    description: 'Handles product sourcing, quotations, and customer communication',
    defaultPermissions: ['orders.view', 'orders.contact', 'quotations.manage', 'products.view'] as StaffPermission[],
  },
  {
    id: 'SHIPPING_AGENT',
    label: 'Shipping Agent',
    description: 'Manages freight batches, shipping logistics, and order fulfillment status',
    defaultPermissions: ['batches.view', 'batches.manage', 'batches.totals', 'orders.view', 'orders.update', 'orders.status'] as StaffPermission[],
  },
  {
    id: 'FINANCE',
    label: 'Finance',
    description: 'Reviews and approves payments, monitors batch totals and revenue reports',
    defaultPermissions: ['payments.approve', 'orders.view', 'batches.totals', 'reports.view'] as StaffPermission[],
  },
  {
    id: 'CUSTOMER_SUPPORT',
    label: 'Customer Support',
    description: 'Assists customers, updates order statuses, and inspects product catalog',
    defaultPermissions: ['orders.view', 'orders.contact', 'orders.status', 'products.view'] as StaffPermission[],
  },
  {
    id: 'STAFF',
    label: 'General Staff',
    description: 'General operational staff with customized individual permissions',
    defaultPermissions: ['orders.view', 'products.view', 'inventory.view'] as StaffPermission[],
  },
] as const

export interface UserAccount {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  passwordHash: string
  role: UserRole
  workerRole: string | null
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
  workerRole: string | null
  status: UserStatus
  emailVerified: boolean
  permissions: StaffPermission[]
  createdAt: Date
  lastLoginAt: Date | null
}
