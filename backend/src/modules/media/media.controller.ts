import { BadRequestException, Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger'
import type { Express } from 'express'
import { memoryStorage } from 'multer'
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service'
import { detectImageMimeType, SUPPORTED_IMAGE_MIME_TYPES } from './image-validation'
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard'
import { AccessControlGuard } from '../auth/presentation/guards/access-control.guard'
import { Permissions, Roles } from '../auth/presentation/auth.decorators'

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('MANAGER', 'STAFF')
@Controller('media')
export class MediaController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  @Post('upload')
  @Permissions('media.upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      if (!SUPPORTED_IMAGE_MIME_TYPES.has(file.mimetype)) {
        return callback(new BadRequestException('Only JPEG, PNG, WebP, or GIF images are supported.'), false)
      }
      callback(null, true)
    },
  }))
  async upload(@UploadedFile() file?: Express.Multer.File, @Body('folder') folder?: string) {
    if (!file) throw new BadRequestException('No image file provided.')
    const uploadFolder = folder ?? 'products'
    if (uploadFolder !== 'products' && uploadFolder !== 'testimonials') {
      throw new BadRequestException('The upload folder is not supported.')
    }
    const detectedMimeType = detectImageMimeType(file.buffer)
    if (!detectedMimeType || detectedMimeType !== file.mimetype) {
      throw new BadRequestException('The uploaded file is not a supported image.')
    }

    const imageData = `data:${detectedMimeType};base64,${file.buffer.toString('base64')}`
    const filename = file.originalname.replace(/\.[^/.]+$/, '')
    const cleanFilename = typeof filename === 'string' && filename.trim()
      ? filename.trim().replace(/[^a-zA-Z0-9_-]/g, '')
      : `prod-${Date.now()}`
    const result = await this.cloudinary.uploadImage(imageData, cleanFilename, uploadFolder)
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      filename: cleanFilename,
      storage: 'cloudinary',
    }
  }
}
