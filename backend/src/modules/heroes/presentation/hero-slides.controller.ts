import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { HERO_SLIDE_IMAGE_MIME_TYPES } from '../../media/image-validation'
import { HeroSlidesService } from '../application/hero-slides.service'
import { CreateHeroSlideDto, ReorderHeroSlidesDto, UpdateHeroSlideDto } from './dto/hero-slide.dto'

@ApiTags('hero slides')
@Controller('hero-slides')
export class PublicHeroSlidesController {
  constructor(private readonly heroSlides: HeroSlidesService) {}

  @Get('active')
  listActive() {
    return this.heroSlides.listActive()
  }
}

@ApiTags('admin hero slides')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('MANAGER', 'STAFF')
@Controller('admin/hero-slides')
export class AdminHeroSlidesController {
  constructor(private readonly heroSlides: HeroSlidesService) {}

  @Get()
  @Permissions('heroSlides.view')
  list() {
    return this.heroSlides.listAdmin()
  }

  @Post()
  @Roles('MANAGER')
  @Permissions('heroSlides.manage')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(heroSlideImageInterceptor())
  create(@Body() dto: CreateHeroSlideDto, @UploadedFile() file?: Express.Multer.File) {
    return this.heroSlides.create(dto, file)
  }

  @Patch('reorder')
  @Roles('MANAGER')
  @Permissions('heroSlides.manage')
  reorder(@Body() dto: ReorderHeroSlidesDto) {
    return this.heroSlides.reorder(dto.slideIds)
  }

  @Patch(':id')
  @Roles('MANAGER')
  @Permissions('heroSlides.manage')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(heroSlideImageInterceptor())
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHeroSlideDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.heroSlides.update(id, dto, file)
  }

  @Delete(':id')
  @Roles('MANAGER')
  @Permissions('heroSlides.manage')
  remove(@Param('id') id: string) {
    return this.heroSlides.remove(id)
  }
}

function heroSlideImageInterceptor() {
  return FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      if (!HERO_SLIDE_IMAGE_MIME_TYPES.has(file.mimetype)) {
        return callback(new BadRequestException('Only JPG, PNG, or WEBP hero images up to 3 MB are supported.'), false)
      }
      callback(null, true)
    },
  })
}
