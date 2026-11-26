import { MigrationInterface, QueryRunner } from 'typeorm'

export class WorkerRolesAndPermissions20261126210000 implements MigrationInterface {
  name = 'WorkerRolesAndPermissions20261126210000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS worker_role text DEFAULT 'STAFF'`)
    await queryRunner.query(`UPDATE users SET worker_role = 'STAFF' WHERE worker_role IS NULL AND role = 'STAFF'`)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS users_worker_role_idx ON users (worker_role)`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS users_worker_role_idx`)
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS worker_role`)
  }
}
