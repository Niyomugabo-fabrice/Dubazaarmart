import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { ProductEntity } from '../products/infrastructure/persistence/typeorm/product.entity'
import { StockMovementEntity } from './infrastructure/persistence/typeorm/stock-movement.entity'
import { TypeOrmInventoryRepository } from './infrastructure/persistence/typeorm/typeorm-inventory.repository'
import { INVENTORY_REPOSITORY } from './domain/inventory.repository'
import { InventoryService } from './application/inventory.service'
import { InventoryController } from './presentation/inventory.controller'

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity, StockMovementEntity]), AuthModule],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    TypeOrmInventoryRepository,
    { provide: INVENTORY_REPOSITORY, useExisting: TypeOrmInventoryRepository },
  ],
})
export class InventoryModule {}
