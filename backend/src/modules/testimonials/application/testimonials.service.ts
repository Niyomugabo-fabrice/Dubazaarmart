import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TestimonialEntity } from '../infrastructure/persistence/typeorm/testimonial.entity'

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(TestimonialEntity)
    private readonly testimonials: Repository<TestimonialEntity>,
  ) {}

  async listPublic() {
    const testimonials = await this.testimonials.find({
      where: { isVisible: true },
      order: { createdAt: 'DESC' },
    })
    return { testimonials: testimonials.map(serializeTestimonial) }
  }

  async listAdmin() {
    const testimonials = await this.testimonials.find({ order: { createdAt: 'DESC' } })
    return { testimonials: testimonials.map(serializeTestimonial) }
  }

  async create(body: unknown) {
    if (!isRecord(body)) throw new BadRequestException('Testimonial details are required.')
    const values = parseTestimonial(body, false)
    const saved = await this.testimonials.save(this.testimonials.create({
      customerName: values.customerName!,
      role: values.role ?? null,
      photoUrl: values.photoUrl ?? null,
      rating: values.rating!,
      message: values.message!,
      isVisible: values.isVisible ?? true,
    }))
    return { success: true, testimonial: serializeTestimonial(saved) }
  }

  async update(id: string, body: unknown) {
    if (!isRecord(body)) throw new BadRequestException('Testimonial changes are required.')
    const current = await this.testimonials.findOneBy({ id })
    if (!current) throw new NotFoundException('Testimonial not found.')
    const values = parseTestimonial(body, true)
    if (!Object.keys(values).length) throw new BadRequestException('No testimonial fields were provided.')
    Object.assign(current, values)
    const saved = await this.testimonials.save(current)
    return { success: true, testimonial: serializeTestimonial(saved) }
  }

  async remove(id: string) {
    const result = await this.testimonials.delete({ id })
    if (!result.affected) throw new NotFoundException('Testimonial not found.')
    return { success: true, message: 'Testimonial deleted.' }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function parseTestimonial(
  body: Record<string, unknown>,
  partial: boolean,
): Partial<TestimonialEntity> {
  const values: Partial<TestimonialEntity> = {}

  if (!partial || 'customerName' in body) {
    if (typeof body.customerName !== 'string' || !body.customerName.trim() || body.customerName.trim().length > 120) {
      throw new BadRequestException('Customer name is required and must be 120 characters or fewer.')
    }
    values.customerName = body.customerName.trim()
  }

  if (!partial || 'role' in body) {
    if (body.role !== undefined && body.role !== null && typeof body.role !== 'string') {
      throw new BadRequestException('Role or location must be text.')
    }
    const role = typeof body.role === 'string' ? body.role.trim() : ''
    if (role.length > 120) throw new BadRequestException('Role or location must be 120 characters or fewer.')
    values.role = role || null
  }

  if (!partial || 'photoUrl' in body) {
    values.photoUrl = parsePhotoUrl(body.photoUrl)
  }

  if (!partial || 'rating' in body) {
    if (typeof body.rating !== 'number' || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
      throw new BadRequestException('Rating must be a whole number from 1 to 5.')
    }
    values.rating = body.rating
  }

  if (!partial || 'message' in body) {
    if (typeof body.message !== 'string' || !body.message.trim() || body.message.trim().length > 3000) {
      throw new BadRequestException('Message is required and must be 3000 characters or fewer.')
    }
    values.message = body.message.trim()
  }

  if (!partial || 'isVisible' in body) {
    if (body.isVisible !== undefined && typeof body.isVisible !== 'boolean') {
      throw new BadRequestException('isVisible must be a boolean.')
    }
    values.isVisible = body.isVisible === undefined ? true : body.isVisible
  }

  return values
}

function parsePhotoUrl(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || value.length > 2048) {
    throw new BadRequestException('Photo URL must be 2048 characters or fewer.')
  }
  const photoUrl = value.trim()
  if (!photoUrl) return null
  if (!/^https?:\/\//i.test(photoUrl) && (!photoUrl.startsWith('/') || photoUrl.startsWith('//'))) {
    throw new BadRequestException('Photo URL must be an http(s) URL or a site path.')
  }
  return photoUrl
}

function serializeTestimonial(row: TestimonialEntity) {
  return {
    id: String(row.id),
    customerName: row.customerName,
    role: row.role,
    photoUrl: row.photoUrl,
    rating: row.rating,
    message: row.message,
    isVisible: row.isVisible,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
