import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { TestimonialsService } from '../application/testimonials.service'
import { AccessControlGuard } from '../../auth/presentation/guards/access-control.guard'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { Permissions, Roles } from '../../auth/presentation/auth.decorators'

@ApiTags('testimonials')
@Controller('testimonials')
export class PublicTestimonialsController {
  constructor(private readonly testimonials: TestimonialsService) {}

  @Get()
  list() {
    return this.testimonials.listPublic()
  }
}

@ApiTags('admin testimonials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('MANAGER', 'STAFF')
@Controller('admin/testimonials')
export class AdminTestimonialsController {
  constructor(private readonly testimonials: TestimonialsService) {}

  @Get()
  @Permissions('testimonials.view')
  list() {
    return this.testimonials.listAdmin()
  }

  @Post()
  @Permissions('testimonials.create')
  create(@Body() body: unknown) {
    return this.testimonials.create(body)
  }

  @Patch(':id')
  @Permissions('testimonials.update')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.testimonials.update(id, body)
  }

  @Delete(':id')
  @Permissions('testimonials.delete')
  remove(@Param('id') id: string) {
    return this.testimonials.remove(id)
  }
}
