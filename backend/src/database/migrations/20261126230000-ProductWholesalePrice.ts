import type { MigrationInterface, QueryRunner } from 'typeorm'

export class ProductWholesalePrice20261126230000 implements MigrationInterface {
  name = 'ProductWholesalePrice20261126230000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS wholesale_price numeric(14,2)
    `)
    await queryRunner.query(`
      UPDATE products
      SET wholesale_price = price
      WHERE wholesale_price IS NULL
    `)
    await queryRunner.query(`
      ALTER TABLE products
      ADD CONSTRAINT products_wholesale_price_check
      CHECK (wholesale_price IS NULL OR wholesale_price > 0)
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_wholesale_price_check')
    await queryRunner.query('ALTER TABLE products DROP COLUMN IF EXISTS wholesale_price')
  }
}
