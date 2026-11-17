import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminEntity } from './infrastructure/persistence/typeorm/admin.entity'
import { AdminRefreshTokenEntity } from './infrastructure/persistence/typeorm/admin-refresh-token.entity'
import { TypeOrmAdminRepository } from './infrastructure/persistence/typeorm/typeorm-admin.repository'
import { TypeOrmRefreshTokenRepository } from './infrastructure/persistence/typeorm/typeorm-refresh-token.repository'
import { ADMIN_REPOSITORY } from './domain/auth.repository'
import { REFRESH_TOKEN_REPOSITORY } from './domain/refresh-token.repository'
import { AuthService } from './application/auth.service'
import { AuthController } from './presentation/auth.controller'
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard'
import { AccessControlGuard } from './presentation/guards/access-control.guard'

@Module({
  imports: [TypeOrmModule.forFeature([AdminEntity, AdminRefreshTokenEntity])],
  controllers: [AuthController],
  providers: [
    AuthService,
    TypeOrmAdminRepository,
    TypeOrmRefreshTokenRepository,
    { provide: ADMIN_REPOSITORY, useExisting: TypeOrmAdminRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useExisting: TypeOrmRefreshTokenRepository },
    JwtAuthGuard,
    AccessControlGuard,
  ],
  exports: [AuthService, JwtAuthGuard, AccessControlGuard],
})
export class AuthModule {}
