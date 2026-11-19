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
  allowStaffRegistration: false,
}

@Injectable()
export class SettingsService {
  constructor(@Inject(SETTINGS_REPOSITORY) private readonly repository: SettingsRepository) {}

  async getPublicSettings() {
    const row = await this.repository.getWebsiteSettings()
    return { settings: row ? serializeSettings(row) : defaults }
  }

  async isStaffRegistrationAllowed(): Promise<boolean> {
    const row = await this.repository.getWebsiteSettings()
    return row?.allowStaffRegistration ?? false
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
    if (body.allowStaffRegistration !== undefined) {
      if (typeof body.allowStaffRegistration !== 'boolean') {
        throw new BadRequestException('allowStaffRegistration must be a boolean.')
      }
      values.allowStaffRegistration = body.allowStaffRegistration
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
    if (typeof body.title !== 'string' || !body.title.trim() || typeof body.message !== 'string' || !body.message.trim()) {
      throw new BadRequestException('Title and message are required.')
    }
    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
      throw new BadRequestException('isActive must be a boolean.')
    }
    const link = parseOptionalLink(body.link)
    const startDate = parseOptionalDate(body.startDate)
    const endDate = parseOptionalDate(body.endDate)
    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('The end date must be on or after the start date.')
    }
    const announcement = await this.repository.saveAnnouncement({
      title: body.title.trim(),
      message: body.message.trim(),
      link,
      startDate,
      endDate,
      isActive: body.isActive ?? false,
    })
    return { success: true, announcement: serializeAnnouncement(announcement) }
  }

  async updateAnnouncement(id: string, body: Record<string, any>) {
    const current = await this.repository.findAnnouncement(id)
    if (!current) throw new NotFoundException('Announcement not found')
    const values: Partial<AnnouncementEntity> = {}
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || !body.title.trim()) throw new BadRequestException('Title is required.')
      values.title = body.title.trim()
    }
    if (body.message !== undefined) {
      if (typeof body.message !== 'string' || !body.message.trim()) throw new BadRequestException('Message is required.')
      values.message = body.message.trim()
    }
    if (body.link !== undefined) {
      values.link = parseOptionalLink(body.link)
    }
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') throw new BadRequestException('isActive must be a boolean.')
      values.isActive = body.isActive
    }
    if (body.startDate !== undefined) values.startDate = parseOptionalDate(body.startDate)
    if (body.endDate !== undefined) values.endDate = parseOptionalDate(body.endDate)
    if (!Object.keys(values).length) throw new BadRequestException('No fields to update')
    const updated = { ...current, ...values }
    if (updated.startDate && updated.endDate && updated.startDate > updated.endDate) {
      throw new BadRequestException('The end date must be on or after the start date.')
    }
    return { success: true, announcement: serializeAnnouncement(await this.repository.saveAnnouncement(updated)) }
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

function parseOptionalLink(value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') throw new BadRequestException('Link must be a string.')
  const link = value.trim()
  if (!link) return null
  if (link.length > 2048) throw new BadRequestException('Link must be 2048 characters or fewer.')
  if (!/^https?:\/\//i.test(link) && (!link.startsWith('/') || link.startsWith('//'))) {
    throw new BadRequestException('Link must be an http(s) URL or a site path starting with "/".')
  }
  return link
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
    allowStaffRegistration: row.allowStaffRegistration,
    updatedAt: row.updatedAt,
  }
}

function serializeAnnouncement(row: AnnouncementEntity) {
  return {
    id: String(row.id),
    title: row.title,
    message: row.message,
    link: row.link ?? null,
    isActive: row.isActive,
    startDate: row.startDate,
    endDate: row.endDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
