import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { SettingsRepository } from '../../../domain/settings.repository'
import { AnnouncementEntity } from './announcement.entity'
import { WebsiteSettingsEntity } from './website-settings.entity'

@Injectable()
export class TypeOrmSettingsRepository implements SettingsRepository {
  constructor(
    @InjectRepository(WebsiteSettingsEntity) private readonly settings: Repository<WebsiteSettingsEntity>,
    @InjectRepository(AnnouncementEntity) private readonly announcements: Repository<AnnouncementEntity>,
  ) {}

  getWebsiteSettings() {
    return this.settings.findOneBy({ id: 'primary' })
  }

  saveWebsiteSettings(values: Partial<WebsiteSettingsEntity>) {
    return this.settings.save(this.settings.create({ id: 'primary', ...values }))
  }

  findActiveAnnouncements(now: Date) {
    return this.announcements.createQueryBuilder('announcement')
      .where('announcement.is_active = true')
      .andWhere('(announcement.start_date IS NULL OR announcement.start_date <= :now)', { now })
      .andWhere('(announcement.end_date IS NULL OR announcement.end_date >= :now)', { now })
      .orderBy('announcement.created_at', 'DESC')
      .getMany()
  }

  findAllAnnouncements() {
    return this.announcements.find({ order: { createdAt: 'DESC' } })
  }

  findAnnouncement(id: string) {
    return this.announcements.findOneBy({ id })
  }

  saveAnnouncement(values: Partial<AnnouncementEntity>) {
    return this.announcements.save(this.announcements.create(values))
  }

  async deleteAnnouncement(id: string) {
    const result = await this.announcements.delete({ id })
    return Boolean(result.affected)
  }
}
