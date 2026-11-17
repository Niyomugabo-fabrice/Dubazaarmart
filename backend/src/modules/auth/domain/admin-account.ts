export interface AdminAccount {
  id: string
  email: string
  name: string
  role: string
  passwordHash: string
}

export interface AdminIdentity {
  id: string
  email: string
  name: string
  role: string
  permissions?: string[]
}
