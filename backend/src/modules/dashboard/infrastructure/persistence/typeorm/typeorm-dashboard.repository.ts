import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import type { DashboardRange, DashboardRepository } from '../../../domain/dashboard.repository'

@Injectable()
export class TypeOrmDashboardRepository implements DashboardRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async read(range: DashboardRange): Promise<Record<string, unknown>> {
    const days = range === '30d' ? 30 : 7
    // These reports aggregate across several tables and PostgreSQL time buckets; keep the
    // optimized read-only analytics in SQL while all writes use TypeORM repositories.
    const [summary, orders, products, customers, inventory, revenue, orderPipeline,
      paymentBreakdown, categorySales, topProducts, inventoryHealth] = await Promise.all([
      this.dataSource.query(`
        SELECT
          COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'PAID'), 0) AS total_revenue,
          COALESCE(SUM(total_amount) FILTER (WHERE created_at::date = CURRENT_DATE AND payment_status = 'PAID'), 0) AS todays_revenue,
          COALESCE(SUM(total_amount) FILTER (WHERE payment_status IN ('PENDING', 'PROCESSING')), 0) AS expected_revenue,
          COUNT(*) AS total_orders,
          COUNT(*) FILTER (WHERE status = 'PENDING_PAYMENT') AS pending_orders,
          COUNT(*) FILTER (WHERE payment_status = 'PAID') AS paid_orders,
          COUNT(*) FILTER (WHERE status = 'DELIVERED') AS completed_orders,
          (SELECT COUNT(*) FROM customers) AS total_customers,
          (SELECT COUNT(*) FROM products WHERE active = TRUE) AS total_products,
          (SELECT COUNT(*) FROM products WHERE quantity <= 5 AND active = TRUE) AS low_stock
        FROM orders`),
      this.dataSource.query(`
        SELECT o.id, COALESCE(c.name, o.customer_name) AS customer, o.total_amount AS amount,
          o.status, o.created_at AS date, COUNT(oi.id)::int AS items
        FROM orders o LEFT JOIN customers c ON c.id = o.customer_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        GROUP BY o.id, c.name, o.customer_name ORDER BY o.created_at DESC LIMIT 100`),
      this.dataSource.query(`SELECT id, name, brand, category, sku, price, quantity, active, image FROM products ORDER BY created_at DESC LIMIT 200`),
      this.dataSource.query(`
        SELECT c.name, c.email, COUNT(o.id)::int AS orders, COALESCE(SUM(o.total_amount), 0) AS total, c.created_at AS joined
        FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
        GROUP BY c.id ORDER BY c.created_at DESC LIMIT 100`),
      this.dataSource.query(`SELECT id, name, sku, quantity FROM products ORDER BY quantity ASC, name ASC LIMIT 200`),
      range === '12m'
        ? this.dataSource.query(`
            SELECT periods.period_start::date AS date, COALESCE(SUM(o.total_amount), 0) AS amount
            FROM generate_series(date_trunc('month', CURRENT_DATE) - INTERVAL '11 months', date_trunc('month', CURRENT_DATE), INTERVAL '1 month') AS periods(period_start)
            LEFT JOIN orders o ON o.created_at >= periods.period_start AND o.created_at < periods.period_start + INTERVAL '1 month' AND o.payment_status = 'PAID'
            GROUP BY periods.period_start ORDER BY periods.period_start`)
        : this.dataSource.query(`
            SELECT periods.period_start::date AS date, COALESCE(SUM(o.total_amount), 0) AS amount
            FROM generate_series(CURRENT_DATE - (($1::int - 1) * INTERVAL '1 day'), CURRENT_DATE, INTERVAL '1 day') AS periods(period_start)
            LEFT JOIN orders o ON o.created_at >= periods.period_start AND o.created_at < periods.period_start + INTERVAL '1 day' AND o.payment_status = 'PAID'
            GROUP BY periods.period_start ORDER BY periods.period_start`, [days]),
      this.dataSource.query(`SELECT status AS label, COUNT(*)::int AS value FROM orders GROUP BY status ORDER BY COUNT(*) DESC`),
      this.dataSource.query(`SELECT payment_status AS label, COUNT(*)::int AS value, COALESCE(SUM(total_amount), 0) AS amount FROM orders GROUP BY payment_status ORDER BY COUNT(*) DESC`),
      this.dataSource.query(`
        SELECT COALESCE(NULLIF(oi.category, ''), 'Uncategorized') AS label,
          SUM(oi.quantity)::int AS value, COALESCE(SUM(oi.line_total), 0) AS amount
        FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.payment_status = 'PAID'
        GROUP BY COALESCE(NULLIF(oi.category, ''), 'Uncategorized') ORDER BY amount DESC LIMIT 6`),
      this.dataSource.query(`
        SELECT COALESCE(NULLIF(oi.product_name, ''), 'Unknown product') AS label,
          SUM(oi.quantity)::int AS value, COALESCE(SUM(oi.line_total), 0) AS amount
        FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.payment_status = 'PAID'
        GROUP BY COALESCE(NULLIF(oi.product_name, ''), 'Unknown product') ORDER BY value DESC, amount DESC LIMIT 5`),
      this.dataSource.query(`
        SELECT health.label, health.sort_order, COUNT(p.id)::int AS value
        FROM (VALUES ('Out of stock', 1), ('Low stock', 2), ('Healthy', 3), ('Inactive', 4)) AS health(label, sort_order)
        LEFT JOIN products p ON CASE WHEN NOT p.active THEN 'Inactive' WHEN p.quantity = 0 THEN 'Out of stock'
          WHEN p.quantity <= 5 THEN 'Low stock' ELSE 'Healthy' END = health.label
        GROUP BY health.label, health.sort_order ORDER BY health.sort_order`),
    ])
    return { summary, orders, products, customers, inventory, revenue, orderPipeline, paymentBreakdown, categorySales, topProducts, inventoryHealth }
  }
}
