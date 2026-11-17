import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { TypeOrmDashboardRepository } from './infrastructure/persistence/typeorm/typeorm-dashboard.repository'
import { DASHBOARD_REPOSITORY } from './domain/dashboard.repository'
import { DashboardService } from './application/dashboard.service'
import { DashboardController } from './presentation/dashboard.controller'

@Module({
  imports: [AuthModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    TypeOrmDashboardRepository,
    { provide: DASHBOARD_REPOSITORY, useExisting: TypeOrmDashboardRepository },
  ],
})
export class DashboardModule {}
