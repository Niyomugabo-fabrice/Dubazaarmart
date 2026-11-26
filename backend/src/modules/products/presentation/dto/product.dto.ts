import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsObject, IsOptional, IsPositive, IsString, Min } from 'class-validator'

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name!: string

  @ApiProperty({ description: 'Unit price in RWF, must be positive' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsPositive({ message: 'Unit price must be positive (greater than 0).' })
  price!: number

  @ApiPropertyOptional({ description: 'Wholesale unit price in RWF, must be positive' })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null && value !== '' ? Number(value) : undefined))
  @IsNumber()
  @IsPositive({ message: 'Wholesale price must be positive (greater than 0).' })
  wholesalePrice?: number

  @ApiPropertyOptional({ description: 'Minimum Order Quantity for wholesale (must be whole number >= 1)', default: 1 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null && value !== '' ? Number(value) : undefined))
  @IsInt({ message: 'MOQ must be a whole number of 1 or more.' })
  @Min(1, { message: 'MOQ must be a whole number of 1 or more.' })
  moq?: number

  @ApiPropertyOptional({ description: 'Where product appears', enum: ['wholesale', 'retail', 'both'], default: 'both' })
  @IsOptional()
  @IsString()
  @IsIn(['wholesale', 'retail', 'both', 'WHOLESALE', 'RETAIL', 'BOTH'], {
    message: 'Where it appears must be Wholesale, Shopping (retail), or both.',
  })
  listingType?: string

  @ApiPropertyOptional({ description: 'Stock quantity available' })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null && value !== '' ? Number(value) : undefined))
  @IsInt({ message: 'Stock quantity must be a whole number of 0 or more.' })
  @Min(0, { message: 'Stock quantity cannot be negative.' })
  quantity?: number

  @IsOptional() @IsString() brand?: string
  @IsOptional() @IsString() category?: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsString() sku?: string
  @IsOptional() @Transform(({ value }) => Number(value)) @IsNumber() @Min(0) originalPrice?: number
  @IsOptional() @Transform(({ value }) => Number(value)) @IsNumber() @Min(0) discount?: number
  @IsOptional() @IsBoolean() active?: boolean
  @IsOptional() @IsString() image?: string
  @IsOptional() @IsArray() images?: string[]
  @IsOptional() @IsString() condition?: string
  @IsOptional() @IsObject() specs?: Record<string, unknown>
  @IsOptional() @IsString() warranty?: string
  @IsOptional() @IsBoolean() featured?: boolean
  @IsOptional() @Transform(({ value }) => Number(value)) @IsNumber() rating?: number
  @IsOptional() @Transform(({ value }) => Number(value)) @IsNumber() reviews?: number
  @IsOptional() @IsString() badge?: string
  @IsOptional() @Transform(({ value }) => Number(value)) @IsNumber() @Min(1) expectedFullStock?: number
  @IsOptional() @Transform(({ value }) => Number(value)) @IsNumber() @Min(0) unitCost?: number
  @IsOptional() @Transform(({ value }) => Number(value)) @IsNumber() @Min(0) minStock?: number
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
