import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ProductService } from '../application/product.service'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { AccessControlGuard } from '../../auth/presentation/guards/access-control.guard'
import { Roles } from '../../auth/presentation/auth.decorators'
import { CreateProductDto, UpdateProductDto } from './dto/product.dto'

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Browse and search the product catalog' })
  findCatalog(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.products.findCatalog({ category, search, activeOnly: activeOnly !== 'false' })
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AccessControlGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create a product' })
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto)
  }
}

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('admin')
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly products: ProductService) {}

  @Get()
  findAll() {
    return this.products.findAll()
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.products.remove(id)
  }
}
