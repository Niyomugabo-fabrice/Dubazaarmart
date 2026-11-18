import { MigrationInterface, QueryRunner } from 'typeorm'

export class ManagerStaffAuthentication20261118000004 implements MigrationInterface {
  name = 'ManagerStaffAuthentication20261118000004'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name text NOT NULL,
        last_name text NOT NULL DEFAULT '',
        email text NOT NULL,
        phone_number text,
        password_hash text NOT NULL,
        role text NOT NULL CHECK (role IN ('MANAGER', 'STAFF')),
        status text NOT NULL DEFAULT 'PENDING'
          CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING')),
        email_verified boolean NOT NULL DEFAULT false,
        permissions jsonb NOT NULL DEFAULT '[]'::jsonb
          CHECK (jsonb_typeof(permissions) = 'array'),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        last_login_at timestamptz,
        deleted_at timestamptz
      )
    `)
    await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (LOWER(email))')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS users_role_status_idx ON users (role, status)')

    if (await queryRunner.hasTable('admins')) {
      const unsupportedRoles = await queryRunner.query(
        `SELECT COUNT(*)::int AS count FROM admins WHERE role NOT IN ('admin', 'staff')`,
      ) as Array<{ count: number }>
      if (Number(unsupportedRoles[0]?.count ?? 0) > 0) {
        throw new Error('Cannot migrate admins: an account has an unsupported role.')
      }

      const duplicateEmails = await queryRunner.query(
        `SELECT LOWER(email) AS email FROM admins GROUP BY LOWER(email) HAVING COUNT(*) > 1 LIMIT 1`,
      ) as Array<{ email: string }>
      if (duplicateEmails.length > 0) {
        throw new Error('Cannot migrate admins: email addresses are not unique when normalized.')
      }

      await queryRunner.query(
        `INSERT INTO users (
          id, first_name, last_name, email, password_hash, role, status,
          email_verified, permissions, created_at, updated_at
        )
        SELECT
          id,
          COALESCE(NULLIF(SPLIT_PART(TRIM(name), ' ', 1), ''), 'Manager'),
          BTRIM(REGEXP_REPLACE(TRIM(name), '^\\S+\\s*', '')),
          LOWER(TRIM(email)),
          password_hash,
          CASE role WHEN 'admin' THEN 'MANAGER' ELSE 'STAFF' END,
          'ACTIVE',
          true,
          '[]'::jsonb,
          created_at,
          created_at
        FROM admins
        ON CONFLICT (id) DO NOTHING`,
      )
    }

    if (await queryRunner.hasTable('admin_refresh_tokens')) {
      await queryRunner.dropTable('admin_refresh_tokens')
    }
    if (await queryRunner.hasTable('admins')) {
      await queryRunner.dropTable('admins')
    }

    if (await queryRunner.hasTable('customers') && await queryRunner.hasColumn('customers', 'password_hash')) {
      await queryRunner.query('ALTER TABLE customers DROP COLUMN password_hash')
    }
    if (await queryRunner.hasTable('website_settings')) {
      await queryRunner.query(
        'ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS allow_staff_registration boolean NOT NULL DEFAULT false',
      )
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id bigserial PRIMARY KEY,
        actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        actor_name text,
        action text NOT NULL,
        target_resource text NOT NULL,
        target_id text,
        metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    await queryRunner.query('CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at DESC)')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS audit_logs_actor_user_id_idx ON audit_logs (actor_user_id)')
  }

  async down(): Promise<void> {
    throw new Error('This authentication migration is not automatically reversible. Restore from a reviewed backup.')
  }
}
