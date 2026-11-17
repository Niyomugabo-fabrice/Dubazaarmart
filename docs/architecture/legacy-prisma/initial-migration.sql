-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'IntoreTech Admin',
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "sku" TEXT NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "original_price" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "image" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]',
    "condition" TEXT NOT NULL DEFAULT 'New',
    "specs" JSONB NOT NULL DEFAULT '{}',
    "warranty" TEXT NOT NULL DEFAULT '1 year warranty',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "rating" DECIMAL(3,1) NOT NULL DEFAULT 5.0,
    "reviews" INTEGER NOT NULL DEFAULT 0,
    "badge" TEXT,
    "expected_full_stock" INTEGER NOT NULL DEFAULT 20,
    "unit_cost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "customer_id" UUID,
    "customer_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "delivery_address" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_method" TEXT NOT NULL DEFAULT 'unknown',
    "subtotal" DECIMAL(14,2) NOT NULL,
    "delivery_fee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "requested_delivery_time" TIMESTAMPTZ(6),
    "channel" TEXT NOT NULL DEFAULT 'web',
    "cancel_reason" TEXT,
    "customer_instructions" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID,
    "product_name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "sku" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "line_total" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_orders" (
    "id" UUID NOT NULL,
    "po_number" TEXT NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "supplier_contact" TEXT NOT NULL DEFAULT '',
    "shipping_company" TEXT NOT NULL DEFAULT '',
    "order_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_arrival" TIMESTAMPTZ(6) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "shipping_cost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "other_charges" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ORDERED',
    "payment_status" TEXT NOT NULL DEFAULT 'PAID',
    "notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "unit_price" DECIMAL(14,2) NOT NULL,
    "quantity_ordered" INTEGER NOT NULL,
    "quantity_received" INTEGER NOT NULL DEFAULT 0,
    "total_price" DECIMAL(14,2) NOT NULL,
    "added_to_stock" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "company_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "sku" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL,
    "movement_type" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "reference_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_settings" (
    "id" TEXT NOT NULL DEFAULT 'primary',
    "shop_name" TEXT NOT NULL DEFAULT 'DubazaarMart',
    "company_email" TEXT NOT NULL DEFAULT 'info@dubazaarmart.rw',
    "support_email" TEXT NOT NULL DEFAULT 'support@dubazaarmart.rw',
    "phone_number" TEXT NOT NULL DEFAULT '+250789545954',
    "whatsapp_number" TEXT NOT NULL DEFAULT '+250789545954',
    "momo_number" TEXT NOT NULL DEFAULT '+250789545954',
    "business_address" TEXT NOT NULL DEFAULT 'Kigali, Rwanda (Dubai Wholesale Hub)',
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "standard_delivery_fee" DECIMAL(14,2) NOT NULL DEFAULT 10000,
    "express_delivery_fee" DECIMAL(14,2) NOT NULL DEFAULT 25000,
    "free_delivery_threshold" DECIMAL(14,2) NOT NULL DEFAULT 500000,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "website_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "tag" TEXT NOT NULL DEFAULT 'Announcement',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_quantity_idx" ON "products"("quantity");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_orders_po_number_key" ON "company_orders"("po_number");

-- CreateIndex
CREATE INDEX "company_orders_expected_arrival_idx" ON "company_orders"("expected_arrival");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_order_items" ADD CONSTRAINT "company_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "company_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

