import { MigrationInterface, QueryRunner } from 'typeorm'

export class CategoryImages20261119234000 implements MigrationInterface {
  name = 'CategoryImages20261119234000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS category_images (
        category_id text PRIMARY KEY,
        image_url text NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
  }

  async down(): Promise<void> {
    throw new Error('Category image data is not automatically reversible. Restore from a reviewed backup.')
  }
}
