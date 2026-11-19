import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { TestimonialEntity } from './infrastructure/persistence/typeorm/testimonial.entity'
import { TestimonialsService } from './application/testimonials.service'
import { AdminTestimonialsController, PublicTestimonialsController } from './presentation/testimonials.controller'

@Module({
  imports: [TypeOrmModule.forFeature([TestimonialEntity]), AuthModule],
  controllers: [PublicTestimonialsController, AdminTestimonialsController],
  providers: [TestimonialsService],
})
export class TestimonialsModule {}
