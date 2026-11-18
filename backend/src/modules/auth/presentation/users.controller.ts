import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import type { UserIdentity } from '../domain/user-account'
import { UserManagementService } from '../application/user-management.service'
import { Roles } from './auth.decorators'
import { AccessControlGuard } from './guards/access-control.guard'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import {
  CreateStaffDto,
  ListStaffQueryDto,
  UpdateStaffDto,
} from './dto/create-staff.dto'

type AuthenticatedRequest = Request & { user: UserIdentity }

@ApiTags('user management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('MANAGER')
@Controller('admin/users')
export class UsersController {
  constructor(private readonly users: UserManagementService) {}

  @Get()
  list(@Req() request: Request, @Query() query: ListStaffQueryDto) {
    return this.users.listStaff((request as AuthenticatedRequest).user, query)
  }

  @Get(':id')
  get(@Req() request: Request, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.users.getStaff((request as AuthenticatedRequest).user, id)
  }

  @Post()
  create(@Req() request: Request, @Body() dto: CreateStaffDto) {
    return this.users.createStaff((request as AuthenticatedRequest).user, dto)
  }

  @Patch(':id')
  update(@Req() request: Request, @Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateStaffDto) {
    return this.users.updateStaff((request as AuthenticatedRequest).user, id, dto)
  }

  @Patch(':id/activate')
  activate(@Req() request: Request, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.users.activateStaff((request as AuthenticatedRequest).user, id)
  }

  @Patch(':id/deactivate')
  deactivate(@Req() request: Request, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.users.deactivateStaff((request as AuthenticatedRequest).user, id)
  }

  @Patch(':id/verify')
  verify(@Req() request: Request, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.users.verifyStaff((request as AuthenticatedRequest).user, id)
  }

  @Patch(':id/promote-to-manager')
  promoteToManager(@Req() request: Request, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.users.promoteStaffToManager((request as AuthenticatedRequest).user, id)
  }

  @Patch(':id/suspend')
  suspend(@Req() request: Request, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.users.suspendStaff((request as AuthenticatedRequest).user, id)
  }

  @Delete(':id')
  delete(@Req() request: Request, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.users.deleteStaff((request as AuthenticatedRequest).user, id)
  }
}
