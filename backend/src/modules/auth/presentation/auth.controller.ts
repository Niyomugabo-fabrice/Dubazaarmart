import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { AuthService } from '../application/auth.service'
import { AuditService } from '../../audit/application/audit.service'
import { LoginDto } from './dto/login.dto'
import { Roles } from './auth.decorators'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { AccessControlGuard } from './guards/access-control.guard'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Sign in a MANAGER or active STAFF account' })
  async login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    assertTrustedOrigin(request, this.config)
    let result: Awaited<ReturnType<AuthService['login']>>
    try {
      result = await this.auth.login(
        dto.email,
        dto.password,
        request.ip || request.socket.remoteAddress || 'unknown',
      )
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        await this.audit.record({
          actorName: dto.email.trim().toLowerCase(),
          action: 'auth.login.failure',
          targetResource: 'auth',
          metadata: { ip: request.ip || request.socket.remoteAddress || 'unknown' },
        })
      }
      throw error
    }

    await this.audit.record({
      actorUserId: result.user.id,
      actorName: result.user.email,
      action: 'auth.login.success',
      targetResource: 'auth',
      targetId: result.user.id,
      metadata: { role: result.user.role },
    })
    setRefreshCookie(response, result.refreshToken, this.auth.getRefreshTtlMs(), isProduction(this.config))
    return { success: result.success, token: result.token, user: result.user }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh an access token using the HttpOnly refresh cookie' })
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    assertTrustedOrigin(request, this.config)
    let result: Awaited<ReturnType<AuthService['refresh']>>
    try {
      result = await this.auth.refresh(readRefreshCookie(request))
    } catch (error) {
      if (error instanceof UnauthorizedException) clearRefreshCookie(response, isProduction(this.config))
      throw error
    }
    setRefreshCookie(response, result.refreshToken, this.auth.getRefreshTtlMs(), isProduction(this.config))
    return { success: result.success, token: result.token, user: result.user }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Clear the current refresh cookie' })
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    assertTrustedOrigin(request, this.config)
    await this.auth.logout()
    clearRefreshCookie(response, isProduction(this.config))
    return { success: true, message: 'Session ended successfully.' }
  }

  @Get('verify')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AccessControlGuard)
  @Roles('MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Verify the current manager or staff access token' })
  verify(@Req() request: Request) {
    return this.auth.verifyRequest(request)
  }
}

function assertTrustedOrigin(request: Request, config: ConfigService): void {
  const origin = request.headers.origin
  const trustedOrigins = (config.get<string>('FRONTEND_URL') || '')
    .split(',')
    .map(normalizeOrigin)
    .filter((value): value is string => value !== null)
  const isLocalDevelopmentOrigin = config.get<string>('NODE_ENV') !== 'production' &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '')
  if (!origin || (!trustedOrigins.includes(origin) && !isLocalDevelopmentOrigin)) {
    throw new UnauthorizedException('Request origin is not allowed.')
  }
}

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value.trim()).origin
  } catch {
    return null
  }
}

function readRefreshCookie(request: Request): string {
  const cookie = request.headers.cookie?.match(/(?:^|;\s*)admin_refresh=([^;]+)/)?.[1]
  if (!cookie) throw new UnauthorizedException('Refresh cookie is missing or expired.')
  return cookie
}

function setRefreshCookie(response: Response, token: string, maxAge: number, production: boolean): void {
  response.cookie('admin_refresh', token, {
    httpOnly: true,
    secure: production,
    sameSite: production ? 'none' : 'lax',
    path: '/api/v1/auth',
    maxAge,
  })
}

function clearRefreshCookie(response: Response, production: boolean): void {
  response.clearCookie('admin_refresh', {
    httpOnly: true,
    secure: production,
    sameSite: production ? 'none' : 'lax',
    path: '/api/v1/auth',
  })
}

function isProduction(config: ConfigService): boolean {
  return config.get<string>('NODE_ENV') === 'production'
}
