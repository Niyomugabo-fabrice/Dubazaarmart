import { Body, Controller, Delete, Get, MessageEvent, Param, Patch, Post, Query, Sse, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiBearerAuth } from '@nestjs/swagger'
import { Observable } from 'rxjs'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { AccessControlGuard } from '../../auth/presentation/guards/access-control.guard'
import { Permissions, Roles } from '../../auth/presentation/auth.decorators'
import { OrderService } from '../application/order.service'
import { OrderEventsService } from '../application/order-events.service'

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Place a customer order and update stock' })
  create(@Body() body: unknown) {
    return this.orders.createCustomerOrder(body)
  }

  @Post('whatsapp')
  createWhatsApp(@Body() body: unknown) {
    return this.orders.createWhatsAppOrder(body)
  }
}

@ApiTags('admin orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('MANAGER', 'STAFF')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly orders: OrderService, private readonly events: OrderEventsService) {}

  @Get()
  @Permissions('orders.view')
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('channel') channel?: string,
  ) {
    return this.orders.listAdminOrders({ page, pageSize, search, status, paymentStatus, channel })
  }

  @Post()
  @Permissions('orders.create')
  create(@Body() body: unknown) {
    return this.orders.createAdminOrder(body)
  }

  @Patch(':id')
  @Permissions('orders.update')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.orders.updateAdminOrder(id, body)
  }

  @Sse('events')
  @Permissions('orders.view')
  eventsStream(): Observable<MessageEvent> {
    return this.events.stream()
  }

  @Patch(':id/status')
  @Permissions('orders.status')
  updateStatus(@Param('id') id: string, @Body() body: unknown) {
    return this.orders.updateStatus(id, body)
  }

  @Patch(':id/payment')
  @Permissions('payments.approve')
  recordPayment(@Param('id') id: string) {
    return this.orders.recordPayment(id)
  }

  @Patch(':id/cancel')
  @Permissions('orders.update')
  cancel(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.orders.cancel(id, body?.reason)
  }

  @Delete(':id')
  @Permissions('orders.delete')
  remove(@Param('id') id: string) {
    return this.orders.remove(id)
  }
}
