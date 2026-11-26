import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'
import { AuditService } from '../application/audit.service'
import { Roles } from '../../auth/presentation/auth.decorators'
import { AccessControlGuard } from '../../auth/presentation/guards/access-control.guard'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'

class AuditLogQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 25

  @IsOptional()
  @IsString()
  @MaxLength(100)
  action?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetResource?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  worker?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  actorUserId?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  recordNumber?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  startDate?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  endDate?: string
}

@ApiTags('audit logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('MANAGER')
@Controller('admin/audit-logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query() query: AuditLogQueryDto) {
    return this.audit.list(query)
  }
}
