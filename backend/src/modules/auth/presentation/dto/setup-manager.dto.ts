import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'

export class SetupManagerDto {
  @ApiProperty({ minLength: 2, maxLength: 60 })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  firstName!: string

  @ApiProperty({ minLength: 2, maxLength: 60 })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  lastName!: string

  @ApiProperty({ maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string

  @ApiProperty({ minLength: 12, maxLength: 72 })
  @IsString()
  @MinLength(12)
  @MaxLength(72)
  password!: string
}
