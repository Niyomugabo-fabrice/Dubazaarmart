import { MigrationInterface, QueryRunner } from 'typeorm'

export class OrderAdminNotes20261119213000 implements MigrationInterface {
  name = 'OrderAdminNotes20261119213000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes text NOT NULL DEFAULT ''",
    )
  }

  async down(): Promise<void> {
    throw new Error('Order admin notes are not automatically reversible. Restore from a reviewed backup.')
  }
}
