import type { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { databaseEntities } from './entities'
import { InitialStoreSchema20261117000000 } from './migrations/20261117000000-InitialStoreSchema'
import { AdminRefreshTokens20261117000001 } from './migrations/20261117000001-AdminRefreshTokens'
import { CustomerPasswordHash20261118000002 } from './migrations/20261118000002-CustomerPasswordHash'
import { SoftDeleteBusinessRecords20261118000003 } from './migrations/20261118000003-SoftDeleteBusinessRecords'
import { ManagerStaffAuthentication20261118000004 } from './migrations/20261118000004-ManagerStaffAuthentication'
import { RemoveCustomerAccounts20261119000001 } from './migrations/20261119000001-RemoveCustomerAccounts'
import { ProductSlugs20261119000002 } from './migrations/20261119000002-ProductSlugs'
import { AnnouncementsManagement20261119000000 } from './migrations/20261119000000-AnnouncementsManagement'
import { OrderAdminNotes20261119213000 } from './migrations/20261119213000-OrderAdminNotes'

export function databaseOptions(databaseUrl: string): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    url: databaseUrl,
    entities: databaseEntities,
    migrations: [
      InitialStoreSchema20261117000000,
      AdminRefreshTokens20261117000001,
      CustomerPasswordHash20261118000002,
      SoftDeleteBusinessRecords20261118000003,
      ManagerStaffAuthentication20261118000004,
      AnnouncementsManagement20261119000000,
      RemoveCustomerAccounts20261119000001,
      ProductSlugs20261119000002,
      OrderAdminNotes20261119213000,
    ],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    migrationsRun: false,
    dropSchema: false,
    logging: false,
    extra: { max: 10, application_name: 'dubazaarmart-backend' },
  }
}
