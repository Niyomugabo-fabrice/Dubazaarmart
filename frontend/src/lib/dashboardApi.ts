import { apiFetch, apiUrl, getStoredAdminSession, mediaUrl } from "../services/api-client"

function getAdminAuthHeaders(): Record<string, string> {
  const token = getStoredAdminSession().token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export type DashboardStat = {
  label: string

  value: string

  change: string

  icon: string

  up: boolean
}

export type DashboardOrder = {
  id: string

  customer: string

  amount: number

  status: string

  date: string

  items: number
}

export type DashboardProduct = {
  id: string

  name: string

  brand: string

  category: string
  sku: string

  price: number

  quantity: number

  active: boolean

  image?: string
}

export type DashboardCustomer = {
  name: string

  email: string

  orders: number

  total: number

  joined: string
}

export type DashboardInventoryItem = {
  id: string

  name: string

  sku: string

  quantity: number
}

export type RevenueRange = "7d" | "30d" | "12m"

export type RevenuePoint = {
  date: string

  amount: number
}

export type DashboardBreakdown = {
  label: string
  value: number
  amount?: number
}

export type DashboardData = {
  stats: DashboardStat[]

  recentOrders: DashboardOrder[]

  products: DashboardProduct[]

  customers: DashboardCustomer[]

  inventory: DashboardInventoryItem[]

  revenueTrend: RevenuePoint[]

  orderPipeline: DashboardBreakdown[]
  paymentBreakdown: DashboardBreakdown[]
  categorySales: DashboardBreakdown[]
  topProducts: DashboardBreakdown[]
  inventoryHealth: DashboardBreakdown[]
}

export type OrderLineSnapshot = {
  productName: string

  category: string

  quantity: number

  unitPrice: number | null

  lineTotal: number | null
}

export type AdminOrder = {
  id: string
  customerName: string
  phone?: string | null
  email?: string | null
  deliveryAddress?: Record<string, any> | null
  status: string
  paymentStatus: string
  paymentMethod: string
  subtotal: number | null
  deliveryFee: number | null
  total: number
  createdAt: string
  requestedDeliveryTime?: string | null
  channel?: "web" | "whatsapp"
  cancelReason?: string | null
  customerInstructions?: string | null
  items: OrderLineSnapshot[]
}

export type CompanyOrderItem = {
  id: string
  productName: string
  category: string
  unitPrice: number
  quantityOrdered: number
  quantityReceived: number
  totalPrice: number
  addedToStock: boolean
}

export type CompanyOrder = {
  id: string
  poNumber: string
  supplierName: string
  supplierContact: string
  shippingCompany: string
  orderDate: string
  expectedArrival: string
  currency: "USD"
  shippingCost: number
  otherCharges: number
  totalAmount: number
  status: "ORDERED" | "SHIPPED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED"
  paymentStatus: "PAID" | "PENDING" | "PARTIAL"
  notes: string
  items: CompanyOrderItem[]
  createdAt: string
  updatedAt: string
}

export type StockItemSummary = {
  id: string
  name: string
  sku: string
  brand: string
  category: string
  quantity: number
  targetStock: number
  minStock: number
  unitCost: number
  sellingPrice: number
  totalValue: number
  statusColor: "RED" | "YELLOW" | "GREEN"
  active: boolean
  image?: string
  lastUpdated?: string
}

export type StockOverview = {
  items: StockItemSummary[]
  totalProducts: number
  totalStockUnits: number
  totalInventoryValue: number
  lowStockCount: number
  averageStockCount: number
  fullStockCount: number
}

export type StockMovement = {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  movementType: "SALE" | "MANUAL_REMOVAL" | "PURCHASE_RECEIPT" | "ADJUSTMENT"
  reason: string
  referenceId?: string
  createdAt: string
}

export type WebsiteSettings = {
  shopName: string
  companyEmail: string
  supportEmail: string
  phoneNumber: string
  whatsappNumber: string
  momoNumber: string
  businessAddress: string
  currency: string
  standardDeliveryFee: number
  expressDeliveryFee: number
  freeDeliveryThreshold: number
  allowStaffRegistration: boolean
  updatedAt?: string
}

export type StaffUserRecord = {
  id: string
  firstName: string
  lastName: string
  name: string
  email: string
  phoneNumber: string | null
  role: "MANAGER" | "STAFF"
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING"
  emailVerified: boolean
  permissions: string[]
  createdAt: string
  lastLoginAt: string | null
}

export type AuditLogRecord = {
  id: number
  actorUserId: string | null
  actorName: string | null
  action: string
  targetResource: string
  targetId: string | null
  metadata: Record<string, string | number | boolean | null>
  createdAt: string
}

export type SiteAnnouncement = {
  id: string
  title: string
  message: string
  link: string | null
  isActive: boolean
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

export type AdminOrdersPage = {
  orders: AdminOrder[]
  page: number
  pageSize: number
  totalOrders: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type AdminOrdersQuery = {
  page: number
  pageSize: number
  search: string
  status: string
  paymentStatus: string
  channel?: string
}

export type NewCustomerOrder = {
  customerName: string
  phone: string
  email: string
  deliveryAddress: {
    province: string
    district: string
    sector: string
    cell: string
    street: string
    instructions: string
  }
  paymentMethod: "mtn" | "airtel"
  requestedDeliveryTime?: string | null
  customerInstructions?: string
  channel?: "web" | "whatsapp"
  items: Array<{ sku: string; quantity: number }>
}

export type CustomerOrderReceipt = {
  orderId: string
  status: string
  paymentStatus: string
  subtotal: number
  deliveryFee: number
  total: number
  requestedDeliveryTime?: string | null
  channel?: string
  createdAt: string
}

const emptyDashboardData: DashboardData = {
  stats: [],

  recentOrders: [],

  products: [],

  customers: [],

  inventory: [],

  revenueTrend: [],

  orderPipeline: [],
  paymentBreakdown: [],
  categorySales: [],
  topProducts: [],
  inventoryHealth: [],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getApiErrorMessage(value: unknown, fallback: string): string {
  if (!isRecord(value)) return fallback
  if (typeof value.error === "string") return value.error
  if (typeof value.message === "string") return value.message
  return fallback
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? ""
  const body = await response.text()

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      response.ok
        ? "The dashboard service returned a non-JSON response."
        : `Dashboard service unavailable (${response.status}).`,
    )
  }

  try {
    return body ? JSON.parse(body) : null
  } catch {
    throw new Error("The dashboard service returned invalid JSON.")
  }
}

function normalizeDashboardData(payload: unknown): DashboardData {
  if (!isRecord(payload)) return emptyDashboardData

  const revenueTrend = Array.isArray(payload.revenueTrend)
    ? payload.revenueTrend.flatMap((point): RevenuePoint[] => {
        if (
          !isRecord(point) ||
          typeof point.date !== "string" ||
          typeof point.amount !== "number"
        ) {
          return []
        }

        return [{ date: point.date, amount: point.amount }]
      })
    : []

  const normalizeBreakdown = (value: unknown): DashboardBreakdown[] =>
    Array.isArray(value)
      ? value.flatMap((item): DashboardBreakdown[] => {
          if (
            !isRecord(item) ||
            typeof item.label !== "string" ||
            typeof item.value !== "number"
          ) {
            return []
          }
          return [
            {
              label: item.label,
              value: item.value,
              ...(typeof item.amount === "number"
                ? { amount: item.amount }
                : {}),
            },
          ]
        })
      : []

  return {
    stats: Array.isArray(payload.stats) ? payload.stats as DashboardStat[] : [],

    recentOrders: Array.isArray(payload.recentOrders)
      ? payload.recentOrders as DashboardOrder[]
      : Array.isArray(payload.orders)
        ? payload.orders as DashboardOrder[]
        : [],

    products: Array.isArray(payload.products)
      ? (payload.products as DashboardProduct[]).map((product) => ({
          ...product,
          ...(product.image ? { image: mediaUrl(product.image) } : {}),
        }))
      : [],

    customers: Array.isArray(payload.customers)
      ? payload.customers as DashboardCustomer[]
      : [],

    inventory: Array.isArray(payload.inventory)
      ? payload.inventory as DashboardInventoryItem[]
      : Array.isArray(payload.stock)
        ? payload.stock as DashboardInventoryItem[]
        : [],

    revenueTrend,

    orderPipeline: normalizeBreakdown(payload.orderPipeline),
    paymentBreakdown: normalizeBreakdown(payload.paymentBreakdown),
    categorySales: normalizeBreakdown(payload.categorySales),
    topProducts: normalizeBreakdown(payload.topProducts),
    inventoryHealth: normalizeBreakdown(payload.inventoryHealth),
  }
}

export async function fetchDashboardData(
  range: RevenueRange,
): Promise<{ data: DashboardData; isFallback: boolean; error?: string }> {
  try {
    const response = await apiFetch(
      apiUrl(`/api/admin/dashboard?range=${range}`),
      {
        headers: { Accept: "application/json", ...getAdminAuthHeaders() },
      },
    )
    const payload = await readJsonResponse(response)

    if (!response.ok) {
      const message =
        isRecord(payload) && typeof payload.error === "string"
          ? payload.error
          : `Dashboard request failed (${response.status}).`
      throw new Error(message)
    }
    if (!isRecord(payload)) {
      throw new Error("The dashboard API returned an invalid response.")
    }

    return { data: normalizeDashboardData(payload), isFallback: false }
  } catch (error) {
    const lastError =
      error instanceof Error ? error : new Error("Unknown fetch error")
    console.warn(
      "Dashboard backend unavailable; no database data is being shown.",
      lastError,
    )
    return {
      data: emptyDashboardData,
      isFallback: true,
      error: lastError.message,
    }
  }
}

export async function createCustomerOrder(
  order: NewCustomerOrder,
): Promise<CustomerOrderReceipt> {
  const response = await apiFetch(apiUrl("/api/orders"), {
    method: "POST",

    headers: {
      Accept: "application/json",

      "Content-Type": "application/json",
    },

    body: JSON.stringify(order),
  })

  if (!response.ok) {
    const payload = await readJsonResponse(response)

    const message =
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : "The order could not be submitted."

    throw new Error(message)
  }

  return response.json() as Promise<CustomerOrderReceipt>
}

export async function fetchAdminOrders(
  query: AdminOrdersQuery,
): Promise<AdminOrdersPage> {
  const params = new URLSearchParams({
    page: String(query.page),

    pageSize: String(query.pageSize),
  })

  if (query.search) params.set("search", query.search)

  if (query.status) params.set("status", query.status)

  if (query.paymentStatus) params.set("paymentStatus", query.paymentStatus)

  const response = await apiFetch(apiUrl(`/api/admin/orders?${params}`), {
    headers: { Accept: "application/json", ...getAdminAuthHeaders() },
  })

  if (!response.ok) {
    const payload = await readJsonResponse(response)

    const message =
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : "Customer orders could not be loaded."

    throw new Error(message)
  }

  return readJsonResponse(response) as Promise<AdminOrdersPage>
}

export function getAdminOrderEventsUrl() {
  return apiUrl("/api/admin/orders/events")
}

export async function streamAdminOrderEvents(
  signal: AbortSignal,
  onOrderCreated: () => void,
  onConnected: () => void,
): Promise<void> {
  const response = await apiFetch(getAdminOrderEventsUrl(), {
    headers: { Accept: "text/event-stream", ...getAdminAuthHeaders() },
    signal,
  })
  if (!response.ok || !response.body) {
    throw new Error(`Live order updates could not be connected (${response.status}).`)
  }

  onConnected()
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  while (!signal.aborted) {
    let result: ReadableStreamReadResult<Uint8Array>
    try {
      result = await reader.read()
    } catch (error) {
      if (signal.aborted) return
      throw error
    }
    const { done, value } = result
    if (done) return
    buffer = `${buffer}${decoder.decode(value, { stream: true })}`.replace(/\r\n/g, "\n")
    let boundary = buffer.indexOf("\n\n")
    while (boundary >= 0) {
      const event = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      if (event.split(/\r?\n/).some((line) => line === "event: order-created")) {
        onOrderCreated()
      }
      boundary = buffer.indexOf("\n\n")
    }
  }
}

// WhatsApp Order
export async function createWhatsAppOrder(payload: {
  customerName: string
  phone?: string
  email?: string
  deliveryAddress?: Record<string, string>
  items: Array<{ sku: string; quantity: number }>
}): Promise<{ success: boolean; orderId: string; whatsappUrl: string; messageText: string }> {
  const response = await apiFetch(apiUrl("/api/orders/whatsapp"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(isRecord(data) && typeof data.error === "string" ? data.error : "Failed to initiate WhatsApp order")
  }
  return response.json()
}

// Cancel Order
export async function cancelAdminOrder(orderId: string, reason: string): Promise<AdminOrder> {
  const response = await apiFetch(apiUrl(`/api/admin/orders/${orderId}/cancel`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
    body: JSON.stringify({ reason }),
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(isRecord(data) && typeof data.error === "string" ? data.error : "Failed to cancel order")
  }
  const result = await response.json()
  return result.order
}

// Record Manual Payment
export async function recordAdminOrderPayment(orderId: string, note?: string): Promise<AdminOrder> {
  const response = await apiFetch(apiUrl(`/api/admin/orders/${orderId}/payment`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
    body: JSON.stringify({ note }),
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(isRecord(data) && typeof data.error === "string" ? data.error : "Failed to record payment")
  }
  const result = await response.json()
  return result.order
}

// Delete Customer Order
export async function deleteAdminOrder(orderId: string): Promise<boolean> {
  const response = await apiFetch(apiUrl(`/api/admin/orders/${orderId}`), {
    method: "DELETE",
    headers: { Accept: "application/json", ...getAdminAuthHeaders() },
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(isRecord(data) && typeof data.error === "string" ? data.error : "Failed to delete order")
  }
  return response.ok
}

// Company Orders APIs
export async function fetchCompanyOrders(search?: string, status?: string): Promise<CompanyOrder[]> {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (status && status !== "ALL") params.set("status", status)
  const response = await apiFetch(apiUrl(`/api/admin/company-orders?${params}`), {
    headers: { Accept: "application/json", ...getAdminAuthHeaders() },
  })
  if (!response.ok) throw new Error("Failed to fetch company purchase orders")
  const data = await response.json()
  return data.companyOrders || []
}

export async function createCompanyOrder(payload: {
  supplierName: string
  supplierContact?: string
  shippingCompany: string
  expectedArrival: string
  shippingCost?: number
  otherCharges?: number
  notes?: string
  items: Array<{
    productName: string
    category: string
    unitPrice: number
    quantityOrdered: number
  }>
}): Promise<CompanyOrder> {
  const response = await apiFetch(apiUrl("/api/admin/company-orders"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(isRecord(data) && typeof data.error === "string" ? data.error : "Failed to create company order")
  }
  const result = await response.json()
  return result.companyOrder
}

export async function receiveCompanyOrder(
  poId: string,
  receivedItems: Array<{ itemId: string; quantityReceived: number }>,
): Promise<{ success: boolean; po: CompanyOrder; addedCount: number; message: string }> {
  const response = await apiFetch(apiUrl(`/api/admin/company-orders/${poId}/receive`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
    body: JSON.stringify({ receivedItems }),
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(isRecord(data) && typeof data.error === "string" ? data.error : "Failed to receive company order items")
  }
  return response.json()
}

export async function deleteCompanyOrder(poId: string): Promise<boolean> {
  const response = await apiFetch(apiUrl(`/api/admin/company-orders/${poId}`), {
    method: "DELETE",
    headers: { Accept: "application/json", ...getAdminAuthHeaders() },
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(isRecord(data) && typeof data.error === "string" ? data.error : "Failed to delete company order")
  }
  return response.ok
}

// Stock APIs
export async function fetchStockSummary(): Promise<StockOverview> {
  const response = await apiFetch(apiUrl("/api/admin/stock"), {
    headers: { Accept: "application/json", ...getAdminAuthHeaders() },
  })
  if (!response.ok) throw new Error("Failed to load inventory summary")
  const overview = await response.json() as StockOverview
  return {
    ...overview,
    items: overview.items.map((item) => ({
      ...item,
      ...(item.image ? { image: mediaUrl(item.image) } : {}),
    })),
  }
}

export async function removeStockManual(productId: string, quantity: number, reason: string) {
  const response = await apiFetch(apiUrl("/api/admin/stock/remove"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
    body: JSON.stringify({ productId, quantity, reason }),
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(isRecord(data) && typeof data.error === "string" ? data.error : "Failed to remove stock")
  }
  return response.json()
}

export async function updateStockTarget(
  productId: string,
  updates: { expectedFullStock?: number; unitCost?: number; minStock?: number; quantity?: number },
) {
  const response = await apiFetch(apiUrl(`/api/admin/stock/${productId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
    body: JSON.stringify(updates),
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(isRecord(data) && typeof data.error === "string" ? data.error : "Failed to update stock target")
  }
  return response.json()
}

export async function fetchStockMovements(productId?: string): Promise<StockMovement[]> {
  const params = new URLSearchParams()
  if (productId) params.set("productId", productId)
  const response = await apiFetch(apiUrl(`/api/admin/stock/movements?${params}`), {
    headers: { Accept: "application/json", ...getAdminAuthHeaders() },
  })
  if (!response.ok) throw new Error("Failed to load stock movements")
  const data = await response.json()
  return data.movements || []
}

// Settings APIs
export async function fetchWebsiteSettings(): Promise<WebsiteSettings> {
  const response = await apiFetch(apiUrl("/api/settings"))
  if (!response.ok) throw new Error("Failed to load website settings")
  const data = await response.json()
  return data.settings
}

export async function updateWebsiteSettings(settings: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
  const response = await apiFetch(apiUrl("/api/admin/settings"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
    body: JSON.stringify(settings),
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(isRecord(data) && typeof data.error === "string" ? data.error : "Failed to save settings")
  }
  const result = await response.json()
  return result.settings
}

// Announcements APIs
export async function fetchActiveAnnouncements(): Promise<SiteAnnouncement[]> {
  const response = await apiFetch(apiUrl("/api/announcements/active"))
  if (!response.ok) return []
  const data = await response.json()
  return Array.isArray(data.announcements) ? data.announcements : []
}

export async function fetchAdminAnnouncements(): Promise<SiteAnnouncement[]> {
  const response = await apiFetch(apiUrl("/api/admin/announcements"), {
    headers: { Accept: "application/json", ...getAdminAuthHeaders() },
  })
  if (!response.ok) throw new Error("Failed to load announcements")
  const data = await response.json()
  return Array.isArray(data.announcements) ? data.announcements : []
}

export type AnnouncementInput = {
  title?: string
  message?: string
  link?: string | null
  startDate?: string | null
  endDate?: string | null
  isActive?: boolean
}

export async function createAdminAnnouncement(payload: AnnouncementInput): Promise<SiteAnnouncement> {
  const response = await apiFetch(apiUrl("/api/admin/announcements"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(getApiErrorMessage(data, "Failed to create announcement."))
  }
  const result = await response.json()
  return result.announcement
}

export async function updateAdminAnnouncement(id: string, payload: AnnouncementInput): Promise<SiteAnnouncement> {
  const response = await apiFetch(apiUrl(`/api/admin/announcements/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(getApiErrorMessage(data, "Failed to update announcement."))
  }
  const result = await response.json()
  return result.announcement
}

export async function deleteAdminAnnouncement(id: string): Promise<boolean> {
  const response = await apiFetch(apiUrl(`/api/admin/announcements/${id}`), {
    method: "DELETE",
    headers: { ...getAdminAuthHeaders() },
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(getApiErrorMessage(data, "Failed to delete announcement."))
  }
  return true
}

// Manager-only staff and audit APIs
export async function fetchStaffUsers(options: {
  search?: string
  status?: string
  page?: number
  pageSize?: number
} = {}) {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    pageSize: String(options.pageSize ?? 20),
  })
  if (options.search) params.set("search", options.search)
  if (options.status) params.set("status", options.status)
  const response = await apiFetch(apiUrl(`/api/admin/users?${params}`), {
    headers: { Accept: "application/json", ...getAdminAuthHeaders() },
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(getApiErrorMessage(data, "Failed to load user accounts."))
  }
  return readJsonResponse(response) as Promise<{ items: StaffUserRecord[]; total: number; page: number; pageSize: number }>
}

export async function createStaffUser(payload: {
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  password: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
}): Promise<StaffUserRecord> {
  const response = await apiFetch(apiUrl("/api/admin/users"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(getApiErrorMessage(data, "Failed to create user account."))
  }
  return response.json()
}

export async function updateStaffUser(
  id: string,
  payload: { firstName: string; lastName: string; email: string; phoneNumber: string | null },
): Promise<StaffUserRecord> {
  const response = await apiFetch(apiUrl(`/api/admin/users/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(getApiErrorMessage(data, "Failed to update user account."))
  }
  return response.json()
}

export async function updateStaffStatus(id: string, action: "activate" | "deactivate" | "suspend") {
  const response = await apiFetch(apiUrl(`/api/admin/users/${id}/${action}`), {
    method: "PATCH",
    headers: { ...getAdminAuthHeaders() },
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(getApiErrorMessage(data, "Failed to update user status."))
  }
}

export async function verifyStaffUser(id: string): Promise<StaffUserRecord> {
  const response = await apiFetch(apiUrl(`/api/admin/users/${id}/verify`), {
    method: "PATCH",
    headers: { ...getAdminAuthHeaders() },
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(getApiErrorMessage(data, "Failed to verify user account."))
  }
  return response.json()
}

export async function promoteStaffUserToManager(id: string): Promise<StaffUserRecord> {
  const response = await apiFetch(apiUrl(`/api/admin/users/${id}/promote-to-manager`), {
    method: "PATCH",
    headers: { ...getAdminAuthHeaders() },
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(getApiErrorMessage(data, "Failed to promote user account."))
  }
  return response.json()
}

export async function deleteStaffUser(id: string) {
  const response = await apiFetch(apiUrl(`/api/admin/users/${id}`), {
    method: "DELETE",
    headers: { ...getAdminAuthHeaders() },
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(getApiErrorMessage(data, "Failed to delete user account."))
  }
}

export async function fetchAuditLogs(options: {
  page?: number
  pageSize?: number
  action?: string
  targetResource?: string
} = {}): Promise<{ items: AuditLogRecord[]; total: number; page: number; pageSize: number }> {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    pageSize: String(options.pageSize ?? 25),
  })
  if (options.action) params.set("action", options.action)
  if (options.targetResource) params.set("targetResource", options.targetResource)
  const response = await apiFetch(apiUrl(`/api/admin/audit-logs?${params}`), {
    headers: { Accept: "application/json", ...getAdminAuthHeaders() },
  })
  if (!response.ok) {
    const data = await readJsonResponse(response)
    throw new Error(getApiErrorMessage(data, "Failed to load audit logs."))
  }
  const result = await readJsonResponse(response)
  if (!isRecord(result) || !Array.isArray(result.items)) {
    throw new Error("The audit log service returned an invalid response.")
  }
  return {
    items: result.items as AuditLogRecord[],
    total: typeof result.total === "number" ? result.total : 0,
    page: typeof result.page === "number" ? result.page : options.page ?? 1,
    pageSize: typeof result.pageSize === "number" ? result.pageSize : options.pageSize ?? 25,
  }
}
