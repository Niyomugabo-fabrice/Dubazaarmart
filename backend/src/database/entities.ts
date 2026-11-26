import { UserEntity } from '../modules/auth/infrastructure/persistence/typeorm/user.entity'
import { AuditLogEntity } from '../modules/audit/infrastructure/persistence/typeorm/audit-log.entity'
import { ProductEntity } from '../modules/products/infrastructure/persistence/typeorm/product.entity'
import { OrderEntity } from '../modules/orders/infrastructure/persistence/typeorm/order.entity'
import { OrderItemEntity } from '../modules/orders/infrastructure/persistence/typeorm/order-item.entity'
import { OrderMessageEntity } from '../modules/orders/infrastructure/persistence/typeorm/order-message.entity'
import { OrderQuotationEntity } from '../modules/orders/infrastructure/persistence/typeorm/order-quotation.entity'
import { StockMovementEntity } from '../modules/inventory/infrastructure/persistence/typeorm/stock-movement.entity'
import { CompanyOrderEntity } from '../modules/procurement/infrastructure/persistence/typeorm/company-order.entity'
import { CompanyOrderItemEntity } from '../modules/procurement/infrastructure/persistence/typeorm/company-order-item.entity'
import { WebsiteSettingsEntity } from '../modules/settings/infrastructure/persistence/typeorm/website-settings.entity'
import { AnnouncementEntity } from '../modules/settings/infrastructure/persistence/typeorm/announcement.entity'
import { TestimonialEntity } from '../modules/testimonials/infrastructure/persistence/typeorm/testimonial.entity'
import { CategoryImageEntity } from '../modules/categories/infrastructure/persistence/typeorm/category-image.entity'
import { HeroSlideEntity } from '../modules/heroes/infrastructure/persistence/typeorm/hero-slide.entity'

export const databaseEntities = [
  UserEntity,
  AuditLogEntity,
  ProductEntity,
  OrderEntity,
  OrderItemEntity,
  OrderMessageEntity,
  OrderQuotationEntity,
  StockMovementEntity,
  CompanyOrderEntity,
  CompanyOrderItemEntity,
  WebsiteSettingsEntity,
  AnnouncementEntity,
  TestimonialEntity,
  CategoryImageEntity,
  HeroSlideEntity,
]
