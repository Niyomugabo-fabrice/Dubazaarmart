import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class RegisterCustomerDto {
  @ApiProperty({ minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/\S/)
  name!: string

  @ApiProperty({ example: 'customer@example.com', maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string

  @ApiProperty({ minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string
}
