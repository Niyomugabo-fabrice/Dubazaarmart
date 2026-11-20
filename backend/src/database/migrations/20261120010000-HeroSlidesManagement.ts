import { MigrationInterface, QueryRunner } from 'typeorm'

export class HeroSlidesManagement20261120010000 implements MigrationInterface {
  name = 'HeroSlidesManagement20261120010000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS hero_slides (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        image_url text NOT NULL,
        heading text,
        subheading text,
        button_text text,
        button_link text,
        sort_order integer NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS hero_slides_active_sort_order_idx
      ON hero_slides (is_active, sort_order)
    `)
  }

  async down(): Promise<void> {
    throw new Error('Hero slide data is not automatically reversible. Restore from a reviewed backup.')
  }
}
