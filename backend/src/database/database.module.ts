import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { databaseOptions } from './database.options'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => databaseOptions(config.getOrThrow<string>('DATABASE_URL')),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
