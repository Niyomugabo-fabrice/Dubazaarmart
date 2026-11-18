import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserManagementService } from './application/user-management.service'
import { AuthService } from './application/auth.service'
import { USER_REPOSITORY } from './domain/user.repository'
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm/typeorm-user.repository'
import { UserEntity } from './infrastructure/persistence/typeorm/user.entity'
import { AuthController } from './presentation/auth.controller'
import { UsersController } from './presentation/users.controller'
import { AccessControlGuard } from './presentation/guards/access-control.guard'
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [AuthController, UsersController],
  providers: [
    AuthService,
    UserManagementService,
    TypeOrmUserRepository,
    { provide: USER_REPOSITORY, useExisting: TypeOrmUserRepository },
    JwtAuthGuard,
    AccessControlGuard,
  ],
  exports: [AuthService, UserManagementService, JwtAuthGuard, AccessControlGuard],
})
export class AuthModule {}
