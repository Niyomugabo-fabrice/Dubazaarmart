import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { MediaModule } from '../media/media.module'
import { HeroSlidesService } from './application/hero-slides.service'
import { HeroSlideEntity } from './infrastructure/persistence/typeorm/hero-slide.entity'
import { AdminHeroSlidesController, PublicHeroSlidesController } from './presentation/hero-slides.controller'

@Module({
  imports: [TypeOrmModule.forFeature([HeroSlideEntity]), AuthModule, MediaModule],
  controllers: [AdminHeroSlidesController, PublicHeroSlidesController],
  providers: [HeroSlidesService],
})
export class HeroesModule {}
