import { MigrationInterface, QueryRunner } from 'typeorm'

export class SoftDeleteBusinessRecords20261118000003 implements MigrationInterface {
  name = 'SoftDeleteBusinessRecords20261118000003'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz')
    await queryRunner.query('ALTER TABLE "company_orders" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz')
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "company_orders" DROP COLUMN IF EXISTS "deleted_at"')
    await queryRunner.query('ALTER TABLE "orders" DROP COLUMN IF EXISTS "deleted_at"')
  }
}
