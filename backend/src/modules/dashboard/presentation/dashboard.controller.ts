import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { DashboardService } from '../application/dashboard.service'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { AccessControlGuard } from '../../auth/presentation/guards/access-control.guard'
import { Permissions, Roles } from '../../auth/presentation/auth.decorators'
import type { UserIdentity } from '../../auth/domain/user-account'

type AuthenticatedRequest = Request & { user: UserIdentity }

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('MANAGER', 'STAFF')
@Permissions('reports.view')
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  getDashboard(@Query('range') range: string | undefined, @Req() request: Request) {
    const includeCustomerDetails = (request as AuthenticatedRequest).user.role === 'MANAGER'
    return this.dashboard.getDashboard(range, includeCustomerDetails)
  }
}
