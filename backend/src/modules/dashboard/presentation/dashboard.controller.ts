import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { DashboardService } from '../application/dashboard.service'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { AccessControlGuard } from '../../auth/presentation/guards/access-control.guard'
import { Roles } from '../../auth/presentation/auth.decorators'
import type { AdminIdentity } from '../../auth/domain/admin-account'

type AuthenticatedRequest = Request & { user: AdminIdentity }

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('admin', 'staff')
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  getDashboard(@Query('range') range: string | undefined, @Req() request: Request) {
    const includeCustomerDetails = (request as AuthenticatedRequest).user.role === 'admin'
    return this.dashboard.getDashboard(range, includeCustomerDetails)
  }
}
