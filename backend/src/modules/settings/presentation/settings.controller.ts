import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { SettingsService } from '../application/settings.service'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { AccessControlGuard } from '../../auth/presentation/guards/access-control.guard'
import { Roles } from '../../auth/presentation/auth.decorators'

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
@Roles('admin')
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
