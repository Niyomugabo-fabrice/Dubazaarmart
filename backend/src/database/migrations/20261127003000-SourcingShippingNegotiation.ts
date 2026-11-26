import type { MigrationInterface, QueryRunner } from 'typeorm'

export class SourcingShippingNegotiation20261127003000 implements MigrationInterface {
  name = 'SourcingShippingNegotiation20261127003000'

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add request_details column to orders table
    await queryRunner.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS request_details jsonb NOT NULL DEFAULT '{}'::jsonb
    `)

    // 2. Drop any check constraint restricting payment_status so 'UNPAID' and 'WAITING_APPROVAL' are fully allowed
    await queryRunner.query(`
      ALTER TABLE orders
      DROP CONSTRAINT IF EXISTS orders_payment_status_check
    `)

    // 3. Create order_messages table for negotiation message threads
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS order_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        sender_type text NOT NULL CHECK (sender_type IN ('customer', 'staff', 'system')),
        sender_name text NOT NULL,
        sender_id text,
        message text NOT NULL,
        attachments jsonb DEFAULT '[]'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    await queryRunner.query('CREATE INDEX IF NOT EXISTS order_messages_order_idx ON order_messages (order_id, created_at)')

    // 4. Create order_quotations table for versioned quotations (v1, v2, ...)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS order_quotations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        version integer NOT NULL,
        product_cost numeric(14, 2) NOT NULL DEFAULT 0 CHECK (product_cost >= 0),
        sourcing_fee numeric(14, 2) NOT NULL DEFAULT 0 CHECK (sourcing_fee >= 0),
        shipping_cost numeric(14, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
        total_amount numeric(14, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
        notes text,
        status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'SUPERSEDED')),
        created_by text NOT NULL,
        created_by_user_id text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    await queryRunner.query('CREATE INDEX IF NOT EXISTS order_quotations_order_idx ON order_quotations (order_id, version)')
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS order_quotations')
    await queryRunner.query('DROP TABLE IF EXISTS order_messages')
    await queryRunner.query(`
      ALTER TABLE orders
      DROP COLUMN IF EXISTS request_details
    `)
  }
}
