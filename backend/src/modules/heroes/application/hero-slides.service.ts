import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { randomUUID } from 'node:crypto'
import type { Express } from 'express'
import { Repository } from 'typeorm'
import { CloudinaryService } from '../../../infrastructure/cloudinary/cloudinary.service'
import { detectImageMimeType, HERO_SLIDE_IMAGE_MIME_TYPES } from '../../media/image-validation'
import { HeroSlideEntity } from '../infrastructure/persistence/typeorm/hero-slide.entity'
import type { CreateHeroSlideDto, UpdateHeroSlideDto } from '../presentation/dto/hero-slide.dto'

@Injectable()
export class HeroSlidesService {
  constructor(
    @InjectRepository(HeroSlideEntity)
    private readonly slides: Repository<HeroSlideEntity>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async listActive() {
    const slides = await this.slides.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    })
    return { slides: slides.map(serializeHeroSlide) }
  }

  async listAdmin() {
    const slides = await this.slides.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    })
    return { slides: slides.map(serializeHeroSlide) }
  }

  async create(dto: CreateHeroSlideDto, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('A hero slide image is required.')

    const imageUrl = await this.uploadImage(file)
    const slides = await this.slides.find({ select: { sortOrder: true } })
    const slide = this.slides.create({
      imageUrl,
      heading: optionalText(dto.heading),
      subheading: optionalText(dto.subheading),
      buttonText: optionalText(dto.buttonText),
      buttonLink: normalizeButtonLink(dto.buttonLink),
      sortOrder: slides.reduce((maximum, item) => Math.max(maximum, item.sortOrder), -1) + 1,
      isActive: dto.isActive ?? true,
    })
    return { slide: serializeHeroSlide(await this.slides.save(slide)) }
  }

  async update(id: string, dto: UpdateHeroSlideDto, file?: Express.Multer.File) {
    const slide = await this.slides.findOne({ where: { id } })
    if (!slide) throw new NotFoundException('Hero slide not found.')

    if (dto.heading !== undefined) slide.heading = optionalText(dto.heading)
    if (dto.subheading !== undefined) slide.subheading = optionalText(dto.subheading)
    if (dto.buttonText !== undefined) slide.buttonText = optionalText(dto.buttonText)
    if (dto.buttonLink !== undefined) slide.buttonLink = normalizeButtonLink(dto.buttonLink)
    if (dto.isActive !== undefined) slide.isActive = dto.isActive
    if (file) slide.imageUrl = await this.uploadImage(file)

    return { slide: serializeHeroSlide(await this.slides.save(slide)) }
  }

  async remove(id: string) {
    const result = await this.slides.delete(id)
    if (!result.affected) throw new NotFoundException('Hero slide not found.')
    return { success: true }
  }

  async reorder(slideIds: string[]) {
    const currentSlides = await this.slides.find({ select: { id: true }, order: { sortOrder: 'ASC' } })
    const requestedIds = new Set(slideIds)
    if (
      requestedIds.size !== slideIds.length ||
      requestedIds.size !== currentSlides.length ||
      currentSlides.some((slide) => !requestedIds.has(slide.id))
    ) {
      throw new BadRequestException('The order must include every hero slide exactly once.')
    }

    await this.slides.manager.transaction(async (manager) => {
      const repository = manager.getRepository(HeroSlideEntity)
      for (const [sortOrder, id] of slideIds.entries()) {
        await repository.update(id, { sortOrder })
      }
    })
    return this.listAdmin()
  }

  private async uploadImage(file: Express.Multer.File): Promise<string> {
    const mimeType = detectImageMimeType(file.buffer)
    if (!mimeType || mimeType !== file.mimetype || !HERO_SLIDE_IMAGE_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException('Only valid JPG, PNG, or WEBP hero images are supported.')
    }

    const imageData = `data:${mimeType};base64,${file.buffer.toString('base64')}`
    const uploaded = await this.cloudinary.uploadImage(imageData, `hero-slide-${randomUUID()}`, 'hero-slides')
    const imageUrl = uploaded.secure_url ?? uploaded.url
    if (!imageUrl) throw new ServiceUnavailableException('The hero slide image could not be stored.')
    return imageUrl
  }
}

function optionalText(value: string | undefined): string | null {
  return value?.trim() || null
}

function normalizeButtonLink(value: string | undefined): string | null {
  const link = value?.trim()
  if (!link) return null
  if (link.startsWith('/') && !link.startsWith('//')) return link
  if (/^https?:\/\/\S+$/i.test(link)) return link
  throw new BadRequestException('Button links must be a site path or an HTTP(S) URL.')
}

function serializeHeroSlide(slide: HeroSlideEntity) {
  return {
    id: slide.id,
    imageUrl: slide.imageUrl,
    heading: slide.heading,
    subheading: slide.subheading,
    buttonText: slide.buttonText,
    buttonLink: slide.buttonLink,
    sortOrder: slide.sortOrder,
    isActive: slide.isActive,
    createdAt: slide.createdAt,
    updatedAt: slide.updatedAt,
  }
}
