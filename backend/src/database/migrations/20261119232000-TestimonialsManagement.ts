import { MigrationInterface, QueryRunner } from 'typeorm'

export class TestimonialsManagement20261119232000 implements MigrationInterface {
  name = 'TestimonialsManagement20261119232000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_name text NOT NULL,
        role text,
        photo_url text,
        rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
        message text NOT NULL,
        is_visible boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS testimonials_visible_created_at_idx
      ON testimonials (is_visible, created_at DESC)
    `)
  }

  async down(): Promise<void> {
    throw new Error('Testimonial data is not automatically reversible. Restore from a reviewed backup.')
  }
}
