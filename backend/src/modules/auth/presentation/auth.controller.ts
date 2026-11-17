import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { AuthService } from '../application/auth.service'
import { LoginDto } from './dto/login.dto'
import { RefreshDto } from './dto/refresh.dto'
import { Roles } from './auth.decorators'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { AccessControlGuard } from './guards/access-control.guard'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Sign in an administrator' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password)
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
  @Roles('admin')
  @ApiOperation({ summary: 'Verify the current administrator access token' })
  verify(@Req() request: Request) {
    return this.auth.verifyRequest(request)
  }
}
