import type { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { databaseEntities } from './entities'
import { InitialStoreSchema20261117000000 } from './migrations/20261117000000-InitialStoreSchema'
import { AdminRefreshTokens20261117000001 } from './migrations/20261117000001-AdminRefreshTokens'

export function databaseOptions(databaseUrl: string): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    url: databaseUrl,
    entities: databaseEntities,
    migrations: [InitialStoreSchema20261117000000, AdminRefreshTokens20261117000001],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    migrationsRun: false,
    dropSchema: false,
    logging: false,
    extra: { max: 10, application_name: 'dubazaarmart-backend' },
  }
}
