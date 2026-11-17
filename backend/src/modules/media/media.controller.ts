import { BadRequestException, Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger'
import type { Express } from 'express'
import { memoryStorage } from 'multer'
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service'
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard'
import { AccessControlGuard } from '../auth/presentation/guards/access-control.guard'
import { Permissions, Roles } from '../auth/presentation/auth.decorators'

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('admin')
@Permissions('media:upload')
@Controller('media')
export class MediaController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  @Post('upload')
  @ApiConsumes('application/json', 'multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      if (!file.mimetype.startsWith('image/')) return callback(new BadRequestException('Only image uploads are supported.'), false)
      callback(null, true)
    },
  }))
  async upload(
    @Body() body: { image?: string; filename?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let imageData: string
    let filename: string | undefined
    if (file) {
      imageData = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
      filename = file.originalname.replace(/\.[^/.]+$/, '')
    } else if (typeof body?.image === 'string' && body.image) {
      imageData = body.image
      filename = body.filename
    } else {
      throw new BadRequestException('No image data provided. Send base64 image data or a file.')
    }
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
