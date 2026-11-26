import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { ProductsModule } from '../products/products.module'
import { SettingsModule } from '../settings/settings.module'
import { OrderEntity } from './infrastructure/persistence/typeorm/order.entity'
import { OrderItemEntity } from './infrastructure/persistence/typeorm/order-item.entity'
import { OrderMessageEntity } from './infrastructure/persistence/typeorm/order-message.entity'
import { OrderQuotationEntity } from './infrastructure/persistence/typeorm/order-quotation.entity'
import { ProductEntity } from '../products/infrastructure/persistence/typeorm/product.entity'
import { StockMovementEntity } from '../inventory/infrastructure/persistence/typeorm/stock-movement.entity'
import { TypeOrmOrderRepository } from './infrastructure/persistence/typeorm/typeorm-order.repository'
import { ORDER_REPOSITORY } from './domain/order.repository'
import { OrderEventsService } from './application/order-events.service'
import { OrderService } from './application/order.service'
import { AdminOrdersController, OrdersController } from './presentation/orders.controller'

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, OrderItemEntity, OrderMessageEntity, OrderQuotationEntity, ProductEntity, StockMovementEntity]), AuthModule, ProductsModule, SettingsModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [
    OrderService,
    OrderEventsService,
    TypeOrmOrderRepository,
    { provide: ORDER_REPOSITORY, useExisting: TypeOrmOrderRepository },
  ],
  exports: [OrderService, OrderEventsService],
})
export class OrdersModule {}
