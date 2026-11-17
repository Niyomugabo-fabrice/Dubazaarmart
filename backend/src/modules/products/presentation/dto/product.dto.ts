import { ApiProperty, PartialType } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator'

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name!: string

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  price!: number

  @IsOptional() @IsString() brand?: string
  @IsOptional() @IsString() category?: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsString() sku?: string
  @IsOptional() @Transform(({ value }) => Number(value)) @IsNumber() @Min(0) originalPrice?: number
  @IsOptional() @Transform(({ value }) => Number(value)) @IsNumber() @Min(0) discount?: number
  @IsOptional() @Transform(({ value }) => Number(value)) @IsNumber() @Min(0) quantity?: number
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
