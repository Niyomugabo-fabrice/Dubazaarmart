import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { InventoryService } from '../application/inventory.service'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { AccessControlGuard } from '../../auth/presentation/guards/access-control.guard'
import { Roles } from '../../auth/presentation/auth.decorators'

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('admin')
@Controller('admin/stock')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  getSummary() {
    return this.inventory.getSummary()
  }

  @Get('movements')
  getMovements(@Query('productId') productId?: string) {
    return this.inventory.getMovements(productId)
  }

  @Post('remove')
  remove(@Body() body: Record<string, any>) {
    return this.inventory.removeStock(body ?? {})
  }

  @Patch(':productId')
  updateTargets(@Param('productId') id: string, @Body() body: Record<string, unknown>) {
    return this.inventory.updateTargets(id, body ?? {})
  }
}
