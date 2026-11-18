import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger'
import type { Express } from 'express'
import { memoryStorage } from 'multer'
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service'
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard'
import { AccessControlGuard } from '../auth/presentation/guards/access-control.guard'
import { Roles } from '../auth/presentation/auth.decorators'

const SUPPORTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('admin', 'staff')
@Controller('media')
export class MediaController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  @Post('upload')
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
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No image file provided.')
    const detectedMimeType = detectImageMimeType(file.buffer)
    if (!detectedMimeType || detectedMimeType !== file.mimetype) {
      throw new BadRequestException('The uploaded file is not a supported image.')
    }

    const imageData = `data:${detectedMimeType};base64,${file.buffer.toString('base64')}`
    const filename = file.originalname.replace(/\.[^/.]+$/, '')
    const cleanFilename = typeof filename === 'string' && filename.trim()
      ? filename.trim().replace(/[^a-zA-Z0-9_-]/g, '')
      : `prod-${Date.now()}`
    const result = await this.cloudinary.uploadImage(imageData, cleanFilename)
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

function detectImageMimeType(buffer: Buffer): string | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) return 'image/jpeg'

  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png'
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) return 'image/webp'

  if (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a') {
    return 'image/gif'
  }

  return null
}
