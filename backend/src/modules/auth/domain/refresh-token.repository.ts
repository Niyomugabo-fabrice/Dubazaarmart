export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY')

export interface RefreshTokenRecord {
  id: string
  adminId: string
  tokenHash: string
  expiresAt: Date
}

export interface RefreshTokenRepository {
  save(record: RefreshTokenRecord): Promise<void>
  rotate(oldTokenId: string, oldTokenHash: string, next: RefreshTokenRecord): Promise<boolean>
  revoke(tokenId: string, tokenHash: string): Promise<void>
}
