import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { ProductEntity } from '../products/infrastructure/persistence/typeorm/product.entity'
import { StockMovementEntity } from '../inventory/infrastructure/persistence/typeorm/stock-movement.entity'
import { CompanyOrderEntity } from './infrastructure/persistence/typeorm/company-order.entity'
import { CompanyOrderItemEntity } from './infrastructure/persistence/typeorm/company-order-item.entity'
import { TypeOrmProcurementRepository } from './infrastructure/persistence/typeorm/typeorm-procurement.repository'
import { PROCUREMENT_REPOSITORY } from './domain/procurement.repository'
import { ProcurementService } from './application/procurement.service'
import { ProcurementController } from './presentation/procurement.controller'

@Module({
  imports: [TypeOrmModule.forFeature([CompanyOrderEntity, CompanyOrderItemEntity, ProductEntity, StockMovementEntity]), AuthModule],
  controllers: [ProcurementController],
  providers: [
    ProcurementService,
    TypeOrmProcurementRepository,
    { provide: PROCUREMENT_REPOSITORY, useExisting: TypeOrmProcurementRepository },
  ],
})
export class ProcurementModule {}
