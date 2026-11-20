import { ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateHeroSlideDto {
  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  heading?: string

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  subheading?: string

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  buttonText?: string

  @ApiPropertyOptional({ maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  buttonLink?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === true || value === false) return value
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isActive?: boolean
}

export class UpdateHeroSlideDto extends PartialType(CreateHeroSlideDto) {}

export class ReorderHeroSlidesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  slideIds!: string[]
}
