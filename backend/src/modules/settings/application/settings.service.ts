import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { AnnouncementEntity } from '../infrastructure/persistence/typeorm/announcement.entity'
import type { WebsiteSettingsEntity } from '../infrastructure/persistence/typeorm/website-settings.entity'
import { SETTINGS_REPOSITORY, type SettingsRepository } from '../domain/settings.repository'

const defaults = {
  shopName: 'DubazaarMart',
  companyEmail: 'info@dubazaarmart.rw',
  supportEmail: 'support@dubazaarmart.rw',
  phoneNumber: '+250789545954',
  whatsappNumber: '+250789545954',
  momoNumber: '+250789545954',
  businessAddress: 'Kigali, Rwanda (Dubai Wholesale Hub)',
  currency: 'RWF',
  standardDeliveryFee: 10000,
  expressDeliveryFee: 25000,
  freeDeliveryThreshold: 500000,
}

@Injectable()
export class SettingsService {
  constructor(@Inject(SETTINGS_REPOSITORY) private readonly repository: SettingsRepository) {}

  async getPublicSettings() {
    const row = await this.repository.getWebsiteSettings()
    return { settings: row ? serializeSettings(row) : defaults }
  }

  async getWhatsAppDetails(): Promise<{ shopName: string; whatsappNumber: string }> {
    const row = await this.repository.getWebsiteSettings()
    return {
      shopName: row?.shopName || defaults.shopName,
      whatsappNumber: row?.whatsappNumber || defaults.whatsappNumber,
    }
  }

  async updateSettings(body: Record<string, unknown>) {
    const fields: Array<keyof typeof defaults> = [
      'shopName', 'companyEmail', 'supportEmail', 'phoneNumber', 'whatsappNumber', 'momoNumber',
      'businessAddress', 'currency', 'standardDeliveryFee', 'expressDeliveryFee', 'freeDeliveryThreshold',
    ]
    const values: Partial<WebsiteSettingsEntity> = {}
    for (const field of fields) {
      const value = body[field]
      if (value === undefined || value === null) continue
      if (field.endsWith('Fee') || field === 'freeDeliveryThreshold') {
        const amount = Number(value)
        if (!Number.isFinite(amount) || amount < 0) throw new BadRequestException(`${field} must be a non-negative number.`)
        ;(values as any)[field] = String(amount)
      } else {
        ;(values as any)[field] = String(value)
      }
    }
    const settings = await this.repository.saveWebsiteSettings(values)
    return { success: true, settings: serializeSettings(settings) }
  }

  async getActiveAnnouncements() {
    try {
      const announcements = await this.repository.findActiveAnnouncements(new Date())
      return { announcements: announcements.map(serializeAnnouncement) }
    } catch {
      return { announcements: [] }
    }
  }

  async getAdminAnnouncements() {
    const announcements = await this.repository.findAllAnnouncements()
    return { announcements: announcements.map(serializeAnnouncement) }
  }

  async createAnnouncement(body: Record<string, any>) {
    if (!body.title || !body.message) throw new BadRequestException('Title and message are required')
    const announcement = await this.repository.saveAnnouncement({
      title: String(body.title),
      message: String(body.message),
      tag: body.tag ? String(body.tag) : 'Announcement',
      startDate: parseOptionalDate(body.startDate),
      endDate: parseOptionalDate(body.endDate),
      active: true,
    })
    return { success: true, announcement: serializeAnnouncement(announcement) }
  }

  async updateAnnouncement(id: string, body: Record<string, any>) {
    const current = await this.repository.findAnnouncement(id)
    if (!current) throw new NotFoundException('Announcement not found')
    const values: Partial<AnnouncementEntity> = {}
    if (body.title !== undefined) values.title = String(body.title)
    if (body.message !== undefined) values.message = String(body.message)
    if (body.tag !== undefined) values.tag = String(body.tag)
    if (body.active !== undefined) values.active = Boolean(body.active)
    if (body.startDate !== undefined) values.startDate = parseOptionalDate(body.startDate)
    if (body.endDate !== undefined) values.endDate = parseOptionalDate(body.endDate)
    if (!Object.keys(values).length) throw new BadRequestException('No fields to update')
    return { success: true, announcement: serializeAnnouncement(await this.repository.saveAnnouncement({ ...current, ...values })) }
  }

  async deleteAnnouncement(id: string) {
    if (!(await this.repository.deleteAnnouncement(id))) throw new NotFoundException('Announcement not found')
    return { success: true, message: 'Announcement deleted' }
  }
}

function parseOptionalDate(value: unknown): Date | null {
  if (value === undefined || value === null || value === '') return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) throw new BadRequestException('A date value is invalid.')
  return date
}

function serializeSettings(row: WebsiteSettingsEntity) {
  return {
    shopName: row.shopName,
    companyEmail: row.companyEmail,
    supportEmail: row.supportEmail,
    phoneNumber: row.phoneNumber,
    whatsappNumber: row.whatsappNumber,
    momoNumber: row.momoNumber,
    businessAddress: row.businessAddress,
    currency: row.currency,
    standardDeliveryFee: Number(row.standardDeliveryFee),
    expressDeliveryFee: Number(row.expressDeliveryFee),
    freeDeliveryThreshold: Number(row.freeDeliveryThreshold),
    updatedAt: row.updatedAt,
  }
}

function serializeAnnouncement(row: AnnouncementEntity) {
  return {
    id: String(row.id),
    title: row.title,
    message: row.message,
    tag: row.tag,
    active: row.active,
    startDate: row.startDate,
    endDate: row.endDate,
    createdAt: row.createdAt,
  }
}
