import { BadRequestException } from '@nestjs/common'

export function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  if ('code' in error && error.code === '23505') return true
  if ('driverError' in error && typeof error.driverError === 'object' && error.driverError !== null) {
    return 'code' in error.driverError && error.driverError.code === '23505'
  }
  return false
}

export function validatePassword(password: string): void {
  if (password.length < 12) throw new BadRequestException('Password must be at least 12 characters long.')
  if (Buffer.byteLength(password, 'utf8') > 72) throw new BadRequestException('Password must be at most 72 bytes.')
}
