import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { ProcurementService } from '../application/procurement.service'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { AccessControlGuard } from '../../auth/presentation/guards/access-control.guard'
import { Permissions, Roles } from '../../auth/presentation/auth.decorators'

@ApiTags('procurement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('MANAGER', 'STAFF')
@Controller('admin/company-orders')
export class ProcurementController {
  constructor(private readonly procurement: ProcurementService) {}

  @Get()
  @Permissions('procurement.view')
  list(@Query('search') search?: string, @Query('status') status?: string) {
    return this.procurement.list(search, status)
  }

  @Post()
  @Permissions('procurement.manage')
  create(@Body() body: Record<string, any>) {
    return this.procurement.create(body ?? {})
  }

  @Post(':id/receive')
  @Permissions('procurement.manage')
  receive(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.procurement.receive(id, body ?? {})
  }

  @Patch(':id')
  @Permissions('procurement.manage')
  update(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.procurement.update(id, body ?? {})
  }

  @Delete(':id')
  @Permissions('procurement.manage')
  remove(@Param('id') id: string) {
    return this.procurement.remove(id)
  }
}
