import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { ProductEntity } from './infrastructure/persistence/typeorm/product.entity'
import { TypeOrmProductRepository } from './infrastructure/persistence/typeorm/typeorm-product.repository'
import { PRODUCT_REPOSITORY } from './domain/product.repository'
import { ProductService } from './application/product.service'
import { AdminProductsController, ProductsController } from './presentation/products.controller'

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity]), AuthModule],
  controllers: [ProductsController, AdminProductsController],
  providers: [
    ProductService,
    TypeOrmProductRepository,
    { provide: PRODUCT_REPOSITORY, useExisting: TypeOrmProductRepository },
  ],
  exports: [ProductService, TypeOrmProductRepository],
})
export class ProductsModule {}
