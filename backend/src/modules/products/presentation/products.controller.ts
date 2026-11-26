import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { ProductService } from '../application/product.service'
import { CreateProductDto, UpdateProductDto } from './dto/product.dto'
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard'
import { AccessControlGuard } from '../../auth/presentation/guards/access-control.guard'
import { CurrentUser, Permissions, Roles } from '../../auth/presentation/auth.decorators'
import type { UserIdentity } from '../../auth/domain/user-account'

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductService) {}

  @Get()
  findCatalog(
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.products.findCatalog({
      activeOnly: true,
      search,
      category,
    })
  }

  @Post()
  @UseGuards(JwtAuthGuard, AccessControlGuard)
  @Roles('MANAGER', 'STAFF')
  @Permissions('products.create')
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: UserIdentity | undefined,
    @Req() request: Request & { auditLogged?: boolean },
  ) {
    request.auditLogged = true
    return this.products.create(dto, user)
  }
}

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessControlGuard)
@Roles('MANAGER', 'STAFF')
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly products: ProductService) {}

  @Get()
  @Permissions('products.view')
  findAll() {
    return this.products.findAll()
  }

  @Post()
  @Permissions('products.create')
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: UserIdentity | undefined,
    @Req() request: Request & { auditLogged?: boolean },
  ) {
    request.auditLogged = true
    return this.products.create(dto, user)
  }

  @Patch(':id')
  @Permissions('products.update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: UserIdentity | undefined,
    @Req() request: Request & { auditLogged?: boolean },
  ) {
    request.auditLogged = true
    return this.products.update(id, dto, user)
  }

  @Delete(':id')
  @Permissions('products.delete')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: UserIdentity | undefined,
    @Req() request: Request & { auditLogged?: boolean },
  ) {
    request.auditLogged = true
    return this.products.remove(id, user)
  }
}
