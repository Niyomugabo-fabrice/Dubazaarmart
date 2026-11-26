import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Sse, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { MessageEvent } from '@nestjs/common'
import type { Request } from 'express'
import { Observable } from 'rxjs'
import { OrderService } from '../application/order.service'
import { OrderEventsService } from '../application/order-events.service'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { AccessControlGuard } from '../../auth/presentation/guards/access-control.guard'
import { CurrentUser, Permissions, Roles } from '../../auth/presentation/auth.decorators'
import type { UserIdentity } from '../../auth/domain/user-account'

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orders: OrderService,
    private readonly events: OrderEventsService,
  ) {}

  @Post()
  create(@Body() body: unknown) {
    return this.orders.createCustomerOrder(body)
  }

  @Post('whatsapp')
  createWhatsApp(@Body() body: unknown) {
    return this.orders.createWhatsAppOrder(body)
  }

  @Post('sourcing')
  createSourcing(@Body() body: unknown) {
    return this.orders.createSourcingOrder(body)
  }

  @Post('shipping')
  createShipping(@Body() body: unknown) {
    return this.orders.createShippingOrder(body)
  }

  @Get(':id/thread')
  getThread(@Param('id') id: string) {
    return this.orders.getOrderThread(id)
  }

  @Post(':id/messages')
  addMessage(@Param('id') id: string, @Body() body: unknown) {
    return this.orders.addOrderMessage(id, body)
  }

  @Post(':id/accept-and-pay')
  acceptAndPay(@Param('id') id: string, @Body() body: unknown) {
    return this.orders.acceptOrderQuotation(id, body)
  }

  @Post('accept-quotation')
  acceptQuotation(@Body() body: unknown) {
    return this.orders.acceptQuotation(body)
  }

  @Post(':id/submit-payment')
  submitPayment(@Param('id') id: string, @Body() body: unknown) {
    return this.orders.submitPayment(id, body)
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    const order = await this.orders.findById(id)
    return { success: true, order }
  }
}

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('MANAGER', 'STAFF')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(
    private readonly orders: OrderService,
    private readonly events: OrderEventsService,
  ) {}

  @Get('approvals')
  @Permissions('payments.approve')
  listApprovals() {
    return this.orders.listPendingPaymentApprovals()
  }

  @Post(':id/approve-payment')
  @Permissions('payments.approve')
  async approvePayment(
    @Param('id') id: string,
    @CurrentUser() user: UserIdentity | undefined,
    @Req() request: Request & { auditLogged?: boolean },
  ) {
    request.auditLogged = true
    return this.orders.approvePayment(id, user)
  }

  @Post(':id/reject-payment')
  @Permissions('payments.approve')
  async rejectPayment(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: UserIdentity | undefined,
    @Req() request: Request & { auditLogged?: boolean },
  ) {
    request.auditLogged = true
    return this.orders.rejectPayment(id, body, user)
  }

  @Get()
  @Permissions('orders.view')
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('channel') channel?: string,
    @Query('orderType') orderType?: string,
  ) {
    return this.orders.listAdminOrders({ page, pageSize, search, status, paymentStatus, channel, orderType })
  }

  @Post()
  @Permissions('orders.create')
  async create(
    @Body() body: unknown,
    @CurrentUser() user: UserIdentity | undefined,
    @Req() request: Request & { auditLogged?: boolean },
  ) {
    request.auditLogged = true
    return this.orders.createAdminOrder(body, user)
  }

  @Patch(':id')
  @Permissions('orders.update')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: UserIdentity | undefined,
    @Req() request: Request & { auditLogged?: boolean },
  ) {
    request.auditLogged = true
    return this.orders.updateAdminOrder(id, body, user)
  }

  @Sse('events')
  @Permissions('orders.view')
  eventsStream(): Observable<MessageEvent> {
    return this.events.stream()
  }

  @Patch(':id/status')
  @Permissions('orders.status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: UserIdentity | undefined,
    @Req() request: Request & { auditLogged?: boolean },
  ) {
    request.auditLogged = true
    return this.orders.updateStatus(id, body, user)
  }

  @Post(':id/messages')
  @Permissions('orders.contact')
  async addMessage(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: UserIdentity | undefined,
  ) {
    return this.orders.addOrderMessage(id, body, user)
  }

  @Post(':id/quotations')
  @Permissions('quotations.manage')
  async createQuotation(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: UserIdentity | undefined,
    @Req() request: Request & { auditLogged?: boolean },
  ) {
    request.auditLogged = true
    return this.orders.createOrderQuotation(id, body, user)
  }

  @Patch(':id/payment')
  @Permissions('payments.approve')
  async recordPayment(
    @Param('id') id: string,
    @CurrentUser() user: UserIdentity | undefined,
    @Req() request: Request & { auditLogged?: boolean },
  ) {
    request.auditLogged = true
    return this.orders.recordPayment(id, user)
  }

  @Patch(':id/cancel')
  @Permissions('orders.update')
  async cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: UserIdentity | undefined,
    @Req() request: Request & { auditLogged?: boolean },
  ) {
    request.auditLogged = true
    return this.orders.cancel(id, body?.reason, user)
  }

  @Delete(':id')
  @Permissions('orders.delete')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: UserIdentity | undefined,
    @Req() request: Request & { auditLogged?: boolean },
  ) {
    request.auditLogged = true
    return this.orders.remove(id, user)
  }
}
