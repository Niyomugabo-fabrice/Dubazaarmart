import type { AnnouncementEntity } from '../infrastructure/persistence/typeorm/announcement.entity'
import type { WebsiteSettingsEntity } from '../infrastructure/persistence/typeorm/website-settings.entity'

export const SETTINGS_REPOSITORY = Symbol('SETTINGS_REPOSITORY')

export interface SettingsRepository {
  getWebsiteSettings(): Promise<WebsiteSettingsEntity | null>
  saveWebsiteSettings(settings: Partial<WebsiteSettingsEntity>): Promise<WebsiteSettingsEntity>
  findActiveAnnouncements(now: Date): Promise<AnnouncementEntity[]>
  findAllAnnouncements(): Promise<AnnouncementEntity[]>
  findAnnouncement(id: string): Promise<AnnouncementEntity | null>
  saveAnnouncement(announcement: Partial<AnnouncementEntity>): Promise<AnnouncementEntity>
  deleteAnnouncement(id: string): Promise<boolean>
}
