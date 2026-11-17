import { createHash, randomUUID } from 'node:crypto'
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'
import bcrypt from 'bcryptjs'
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken'
import type { AdminAccount, AdminIdentity } from '../domain/admin-account'
import { ADMIN_REPOSITORY, type AdminRepository } from '../domain/auth.repository'
import { REFRESH_TOKEN_REPOSITORY, type RefreshTokenRepository } from '../domain/refresh-token.repository'

interface TokenClaims extends JwtPayload {
  id: string
  email: string
  name: string
  role: string
  tokenUse: 'access' | 'refresh'
}

@Injectable()
export class AuthService {
  private readonly accessSecret: string
  private readonly refreshSecret: string
  private readonly accessTtl: SignOptions['expiresIn']
  private readonly refreshTtl: SignOptions['expiresIn']
  private readonly refreshTtlMs: number

  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly admins: AdminRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    config: ConfigService,
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_SECRET')
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET')
    this.accessTtl = (config.get<string>('JWT_ACCESS_TTL') || '15m') as SignOptions['expiresIn']
    this.refreshTtl = (config.get<string>('JWT_REFRESH_TTL') || '30d') as SignOptions['expiresIn']
    this.refreshTtlMs = durationToMilliseconds(String(this.refreshTtl))
  }

  async login(email: string, password: string) {
    const admin = await this.admins.findByEmail(email.trim().toLowerCase())
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash)) || admin.role !== 'admin') {
      throw new UnauthorizedException('Invalid admin credentials. Please verify your email and password.')
    }
    const pair = this.createTokenPair(admin)
    await this.refreshTokens.save(pair.refreshRecord)
    return { success: true, token: pair.accessToken, refreshToken: pair.refreshToken, admin: this.identity(admin) }
  }

  async refresh(refreshToken: string) {
    const claims = this.verify(refreshToken, this.refreshSecret, 'refresh')
    if (!claims?.jti) throw new UnauthorizedException('Refresh token is invalid or expired.')
    const admin = await this.admins.findById(claims.id)
    if (!admin || admin.role !== 'admin') throw new UnauthorizedException('Refresh token is invalid or expired.')

    const next = this.createTokenPair(admin)
    const rotated = await this.refreshTokens.rotate(
      claims.jti,
      hashToken(refreshToken),
      next.refreshRecord,
    )
    if (!rotated) throw new UnauthorizedException('Refresh token has already been used or revoked.')
    return { success: true, token: next.accessToken, refreshToken: next.refreshToken, admin: this.identity(admin) }
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return
    const claims = this.verify(refreshToken, this.refreshSecret, 'refresh')
    if (claims?.jti) await this.refreshTokens.revoke(claims.jti, hashToken(refreshToken))
  }

  authenticateRequest(request: Request): AdminIdentity | null {
    const token = readToken(request)
    if (!token) return null
    const claims = this.verify(token, this.accessSecret, 'access')
    if (!claims || claims.role !== 'admin') return null
    return { id: claims.id, email: claims.email, name: claims.name, role: claims.role }
  }

  async verifyRequest(request: Request) {
    const admin = this.authenticateRequest(request)
    if (!admin) throw new UnauthorizedException('Authentication token required or expired.')
    return { authenticated: true, admin }
  }

  private createTokenPair(admin: AdminAccount) {
    const identity = this.identity(admin)
    const accessToken = jwt.sign({ ...identity, tokenUse: 'access' }, this.accessSecret, {
      expiresIn: this.accessTtl,
      issuer: 'dubazaarmart',
    })
    const tokenId = randomUUID()
    const refreshToken = jwt.sign({ ...identity, tokenUse: 'refresh' }, this.refreshSecret, {
      expiresIn: this.refreshTtl,
      issuer: 'dubazaarmart',
      jwtid: tokenId,
    })
    return {
      accessToken,
      refreshToken,
      refreshRecord: {
        id: tokenId,
        adminId: admin.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
      },
    }
  }

  private identity(admin: AdminAccount): AdminIdentity {
    return { id: admin.id, email: admin.email, name: admin.name || 'Admin', role: admin.role }
  }

  private verify(token: string, secret: string, tokenUse: TokenClaims['tokenUse']): TokenClaims | null {
    try {
      const claims = jwt.verify(token, secret, { issuer: 'dubazaarmart' }) as TokenClaims
      if (claims.tokenUse !== tokenUse || !claims.id || !claims.email || !claims.role) return null
      return claims
    } catch {
      return null
    }
  }
}

function readToken(request: Request): string | null {
  const authorization = request.headers.authorization
  if (authorization?.toLowerCase().startsWith('bearer ')) return authorization.slice(7).trim()
  const queryToken = typeof request.query.token === 'string' ? request.query.token : null
  if (queryToken) return queryToken
  const cookieHeader = request.headers.cookie || ''
  const cookieToken = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]+)/)?.[1]
  return typeof cookieToken === 'string' ? decodeURIComponent(cookieToken) : null
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function durationToMilliseconds(value: string): number {
  const match = value.match(/^(\d+)(s|m|h|d)$/)
  if (!match) throw new Error('JWT_REFRESH_TTL must use a duration such as 30d, 12h, or 15m.')
  const amount = Number(match[1])
  const unit = match[2]
  return amount * ({ s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 1)
}
