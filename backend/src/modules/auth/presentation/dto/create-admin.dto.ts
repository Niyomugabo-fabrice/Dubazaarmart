import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateAdminDto {
  @ApiProperty({ example: 'Jean-Paul Admin' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string

  @ApiProperty({ example: 'admin2@dubazaarmart.rw' })
  @IsEmail()
  @IsNotEmpty()
  email!: string

  @ApiProperty({ minLength: 12, example: 'SecureP@ssw0rd2026!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  password!: string

  @ApiProperty({ required: false, enum: ['admin'], default: 'admin' })
  @IsOptional()
  @IsIn(['admin'])
  role?: 'admin'
}
