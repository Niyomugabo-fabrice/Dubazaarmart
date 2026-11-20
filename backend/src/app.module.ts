import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './modules/auth/auth.module'
import { ProductsModule } from './modules/products/products.module'
import { OrdersModule } from './modules/orders/orders.module'
import { InventoryModule } from './modules/inventory/inventory.module'
import { ProcurementModule } from './modules/procurement/procurement.module'
import { SettingsModule } from './modules/settings/settings.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { HealthModule } from './modules/health/health.module'
import { MediaModule } from './modules/media/media.module'
import { AuditModule } from './modules/audit/audit.module'
import { TestimonialsModule } from './modules/testimonials/testimonials.module'
import { CategoriesModule } from './modules/categories/categories.module'
import { HeroesModule } from './modules/heroes/heroes.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'backend/.env', '../.env'],
      validate: validateEnvironment,
    }),
    DatabaseModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    InventoryModule,
    ProcurementModule,
    SettingsModule,
    DashboardModule,
    HealthModule,
    MediaModule,
    AuditModule,
    TestimonialsModule,
    CategoriesModule,
    HeroesModule,
  ],
})
export class AppModule {}

function validateEnvironment(environment: Record<string, unknown>) {
  for (const key of ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    if (typeof environment[key] !== 'string' || !(environment[key] as string).trim()) {
      throw new Error(`${key} is required in the backend environment.`)
    }
  }
  if (String(environment.JWT_SECRET).length < 32 || String(environment.JWT_REFRESH_SECRET).length < 32) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must each contain at least 32 characters.')
  }
  if (environment.JWT_SECRET === environment.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different values.')
  }
  return environment
}
