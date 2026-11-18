import { Body, Controller, Delete, Get, MessageEvent, Param, Patch, Post, Query, Sse, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiBearerAuth } from '@nestjs/swagger'
import { Observable } from 'rxjs'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { AccessControlGuard } from '../../auth/presentation/guards/access-control.guard'
import { Roles } from '../../auth/presentation/auth.decorators'
import { OrderService } from '../application/order.service'
import { OrderEventsService } from '../application/order-events.service'
import { CustomerRegistrationService } from '../application/customer-registration.service'
import { RegisterCustomerDto } from './dto/register-customer.dto'

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

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomerRegistrationService) {}

  @Post('register')
  @ApiOperation({ summary: 'Create a customer account' })
  register(@Body() dto: RegisterCustomerDto) {
    return this.customers.register(dto)
  }
}

@ApiTags('admin orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('admin', 'staff')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly orders: OrderService, private readonly events: OrderEventsService) {}

  @Get()
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
  create(@Body() body: unknown) {
    return this.orders.createAdminOrder(body)
  }

  @Sse('events')
  eventsStream(): Observable<MessageEvent> {
    return this.events.stream()
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: unknown) {
    return this.orders.updateStatus(id, body)
  }

  @Patch(':id/payment')
  recordPayment(@Param('id') id: string) {
    return this.orders.recordPayment(id)
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.orders.cancel(id, body?.reason)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orders.remove(id)
  }
}
