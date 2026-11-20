import { MigrationInterface, QueryRunner } from 'typeorm'

export class CompanyOrderProductReferences20261120020000 implements MigrationInterface {
  name = 'CompanyOrderProductReferences20261120020000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE company_order_items ADD COLUMN IF NOT EXISTS product_id uuid`)
    await queryRunner.query(`
      UPDATE company_order_items AS item
      SET product_id = (
        SELECT product.id
        FROM products AS product
        WHERE LOWER(product.name) = LOWER(item.product_name)
        ORDER BY product.created_at ASC
        LIMIT 1
      )
      WHERE item.product_id IS NULL
    `)
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE company_order_items
          ADD CONSTRAINT company_order_items_product_id_fkey
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS company_order_items_product_id_idx ON company_order_items(product_id)`)
  }

  async down(): Promise<void> {
    throw new Error('Purchase order product references are not automatically reversible. Restore from a reviewed backup.')
  }
}
