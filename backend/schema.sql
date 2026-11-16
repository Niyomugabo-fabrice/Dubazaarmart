CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  sku TEXT NOT NULL UNIQUE,
  price NUMERIC(14, 2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  delivery_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
  payment_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (payment_status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED')),
  payment_method TEXT NOT NULL DEFAULT 'unknown'
    CHECK (payment_method IN ('mtn', 'airtel', 'unknown')),
  subtotal NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(14, 2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(14, 2) NOT NULL CHECK (line_total >= 0)
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'PENDING'
  CHECK (payment_status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'unknown'
  CHECK (payment_method IN ('mtn', 'airtel', 'unknown'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(14, 2) CHECK (subtotal >= 0);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(14, 2) CHECK (delivery_fee >= 0);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name TEXT NOT NULL DEFAULT '';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS line_total NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (line_total >= 0);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);
CREATE INDEX IF NOT EXISTS products_quantity_idx ON products (quantity);
ALTER TABLE products ADD COLUMN IF NOT EXISTS expected_full_stock INTEGER NOT NULL DEFAULT 20;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INTEGER NOT NULL DEFAULT 5;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS requested_delivery_time TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'web';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_instructions TEXT;

CREATE TABLE IF NOT EXISTS company_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE,
  supplier_name TEXT NOT NULL,
  supplier_contact TEXT NOT NULL DEFAULT '',
  shipping_company TEXT NOT NULL DEFAULT '',
  order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_arrival TIMESTAMPTZ NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  shipping_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  other_charges NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ORDERED' CHECK (status IN ('ORDERED', 'SHIPPED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED')),
  payment_status TEXT NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIAL')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES company_orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  unit_price NUMERIC(14, 2) NOT NULL CHECK (unit_price >= 0),
  quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
  quantity_received INTEGER NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  total_price NUMERIC(14, 2) NOT NULL CHECK (total_price >= 0),
  added_to_stock BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('SALE', 'MANUAL_REMOVAL', 'PURCHASE_RECEIPT', 'ADJUSTMENT')),
  reason TEXT NOT NULL DEFAULT '',
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_settings (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  shop_name TEXT NOT NULL DEFAULT 'DubazaarMart',
  company_email TEXT NOT NULL DEFAULT 'info@dubazaarmart.rw',
  support_email TEXT NOT NULL DEFAULT 'support@dubazaarmart.rw',
  phone_number TEXT NOT NULL DEFAULT '+250789545954',
  whatsapp_number TEXT NOT NULL DEFAULT '+250789545954',
  momo_number TEXT NOT NULL DEFAULT '+250789545954',
  business_address TEXT NOT NULL DEFAULT 'Kigali, Rwanda (Dubai Wholesale Hub)',
  currency TEXT NOT NULL DEFAULT 'RWF',
  standard_delivery_fee NUMERIC(14, 2) NOT NULL DEFAULT 10000,
  express_delivery_fee NUMERIC(14, 2) NOT NULL DEFAULT 25000,
  free_delivery_threshold NUMERIC(14, 2) NOT NULL DEFAULT 500000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  tag TEXT NOT NULL DEFAULT 'Announcement',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS company_orders_expected_arrival_idx ON company_orders (expected_arrival ASC);
CREATE INDEX IF NOT EXISTS stock_movements_created_at_idx ON stock_movements (created_at DESC);
