import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { AuthService } from '../application/auth.service'
import { LoginDto } from './dto/login.dto'
import { RefreshDto } from './dto/refresh.dto'
import { CreateAdminDto } from './dto/create-admin.dto'
import { Roles } from './auth.decorators'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { AccessControlGuard } from './guards/access-control.guard'
import type { AdminIdentity } from '../domain/admin-account'

type AuthenticatedRequest = Request & { user: AdminIdentity }

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Sign in an administrator' })
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.auth.login(dto.email, dto.password, request.ip || request.socket.remoteAddress || 'unknown')
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate an administrator refresh token' })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken)
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke a refresh token and end the local session' })
  async logout(@Body() body: Partial<RefreshDto>) {
    await this.auth.logout(body?.refreshToken)
    return { success: true, message: 'Admin session ended successfully' }
  }

  @Get('verify')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AccessControlGuard)
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Verify the current administrator or staff access token' })
  verify(@Req() request: Request) {
    return this.auth.verifyRequest(request)
  }

  @Post('admins')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AccessControlGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Provision a new administrator or staff account (Admin only)' })
  createAdmin(@Req() request: Request, @Body() dto: CreateAdminDto) {
    const creator = (request as AuthenticatedRequest).user
    return this.auth.createAdmin(creator, dto)
  }

  @Get('admins')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AccessControlGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List all administrator and staff accounts (Admin only)' })
  listAdmins(@Req() request: Request) {
    const requester = (request as AuthenticatedRequest).user
    return this.auth.listAdmins(requester)
  }
}
