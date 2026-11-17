import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service'
import { MediaController } from './media.controller'

@Module({
  imports: [AuthModule],
  controllers: [MediaController],
  providers: [CloudinaryService],
})
export class MediaModule {}
