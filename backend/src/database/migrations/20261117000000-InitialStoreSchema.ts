import { MigrationInterface, QueryRunner } from 'typeorm'

const requiredColumns: Record<string, string[]> = {
  admins: ['id', 'email', 'password_hash', 'name', 'role', 'created_at'],
  customers: ['id', 'name', 'email', 'created_at'],
  products: ['id', 'name', 'brand', 'category', 'description', 'sku', 'price', 'original_price', 'discount', 'quantity', 'active', 'image', 'images', 'condition', 'specs', 'warranty', 'featured', 'rating', 'reviews', 'badge', 'expected_full_stock', 'unit_cost', 'min_stock', 'created_at', 'updated_at'],
  orders: ['id', 'customer_id', 'customer_name', 'phone', 'email', 'delivery_address', 'status', 'payment_status', 'payment_method', 'subtotal', 'delivery_fee', 'total_amount', 'requested_delivery_time', 'channel', 'cancel_reason', 'customer_instructions', 'created_at'],
  order_items: ['id', 'order_id', 'product_id', 'product_name', 'category', 'sku', 'quantity', 'unit_price', 'line_total'],
  company_orders: ['id', 'po_number', 'supplier_name', 'supplier_contact', 'shipping_company', 'order_date', 'expected_arrival', 'currency', 'shipping_cost', 'other_charges', 'total_amount', 'status', 'payment_status', 'notes', 'created_at', 'updated_at'],
  company_order_items: ['id', 'order_id', 'product_name', 'category', 'unit_price', 'quantity_ordered', 'quantity_received', 'total_price', 'added_to_stock'],
  stock_movements: ['id', 'product_id', 'product_name', 'sku', 'quantity', 'movement_type', 'reason', 'reference_id', 'created_at'],
  website_settings: ['id', 'shop_name', 'company_email', 'support_email', 'phone_number', 'whatsapp_number', 'momo_number', 'business_address', 'currency', 'standard_delivery_fee', 'express_delivery_fee', 'free_delivery_threshold', 'updated_at'],
  announcements: ['id', 'title', 'message', 'tag', 'active', 'start_date', 'end_date', 'created_at'],
}

