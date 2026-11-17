import { Inject, Injectable } from '@nestjs/common'
import type { DashboardRange, DashboardRepository } from '../domain/dashboard.repository'
import { DASHBOARD_REPOSITORY } from '../domain/dashboard.repository'

@Injectable()
export class DashboardService {
  constructor(@Inject(DASHBOARD_REPOSITORY) private readonly dashboard: DashboardRepository) {}

  async getDashboard(requestedRange?: string) {
    const range: DashboardRange = requestedRange === '30d' || requestedRange === '12m' ? requestedRange : '7d'
    const result = await this.dashboard.read(range)
    const rows = result as any
    const totals = rows.summary[0] || {}
    const formatCurrency = (value: unknown) => `RWF ${Number(value || 0).toLocaleString('en-US')}`
    return {
      stats: [
        { label: 'Confirmed revenue', value: formatCurrency(totals.total_revenue), change: 'Verified paid', icon: 'revenue', up: true },
        { label: 'Expected revenue', value: formatCurrency(totals.expected_revenue), change: 'Awaiting payment', icon: 'expected', up: true },
        { label: "Today's revenue", value: formatCurrency(totals.todays_revenue), change: 'Verified today', icon: 'trend', up: true },
        { label: 'Total Orders', value: Number(totals.total_orders || 0).toLocaleString('en-US'), change: `${Number(totals.pending_orders || 0).toLocaleString('en-US')} pending`, icon: 'orders', up: true },
        { label: 'Paid Orders', value: Number(totals.paid_orders || 0).toLocaleString('en-US'), change: `${Number(totals.completed_orders || 0).toLocaleString('en-US')} delivered`, icon: 'paid', up: true },
        { label: 'Total Customers', value: Number(totals.total_customers || 0).toLocaleString('en-US'), change: 'All time', icon: 'customers', up: true },
        { label: 'Active Products', value: Number(totals.total_products || 0).toLocaleString('en-US'), change: 'Available catalog', icon: 'products', up: true },
        { label: 'Low Stock Items', value: Number(totals.low_stock || 0).toLocaleString('en-US'), change: '5 or fewer', icon: 'inventory', up: false },
      ],
      recentOrders: rows.orders.map((row: any) => ({ ...row, id: String(row.id), amount: Number(row.amount), date: new Date(row.date).toISOString().slice(0, 10) })),
      products: rows.products.map((row: any) => ({ ...row, id: String(row.id), price: Number(row.price) })),
      customers: rows.customers.map((row: any) => ({ ...row, orders: Number(row.orders), total: Number(row.total), joined: new Date(row.joined).toISOString().slice(0, 10) })),
      inventory: rows.inventory.map((row: any) => ({ ...row, id: String(row.id) })),
      revenueTrend: rows.revenue.map((row: any) => ({ date: String(row.date).slice(0, 10), amount: Number(row.amount) })),
      orderPipeline: rows.orderPipeline.map((row: any) => ({ label: String(row.label), value: Number(row.value) })),
      paymentBreakdown: rows.paymentBreakdown.map((row: any) => ({ label: String(row.label), value: Number(row.value), amount: Number(row.amount) })),
      categorySales: rows.categorySales.map((row: any) => ({ label: String(row.label), value: Number(row.value), amount: Number(row.amount) })),
      topProducts: rows.topProducts.map((row: any) => ({ label: String(row.label), value: Number(row.value), amount: Number(row.amount) })),
      inventoryHealth: rows.inventoryHealth.map((row: any) => ({ label: String(row.label), value: Number(row.value) })),
    }
  }
}
