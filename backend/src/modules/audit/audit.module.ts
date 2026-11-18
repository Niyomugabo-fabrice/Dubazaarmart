import { Global, Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { AuditLogEntity } from './infrastructure/persistence/typeorm/audit-log.entity'
import { AuditService } from './application/audit.service'
import { AuditController } from './presentation/audit.controller'
import { AuditInterceptor } from './presentation/audit.interceptor'

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity]), AuthModule],
  controllers: [AuditController],
  providers: [
    AuditService,
    AuditInterceptor,
    { provide: APP_INTERCEPTOR, useExisting: AuditInterceptor },
  ],
  exports: [AuditService],
})
export class AuditModule {}
