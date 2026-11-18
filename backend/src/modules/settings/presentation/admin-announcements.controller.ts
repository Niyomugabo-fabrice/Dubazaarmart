import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { SettingsService } from '../application/settings.service'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { AccessControlGuard } from '../../auth/presentation/guards/access-control.guard'
import { Permissions, Roles } from '../../auth/presentation/auth.decorators'

@ApiTags('announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('MANAGER', 'STAFF')
@Controller('admin/announcements')
export class AdminAnnouncementsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @Permissions('announcements.view')
  list() {
    return this.settings.getAdminAnnouncements()
  }

  @Post()
  @Permissions('announcements.manage')
  create(@Body() body: Record<string, any>) {
    return this.settings.createAnnouncement(body ?? {})
  }

  @Patch(':id')
  @Permissions('announcements.manage')
  update(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.settings.updateAnnouncement(id, body ?? {})
  }

  @Delete(':id')
  @Permissions('announcements.manage')
  remove(@Param('id') id: string) {
    return this.settings.deleteAnnouncement(id)
  }
}
