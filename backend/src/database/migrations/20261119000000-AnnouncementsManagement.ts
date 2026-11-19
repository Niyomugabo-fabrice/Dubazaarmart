import { MigrationInterface, QueryRunner } from 'typeorm'

export class AnnouncementsManagement20261119000000 implements MigrationInterface {
  name = 'AnnouncementsManagement20261119000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('announcements'))) {
      await queryRunner.query(`
        CREATE TABLE announcements (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          title text NOT NULL,
          message text NOT NULL,
          link text,
          is_active boolean NOT NULL DEFAULT false,
          start_date timestamptz,
          end_date timestamptz,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `)
      return
    }

    await queryRunner.query('ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link text')
    const hadUpdatedAt = await queryRunner.hasColumn('announcements', 'updated_at')
    await queryRunner.query(
      'ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()',
    )

    const hasActive = await queryRunner.hasColumn('announcements', 'active')
    const hasIsActive = await queryRunner.hasColumn('announcements', 'is_active')
    if (hasActive && !hasIsActive) {
      await queryRunner.query('ALTER TABLE announcements RENAME COLUMN active TO is_active')
    } else if (!hasActive && !hasIsActive) {
      await queryRunner.query('ALTER TABLE announcements ADD COLUMN is_active boolean NOT NULL DEFAULT false')
    }

    await queryRunner.query('ALTER TABLE announcements ALTER COLUMN is_active SET DEFAULT false')
    if (!hadUpdatedAt) {
      await queryRunner.query('UPDATE announcements SET updated_at = created_at')
    }
  }

  async down(): Promise<void> {
    throw new Error('This announcements migration is not automatically reversible. Restore from a reviewed backup.')
  }
}
