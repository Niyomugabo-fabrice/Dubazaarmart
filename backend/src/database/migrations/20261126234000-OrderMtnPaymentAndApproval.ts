import type { MigrationInterface, QueryRunner } from 'typeorm'

export class OrderMtnPaymentAndApproval20261126234000 implements MigrationInterface {
  name = 'OrderMtnPaymentAndApproval20261126234000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'shopping',
      ADD COLUMN IF NOT EXISTS mtn_transaction_id text,
      ADD COLUMN IF NOT EXISTS payment_approved_at timestamptz,
      ADD COLUMN IF NOT EXISTS payment_approved_by text,
      ADD COLUMN IF NOT EXISTS payment_rejection_reason text
    `)

    await queryRunner.query('CREATE INDEX IF NOT EXISTS orders_order_type_idx ON orders (order_type)')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders (payment_status)')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS orders_mtn_transaction_id_idx ON orders (mtn_transaction_id)')
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS orders_mtn_transaction_id_idx')
    await queryRunner.query('DROP INDEX IF EXISTS orders_payment_status_idx')
    await queryRunner.query('DROP INDEX IF EXISTS orders_order_type_idx')
    await queryRunner.query(`
      ALTER TABLE orders
      DROP COLUMN IF EXISTS payment_rejection_reason,
      DROP COLUMN IF EXISTS payment_approved_by,
      DROP COLUMN IF EXISTS payment_approved_at,
      DROP COLUMN IF EXISTS mtn_transaction_id,
      DROP COLUMN IF EXISTS order_type
    `)
  }
}
