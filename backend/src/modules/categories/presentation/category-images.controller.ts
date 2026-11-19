import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger'
import type { Express } from 'express'
import { memoryStorage } from 'multer'
import { Permissions, Roles } from '../../auth/presentation/auth.decorators'
import { AccessControlGuard } from '../../auth/presentation/guards/access-control.guard'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { CATEGORY_IMAGE_MIME_TYPES } from '../../media/image-validation'
import { CategoryImagesService } from '../application/category-images.service'

@ApiTags('category images')
@Controller('categories/images')
export class PublicCategoryImagesController {
  constructor(private readonly categoryImages: CategoryImagesService) {}

  @Get()
  list() {
    return this.categoryImages.list()
  }
}

@ApiTags('admin category images')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('MANAGER', 'STAFF')
@Controller('admin/categories')
export class AdminCategoryImagesController {
  constructor(private readonly categoryImages: CategoryImagesService) {}

  @Post(':id/image')
  @Permissions('categories.manage')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      if (!CATEGORY_IMAGE_MIME_TYPES.has(file.mimetype)) {
        return callback(new BadRequestException('Only JPG, PNG, or WEBP images up to 2 MB are supported.'), false)
      }
      callback(null, true)
    },
  }))
  upload(@Param('id') id: string, @UploadedFile() file?: Express.Multer.File) {
    return this.categoryImages.upload(id, file)
  }
}
