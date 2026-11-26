import type { MigrationInterface, QueryRunner } from 'typeorm'

export class ProductMoqAndListingType20261126224000 implements MigrationInterface {
  name = 'ProductMoqAndListingType20261126224000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS moq integer NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'both'
    `)
    await queryRunner.query('CREATE INDEX IF NOT EXISTS products_listing_type_idx ON products (listing_type)')
    await queryRunner.query('ALTER TABLE products ADD CONSTRAINT products_moq_check CHECK (moq >= 1)')
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_moq_check')
    await queryRunner.query('DROP INDEX IF EXISTS products_listing_type_idx')
    await queryRunner.query(`
      ALTER TABLE products
      DROP COLUMN IF EXISTS listing_type,
      DROP COLUMN IF EXISTS moq
    `)
  }
}
