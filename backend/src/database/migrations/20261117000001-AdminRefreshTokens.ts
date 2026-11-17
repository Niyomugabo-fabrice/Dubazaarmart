import { MigrationInterface, QueryRunner } from 'typeorm'

export class AdminRefreshTokens20261117000001 implements MigrationInterface {
  name = 'AdminRefreshTokens20261117000001'

  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('admin_refresh_tokens')) return

    await queryRunner.query(`
      CREATE TABLE admin_refresh_tokens (
        id uuid PRIMARY KEY,
        admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
        token_hash text NOT NULL UNIQUE,
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    await queryRunner.query('CREATE INDEX admin_refresh_tokens_admin_id_idx ON admin_refresh_tokens (admin_id)')
    await queryRunner.query('CREATE INDEX admin_refresh_tokens_expires_at_idx ON admin_refresh_tokens (expires_at)')
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('admin_refresh_tokens')) {
      await queryRunner.dropTable('admin_refresh_tokens')
    }
  }
}
