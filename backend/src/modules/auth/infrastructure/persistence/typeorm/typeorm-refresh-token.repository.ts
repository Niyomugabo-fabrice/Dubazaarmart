import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import type { RefreshTokenRecord, RefreshTokenRepository } from '../../../domain/refresh-token.repository'
import { AdminRefreshTokenEntity } from './admin-refresh-token.entity'

@Injectable()
export class TypeOrmRefreshTokenRepository implements RefreshTokenRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async save(record: RefreshTokenRecord): Promise<void> {
    await this.dataSource.getRepository(AdminRefreshTokenEntity).insert({
      ...record,
      revokedAt: null,
    })
  }

  async rotate(oldTokenId: string, oldTokenHash: string, next: RefreshTokenRecord): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const result = await manager.getRepository(AdminRefreshTokenEntity)
        .createQueryBuilder()
        .update()
        .set({ revokedAt: new Date() })
        .where('id = :oldTokenId AND token_hash = :oldTokenHash AND revoked_at IS NULL AND expires_at > NOW()', {
          oldTokenId,
          oldTokenHash,
        })
        .execute()
      if (result.affected !== 1) return false

      await manager.getRepository(AdminRefreshTokenEntity).insert({
        ...next,
        revokedAt: null,
      })
      return true
    })
  }

  async revoke(tokenId: string, tokenHash: string): Promise<void> {
    await this.dataSource.getRepository(AdminRefreshTokenEntity)
      .createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where('id = :tokenId AND token_hash = :tokenHash AND revoked_at IS NULL', { tokenId, tokenHash })
      .execute()
  }
}
