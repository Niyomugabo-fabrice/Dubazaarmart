import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ArrayUnique, IsArray, IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator'
import { STAFF_PERMISSION_KEYS, type StaffPermission, type UserStatus } from '../../domain/user-account'
import { RegisterStaffDto } from './register-staff.dto'

const USER_STATUSES: UserStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']

export class CreateStaffDto extends RegisterStaffDto {
  @ApiPropertyOptional({ enum: USER_STATUSES, default: 'PENDING' })
  @IsOptional()
  @IsIn(USER_STATUSES)
  status?: UserStatus

  @ApiPropertyOptional({ enum: STAFF_PERMISSION_KEYS, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn([...STAFF_PERMISSION_KEYS], { each: true })
  permissions?: StaffPermission[]
}

export class UpdateStaffDto {
  @ApiPropertyOptional({ minLength: 2, maxLength: 60 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  firstName?: string

  @ApiPropertyOptional({ minLength: 2, maxLength: 60 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  lastName?: string

  @ApiPropertyOptional({ maxLength: 254 })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string

  @ApiPropertyOptional({ maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phoneNumber?: string | null
}

export class UpdateStaffPermissionsDto {
  @ApiPropertyOptional({ enum: STAFF_PERMISSION_KEYS, isArray: true })
  @IsArray()
  @ArrayUnique()
  @IsIn([...STAFF_PERMISSION_KEYS], { each: true })
  permissions!: StaffPermission[]
}

export class ListStaffQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Max(100)
  search?: string

  @ApiPropertyOptional({ enum: USER_STATUSES })
  @IsOptional()
  @IsIn(USER_STATUSES)
  status?: UserStatus

  @ApiPropertyOptional({ enum: ['name', 'email', 'status', 'createdAt', 'lastLoginAt'] })
  @IsOptional()
  @IsIn(['name', 'email', 'status', 'createdAt', 'lastLoginAt'])
  sortBy: 'name' | 'email' | 'status' | 'createdAt' | 'lastLoginAt' = 'createdAt'

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder: 'ASC' | 'DESC' = 'DESC'
}
