import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveCustomerAccounts20261119000001 implements MigrationInterface {
  name = 'RemoveCustomerAccounts20261119000001'

  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('orders') && await queryRunner.hasColumn('orders', 'customer_id')) {
      await queryRunner.query('ALTER TABLE orders DROP COLUMN customer_id')
    }
    if (await queryRunner.hasTable('customers')) {
      await queryRunner.dropTable('customers')
    }
  }

  async down(): Promise<void> {
    throw new Error('The removed customers table cannot be restored by this migration; order contact details remain.')
  }
}
