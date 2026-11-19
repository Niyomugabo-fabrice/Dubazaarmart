import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Express } from 'express'
import { Repository } from 'typeorm'
import { CloudinaryService } from '../../../infrastructure/cloudinary/cloudinary.service'
import { CATEGORY_IMAGE_MIME_TYPES, detectImageMimeType } from '../../media/image-validation'
import { CategoryImageEntity } from '../infrastructure/persistence/typeorm/category-image.entity'

export const CATEGORY_IMAGE_IDS = [
  'smartphones',
  'laptops',
  'tablets',
  'smartwatches',
  'headphones',
  'earbuds',
  'tvs',
  'cameras',
  'gaming',
  'accessories',
  'phone-accessories',
  'chargers',
  'power-banks',
  'speakers',
] as const

const categoryImageIdSet = new Set<string>(CATEGORY_IMAGE_IDS)

@Injectable()
export class CategoryImagesService {
  constructor(
    @InjectRepository(CategoryImageEntity)
    private readonly categoryImages: Repository<CategoryImageEntity>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async list() {
    const savedImages = await this.categoryImages.find()
    const imageByCategory = new Map(savedImages.map((image) => [image.categoryId, image]))
    return {
      images: CATEGORY_IMAGE_IDS.map((categoryId) => {
        const image = imageByCategory.get(categoryId)
        return {
          categoryId,
          imageUrl: image?.imageUrl ?? null,
          updatedAt: image?.updatedAt ?? null,
        }
      }),
    }
  }

  async upload(categoryId: string, file?: Express.Multer.File) {
    if (!categoryImageIdSet.has(categoryId)) {
      throw new BadRequestException('This category does not support a custom image.')
    }
    if (!file) throw new BadRequestException('No category image was provided.')

    const mimeType = detectImageMimeType(file.buffer)
    if (!mimeType || mimeType !== file.mimetype || !CATEGORY_IMAGE_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException('Only valid JPG, PNG, or WEBP images are supported.')
    }

    const imageData = `data:${mimeType};base64,${file.buffer.toString('base64')}`
    const filename = `category-${categoryId}`
    const uploaded = await this.cloudinary.uploadImage(imageData, filename, 'categories')
    const imageUrl = uploaded.secure_url ?? uploaded.url
    if (!imageUrl) throw new ServiceUnavailableException('The category image could not be stored.')

    const savedImage = await this.categoryImages.save(this.categoryImages.create({
      categoryId,
      imageUrl,
    }))
    return { image: serializeCategoryImage(savedImage) }
  }
}

function serializeCategoryImage(image: CategoryImageEntity) {
  return {
    categoryId: image.categoryId,
    imageUrl: image.imageUrl,
    updatedAt: image.updatedAt,
  }
}
