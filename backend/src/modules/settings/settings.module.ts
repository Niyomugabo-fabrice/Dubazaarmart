import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { AnnouncementEntity } from './infrastructure/persistence/typeorm/announcement.entity'
import { WebsiteSettingsEntity } from './infrastructure/persistence/typeorm/website-settings.entity'
import { TypeOrmSettingsRepository } from './infrastructure/persistence/typeorm/typeorm-settings.repository'
import { SETTINGS_REPOSITORY } from './domain/settings.repository'
import { SettingsService } from './application/settings.service'
import {
  ActiveAnnouncementsController,
  AdminSettingsController,
  PublicSettingsController,
  StaffRegistrationController,
} from './presentation/settings.controller'
import { AdminAnnouncementsController } from './presentation/admin-announcements.controller'

@Module({
  imports: [TypeOrmModule.forFeature([WebsiteSettingsEntity, AnnouncementEntity]), AuthModule],
  controllers: [
    PublicSettingsController,
    AdminSettingsController,
    ActiveAnnouncementsController,
    AdminAnnouncementsController,
    StaffRegistrationController,
  ],
  providers: [
    SettingsService,
    TypeOrmSettingsRepository,
    { provide: SETTINGS_REPOSITORY, useExisting: TypeOrmSettingsRepository },
  ],
  exports: [SettingsService],
})
export class SettingsModule {}
