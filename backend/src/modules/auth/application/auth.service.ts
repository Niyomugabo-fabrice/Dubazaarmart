import { createHash } from 'node:crypto'
import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'
import bcrypt from 'bcryptjs'
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken'
import type { UserIdentity } from '../domain/user-account'
import { USER_REPOSITORY, type UserRepository } from '../domain/user.repository'
import type { RegisterStaffDto } from '../presentation/dto/register-staff.dto'
import { isUniqueViolation, validatePassword } from './user-validation'

interface TokenClaims extends JwtPayload {
  sub: string
  tokenUse: 'access' | 'refresh'
}

@Injectable()
export class AuthService {
  private readonly attempts = new Map<string, { count: number; expiresAt: number }>()
  private attemptChecks = 0
  private readonly accessSecret: string
  private readonly refreshSecret: string
  private readonly accessTtl: SignOptions['expiresIn']
  private readonly refreshTtl: SignOptions['expiresIn']
  private readonly refreshTtlMs: number

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    config: ConfigService,
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_SECRET')
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET')
    this.accessTtl = (config.get<string>('JWT_ACCESS_TTL') || '15m') as SignOptions['expiresIn']
    this.refreshTtl = (config.get<string>('JWT_REFRESH_TTL') || '30d') as SignOptions['expiresIn']
    this.refreshTtlMs = durationToMilliseconds(String(this.refreshTtl))
  }

  async login(email: string, password: string, clientIp: string) {
    const normalizedEmail = email.trim().toLowerCase()
    const attemptKey = hashKey(`login\0${clientIp}\0${normalizedEmail}`)
    this.checkRateLimit(attemptKey, 10)

    const user = await this.users.findByEmail(normalizedEmail)
    if (!user || !(await bcrypt.compare(password, user.passwordHash)) || user.status !== 'ACTIVE' || !user.emailVerified) {
      throw new UnauthorizedException('Invalid email or password, or the account is not active.')
    }

    this.attempts.delete(attemptKey)
    const lastLoginAt = new Date()
    await this.users.updateLastLogin(user.id, lastLoginAt)
    const identity = identityOf({ ...user, lastLoginAt })
    const pair = this.createTokenPair(user.id)
    return { success: true, token: pair.accessToken, user: identity, refreshToken: pair.refreshToken }
  }

  async refresh(refreshToken: string) {
    const claims = this.verify(refreshToken, this.refreshSecret, 'refresh')
    if (!claims) throw new UnauthorizedException('Refresh token is invalid or expired.')
    const user = await this.users.findIdentityById(claims.sub)
    if (!isActiveUser(user)) throw new UnauthorizedException('Refresh token is invalid or expired.')
    const pair = this.createTokenPair(user.id)
    return { success: true, token: pair.accessToken, user, refreshToken: pair.refreshToken }
  }

  async logout(): Promise<void> {
    // Refresh tokens are stateless; the client clears the HttpOnly cookie.
  }

  async registerStaff(dto: RegisterStaffDto, clientIp: string, registrationEnabled: boolean) {
    if (!registrationEnabled) throw new ForbiddenException('User registration is currently disabled.')
    this.checkRateLimit(hashKey(`register\0${clientIp}`), 5)

    const email = dto.email.trim().toLowerCase()
    if (await this.users.findByEmail(email)) {
      throw new ConflictException('An account with this email already exists.')
    }
    validatePassword(dto.password)
    try {
      await this.users.createStaff({
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email,
        phoneNumber: dto.phoneNumber,
        passwordHash: await bcrypt.hash(dto.password, 12),
        status: 'PENDING',
        emailVerified: false,
        permissions: [],
      })
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('An account with this email already exists.')
      throw error
    }
    return {
      success: true,
      message: 'Registration submitted. A manager must activate your user account before you can sign in.',
    }
  }

  async authenticateRequest(request: Request): Promise<UserIdentity | null> {
    const token = readAccessToken(request)
    if (!token) return null
    const claims = this.verify(token, this.accessSecret, 'access')
    if (!claims) return null
    const user = await this.users.findIdentityById(claims.sub)
    return isActiveUser(user) ? user : null
  }

  verifyRequest(request: Request) {
    const user = (request as Request & { user?: UserIdentity }).user
    if (!user) throw new UnauthorizedException('Authentication token required or expired.')
    return { authenticated: true, user }
  }

  getRefreshTtlMs(): number {
    return this.refreshTtlMs
  }

  private createTokenPair(userId: string) {
    const accessToken = jwt.sign({ tokenUse: 'access' }, this.accessSecret, {
      subject: userId,
      expiresIn: this.accessTtl,
      issuer: 'dubazaarmart',
    })
    const refreshToken = jwt.sign({ tokenUse: 'refresh' }, this.refreshSecret, {
      subject: userId,
      expiresIn: this.refreshTtl,
      issuer: 'dubazaarmart',
    })
    return { accessToken, refreshToken }
  }

  private checkRateLimit(key: string, limit: number) {
    const now = Date.now()
    if (++this.attemptChecks >= 128) {
      for (const [attemptKey, attempt] of this.attempts) {
        if (attempt.expiresAt <= now) this.attempts.delete(attemptKey)
      }
      this.attemptChecks = 0
    }

    const attempt = this.attempts.get(key)
    if (attempt && attempt.expiresAt > now && attempt.count >= limit) {
      throw new HttpException(
        'Too many attempts. Please try again in 15 minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    if (this.attempts.size >= 10_000 && !attempt) {
      const oldestKey = this.attempts.keys().next().value
      if (oldestKey) this.attempts.delete(oldestKey)
    }
    this.attempts.set(key, {
      count: attempt && attempt.expiresAt > now ? attempt.count + 1 : 1,
      expiresAt: attempt && attempt.expiresAt > now ? attempt.expiresAt : now + 15 * 60_000,
    })
  }

  private verify(token: string, secret: string, tokenUse: TokenClaims['tokenUse']): TokenClaims | null {
    try {
      const claims = jwt.verify(token, secret, { issuer: 'dubazaarmart' })
      if (typeof claims !== 'object' || !claims.sub || claims.tokenUse !== tokenUse) return null
      return claims as TokenClaims
    } catch {
      return null
    }
  }
}

function isActiveUser(user: UserIdentity | null): user is UserIdentity {
  return Boolean(user && user.status === 'ACTIVE' && user.emailVerified && (user.role === 'MANAGER' || user.role === 'STAFF'))
}

function identityOf(user: {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  role: 'MANAGER' | 'STAFF'
  status: UserIdentity['status']
  emailVerified: boolean
  permissions: UserIdentity['permissions']
  createdAt: Date
  lastLoginAt: Date | null
}): UserIdentity {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: [user.firstName, user.lastName].filter(Boolean).join(' '),
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    permissions: user.permissions,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  }
}

function readAccessToken(request: Request): string | null {
  const authorization = request.headers.authorization
  if (!authorization?.toLowerCase().startsWith('bearer ')) return null
  return authorization.slice(7).trim() || null
}

function hashKey(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function durationToMilliseconds(value: string): number {
  const match = value.match(/^(\d+)(s|m|h|d)$/)
  if (!match) throw new Error('JWT_REFRESH_TTL must use a duration such as 30d, 12h, or 15m.')
  const amount = Number(match[1])
  const unit = match[2]
  return amount * ({ s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 1)
}
