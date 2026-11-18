import { MigrationInterface, QueryRunner } from 'typeorm'

export class CustomerPasswordHash20261118000002 implements MigrationInterface {
  name = 'CustomerPasswordHash20261118000002'

  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('customers', 'password_hash')) return
    await queryRunner.query('ALTER TABLE customers ADD COLUMN password_hash text')
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('customers', 'password_hash')) {
      await queryRunner.query('ALTER TABLE customers DROP COLUMN password_hash')
    }
  }
}
