import { MigrationInterface, QueryRunner } from 'typeorm'

interface ProductSlugRow {
  id: string
  name: string
}

export class ProductSlugs20261119000002 implements MigrationInterface {
  name = 'ProductSlugs20261119000002'

  async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('products'))) {
      throw new Error('Cannot add product slugs because the products table does not exist.')
    }

    if (!(await queryRunner.hasColumn('products', 'slug'))) {
      await queryRunner.query('ALTER TABLE products ADD COLUMN slug text')
    }
    await queryRunner.query('DROP INDEX IF EXISTS products_slug_key')

    const products = await queryRunner.query(
      'SELECT id, name FROM products ORDER BY created_at ASC, id ASC',
    ) as ProductSlugRow[]
    const counts = new Map<string, number>()
    for (const product of products) {
      const base = slugify(product.name) || 'product'
      counts.set(base, (counts.get(base) ?? 0) + 1)
    }

    const assignedSlugs = new Set<string>()
    for (const product of products) {
      const base = slugify(product.name) || 'product'
      const uniqueBase = `${base}-${product.id}`
      let slug = counts.get(base) === 1 ? base : uniqueBase
      let suffix = 1
      while (assignedSlugs.has(slug)) {
        slug = `${uniqueBase}-${suffix}`
        suffix += 1
      }
      assignedSlugs.add(slug)
      await queryRunner.query('UPDATE products SET slug = $1 WHERE id = $2', [slug, product.id])
    }

    await queryRunner.query('ALTER TABLE products ALTER COLUMN slug SET NOT NULL')
    await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON products (slug)')
  }

  async down(): Promise<void> {
    throw new Error('Product slugs are part of canonical product URLs and are not automatically removed.')
  }
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
