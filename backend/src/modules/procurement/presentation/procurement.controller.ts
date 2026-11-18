import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { ProcurementService } from '../application/procurement.service'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { AccessControlGuard } from '../../auth/presentation/guards/access-control.guard'
import { Roles } from '../../auth/presentation/auth.decorators'

@ApiTags('procurement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('admin', 'staff')
@Controller('admin/company-orders')
export class ProcurementController {
  constructor(private readonly procurement: ProcurementService) {}

  @Get()
  list(@Query('search') search?: string, @Query('status') status?: string) {
    return this.procurement.list(search, status)
  }

  @Post()
  create(@Body() body: Record<string, any>) {
    return this.procurement.create(body ?? {})
  }

  @Post(':id/receive')
  receive(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.procurement.receive(id, body ?? {})
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.procurement.update(id, body ?? {})
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.procurement.remove(id)
  }
}
