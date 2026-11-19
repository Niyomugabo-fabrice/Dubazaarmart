import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { MediaModule } from '../media/media.module'
import { CategoryImagesService } from './application/category-images.service'
import { CategoryImageEntity } from './infrastructure/persistence/typeorm/category-image.entity'
import { AdminCategoryImagesController, PublicCategoryImagesController } from './presentation/category-images.controller'

@Module({
  imports: [TypeOrmModule.forFeature([CategoryImageEntity]), AuthModule, MediaModule],
  controllers: [PublicCategoryImagesController, AdminCategoryImagesController],
  providers: [CategoryImagesService],
})
export class CategoriesModule {}
