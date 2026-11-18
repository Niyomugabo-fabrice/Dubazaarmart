import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { SettingsService } from '../application/settings.service'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { AccessControlGuard } from '../../auth/presentation/guards/access-control.guard'
import { Roles } from '../../auth/presentation/auth.decorators'
import { AuthService } from '../../auth/application/auth.service'
import { RegisterStaffDto } from '../../auth/presentation/dto/register-staff.dto'
import type { Request } from 'express'
import { AuditService } from '../../audit/application/audit.service'

@ApiTags('settings')
@Controller('settings')
export class PublicSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  getSettings() {
    return this.settings.getPublicSettings()
  }
}

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('MANAGER')
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Post()
  update(@Body() body: Record<string, unknown>) {
    return this.settings.updateSettings(body ?? {})
  }
}

@ApiTags('announcements')
@Controller('announcements/active')
export class ActiveAnnouncementsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  getActive() {
    return this.settings.getActiveAnnouncements()
  }
}

@ApiTags('auth')
@Controller('auth')
export class StaffRegistrationController {
  constructor(
    private readonly auth: AuthService,
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterStaffDto, @Req() request: Request) {
    const allowed = await this.settings.isStaffRegistrationAllowed()
    const result = await this.auth.registerStaff(dto, request.ip || request.socket.remoteAddress || 'unknown', allowed)
    await this.audit.record({
      actorName: dto.email.trim().toLowerCase(),
      action: 'auth.staff-registration.pending',
      targetResource: 'auth',
      metadata: { status: 'PENDING' },
    })
    return result
  }
}