const createStatements = [
  `CREATE TABLE admins (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE, password_hash text NOT NULL, name text NOT NULL DEFAULT 'IntoreTech Admin', role text NOT NULL DEFAULT 'admin', created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE customers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, email text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE products (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, brand text NOT NULL DEFAULT '', category text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '', sku text NOT NULL UNIQUE, price numeric(14,2) NOT NULL CHECK (price >= 0), original_price numeric(14,2) NOT NULL DEFAULT 0, discount integer NOT NULL DEFAULT 0, quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0), active boolean NOT NULL DEFAULT true, image text, images jsonb NOT NULL DEFAULT '[]'::jsonb, condition text NOT NULL DEFAULT 'New', specs jsonb NOT NULL DEFAULT '{}'::jsonb, warranty text NOT NULL DEFAULT '1 year warranty', featured boolean NOT NULL DEFAULT false, rating numeric(3,1) NOT NULL DEFAULT 5.0, reviews integer NOT NULL DEFAULT 0, badge text, expected_full_stock integer NOT NULL DEFAULT 20, unit_cost numeric(14,2) NOT NULL DEFAULT 0, min_stock integer NOT NULL DEFAULT 5, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid REFERENCES customers(id) ON DELETE SET NULL, customer_name text NOT NULL, phone text NOT NULL, email text NOT NULL, delivery_address jsonb NOT NULL DEFAULT '{}'::jsonb, status text NOT NULL DEFAULT 'PENDING_PAYMENT', payment_status text NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING','PROCESSING','PAID','FAILED','CANCELLED','REFUNDED')), payment_method text NOT NULL DEFAULT 'unknown' CHECK (payment_method IN ('mtn','airtel','unknown')), subtotal numeric(14,2) NOT NULL CHECK (subtotal >= 0), delivery_fee numeric(14,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0), total_amount numeric(14,2) NOT NULL CHECK (total_amount >= 0), requested_delivery_time timestamptz, channel text NOT NULL DEFAULT 'web', cancel_reason text, customer_instructions text, created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE order_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id uuid REFERENCES products(id) ON DELETE SET NULL, product_name text NOT NULL, category text NOT NULL DEFAULT '', sku text NOT NULL DEFAULT '', quantity integer NOT NULL CHECK (quantity > 0), unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0), line_total numeric(14,2) NOT NULL CHECK (line_total >= 0))`,
  `CREATE TABLE company_orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), po_number text NOT NULL UNIQUE, supplier_name text NOT NULL, supplier_contact text NOT NULL DEFAULT '', shipping_company text NOT NULL DEFAULT '', order_date timestamptz NOT NULL DEFAULT now(), expected_arrival timestamptz NOT NULL, currency text NOT NULL DEFAULT 'USD', shipping_cost numeric(14,2) NOT NULL DEFAULT 0, other_charges numeric(14,2) NOT NULL DEFAULT 0, total_amount numeric(14,2) NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'ORDERED' CHECK (status IN ('ORDERED','SHIPPED','PARTIALLY_RECEIVED','RECEIVED','CANCELLED')), payment_status text NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PENDING','PAID','PARTIAL')), notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE company_order_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES company_orders(id) ON DELETE CASCADE, product_name text NOT NULL, category text NOT NULL DEFAULT '', unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0), quantity_ordered integer NOT NULL CHECK (quantity_ordered > 0), quantity_received integer NOT NULL DEFAULT 0 CHECK (quantity_received >= 0), total_price numeric(14,2) NOT NULL CHECK (total_price >= 0), added_to_stock boolean NOT NULL DEFAULT false)`,
  `CREATE TABLE stock_movements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id text NOT NULL, product_name text NOT NULL, sku text NOT NULL DEFAULT '', quantity integer NOT NULL, movement_type text NOT NULL CHECK (movement_type IN ('SALE','MANUAL_REMOVAL','PURCHASE_RECEIPT','ADJUSTMENT')), reason text NOT NULL DEFAULT '', reference_id text, created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE website_settings (id text PRIMARY KEY DEFAULT 'primary', shop_name text NOT NULL DEFAULT 'DubazaarMart', company_email text NOT NULL DEFAULT 'info@dubazaarmart.rw', support_email text NOT NULL DEFAULT 'support@dubazaarmart.rw', phone_number text NOT NULL DEFAULT '+250789545954', whatsapp_number text NOT NULL DEFAULT '+250789545954', momo_number text NOT NULL DEFAULT '+250789545954', business_address text NOT NULL DEFAULT 'Kigali, Rwanda (Dubai Wholesale Hub)', currency text NOT NULL DEFAULT 'RWF', standard_delivery_fee numeric(14,2) NOT NULL DEFAULT 10000, express_delivery_fee numeric(14,2) NOT NULL DEFAULT 25000, free_delivery_threshold numeric(14,2) NOT NULL DEFAULT 500000, updated_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE announcements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, message text NOT NULL, tag text NOT NULL DEFAULT 'Announcement', active boolean NOT NULL DEFAULT true, start_date timestamptz, end_date timestamptz, created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE INDEX products_quantity_idx ON products (quantity)`,
  `CREATE INDEX orders_created_at_idx ON orders (created_at DESC)`,
  `CREATE INDEX orders_status_idx ON orders (status)`,
  `CREATE INDEX order_items_order_id_idx ON order_items (order_id)`,
  `CREATE INDEX company_orders_expected_arrival_idx ON company_orders (expected_arrival)`,
  `CREATE INDEX stock_movements_created_at_idx ON stock_movements (created_at DESC)`,
]

export class InitialStoreSchema20261117000000 implements MigrationInterface {
  name = 'InitialStoreSchema20261117000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    const existingTables = await queryRunner.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1)`,
      [Object.keys(requiredColumns)],
    ) as Array<{ table_name: string }>
    const existing = new Set(existingTables.map((row) => row.table_name))

    if (existing.size > 0) {
      const missingTables = Object.keys(requiredColumns).filter((table) => !existing.has(table))
      if (missingTables.length > 0) {
        throw new Error(`Existing store schema is partial. No changes were made. Missing tables: ${missingTables.join(', ')}`)
      }

      for (const [table, expectedColumns] of Object.entries(requiredColumns)) {
        const rows = await queryRunner.query(
          `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
          [table],
        ) as Array<{ column_name: string }>
        const actualColumns = new Set(rows.map((row) => row.column_name))
        const missingColumns = expectedColumns.filter((column) => !actualColumns.has(column))
        if (missingColumns.length > 0) {
          throw new Error(`Existing ${table} table does not match the legacy schema. No changes were made. Missing columns: ${missingColumns.join(', ')}`)
        }
      }
      return
    }

    for (const statement of createStatements) await queryRunner.query(statement)
  }

  async down(): Promise<void> {
    throw new Error('The initial store schema is intentionally not dropped by migrations. Back up and manage schema removal manually.')
  }
}
