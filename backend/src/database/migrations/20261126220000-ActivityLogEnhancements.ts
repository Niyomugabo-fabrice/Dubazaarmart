import type { MigrationInterface, QueryRunner } from 'typeorm'

export class ActivityLogEnhancements20261126220000 implements MigrationInterface {
  name = 'ActivityLogEnhancements20261126220000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE audit_logs
      ADD COLUMN IF NOT EXISTS record_number text,
      ADD COLUMN IF NOT EXISTS old_values jsonb,
      ADD COLUMN IF NOT EXISTS new_values jsonb
    `)
    await queryRunner.query('CREATE INDEX IF NOT EXISTS audit_logs_record_number_idx ON audit_logs (record_number)')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs (action)')
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS audit_logs_action_idx')
    await queryRunner.query('DROP INDEX IF EXISTS audit_logs_record_number_idx')
    await queryRunner.query(`
      ALTER TABLE audit_logs
      DROP COLUMN IF EXISTS new_values,
      DROP COLUMN IF EXISTS old_values,
      DROP COLUMN IF EXISTS record_number
    `)
  }
}
