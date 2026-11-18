import 'dotenv/config'
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { databaseEntities } from './entities'
import { InitialStoreSchema20261117000000 } from './migrations/20261117000000-InitialStoreSchema'
import { AdminRefreshTokens20261117000001 } from './migrations/20261117000001-AdminRefreshTokens'
import { CustomerPasswordHash20261118000002 } from './migrations/20261118000002-CustomerPasswordHash'
import { SoftDeleteBusinessRecords20261118000003 } from './migrations/20261118000003-SoftDeleteBusinessRecords'

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: databaseEntities,
  migrations: [
    InitialStoreSchema20261117000000,
    AdminRefreshTokens20261117000001,
    CustomerPasswordHash20261118000002,
    SoftDeleteBusinessRecords20261118000003,
  ],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  migrationsRun: false,
  dropSchema: false,
  logging: false,
  extra: { max: 10, application_name: 'dubazaarmart-backend' },
})
