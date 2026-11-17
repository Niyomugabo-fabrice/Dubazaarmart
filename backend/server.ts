import cors from "cors"
import express, { type ErrorRequestHandler, type Response } from "express"
import helmet from "helmet"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { Pool } from "pg"
import { fileURLToPath } from "node:url"
import { localStore } from "./store"

const databaseUrl = process.env.DATABASE_URL ?? null
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null

const app = express()
const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:8443")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
const orderEventClients = new Set<Response>()
const defaultDeliveryFee = 10_000
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const schemaUrl = new URL("./schema.sql", import.meta.url)

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), "uploads")
if (!existsSync(uploadsDir)) {
  mkdir(uploadsDir, { recursive: true }).catch(() => {})
}

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))
app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: "25mb" }))
app.use(express.urlencoded({ extended: true, limit: "25mb" }))
app.use("/uploads", express.static(uploadsDir))

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function publishOrderCreated(orderId: string) {
  const message = `event: order-created\ndata: ${JSON.stringify({ orderId })}\n\n`
  for (const client of orderEventClients) {
    if (client.destroyed || client.writableEnded) {
      orderEventClients.delete(client)
      continue
    }
    client.write(message)
  }
}

// Health check
app.get("/api/health", async (_request, response) => {
  if (pool) {
    try {
      await pool.query("SELECT 1")
      return response.json({ status: "ok", database: "postgres" })
    } catch {
      return response.status(503).json({ status: "unavailable", database: "postgres-error" })
    }
  }
  return response.json({ status: "ok", database: "local-store", adminReady: true })
})

// SSE for real-time order updates
app.get("/api/admin/orders/events", (_request, response) => {
  response.setHeader("Content-Type", "text/event-stream")
  response.setHeader("Cache-Control", "no-cache, no-transform")
  response.setHeader("Connection", "keep-alive")
  response.flushHeaders()
  response.write(": connected\n\n")

  orderEventClients.add(response)

  const heartbeat = setInterval(() => {
    response.write(": keep-alive\n\n")
  }, 25_000)

  response.on("close", () => {
    clearInterval(heartbeat)
    orderEventClients.delete(response)
  })
})

// ----------------------------------------------------
// Admin Authentication (Email: IntoreTech@gmail.com, Password: Bahoo!123)
// ----------------------------------------------------
app.post("/api/admin/login", async (request, response) => {
  const body = request.body
  if (!isRecord(body) || typeof body.email !== "string" || typeof body.password !== "string") {
    return response.status(400).json({ error: "Email and password are required." })
  }

  const isValid = await localStore.validateAdmin(body.email, body.password)
  if (!isValid) {
    return response.status(401).json({
      error: "Invalid admin email or password. Hint: IntoreTech@gmail.com / Bahoo!123",
    })
  }

  const adminInfo = await localStore.getAdminInfo()
  const token = `adm_${Buffer.from(`${adminInfo.email}:${Date.now()}`).toString("base64")}`

  return response.json({
    success: true,
    token,
    admin: adminInfo,
  })
})

app.get("/api/admin/verify", async (request, response) => {
  const authHeader = request.headers.authorization || ""
  const token = authHeader.replace(/^Bearer\s+/i, "") || (typeof request.query.token === "string" ? request.query.token : "")

  if (!token) {
    return response.status(401).json({ authenticated: false, error: "Authentication token required." })
  }

  const adminInfo = await localStore.getAdminInfo()
  return response.json({ authenticated: true, admin: adminInfo })
})

app.post("/api/admin/logout", (_request, response) => {
  return response.json({ success: true, message: "Logged out successfully" })
})

// ----------------------------------------------------
// Image Upload Endpoint (Saves uploaded image from device)
// ----------------------------------------------------
app.post("/api/upload", async (request, response) => {
  try {
    const { image, filename } = request.body
    if (!image || typeof image !== "string") {
      return response.status(400).json({ error: "No image data provided" })
    }

    // Determine extension and clean base64 data
    let ext = "png"
    let base64Data = image
    const matches = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/)
    if (matches) {
      ext = matches[1].toLowerCase() === "jpeg" ? "jpg" : matches[1].toLowerCase()
      base64Data = matches[2]
    }

    const cleanFilename = typeof filename === "string" && filename.trim()
      ? filename.trim().replace(/[^a-zA-Z0-9._-]/g, "")
      : `prod-${Date.now()}`
    const uniqueName = `product-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`
    const filePath = path.join(uploadsDir, uniqueName)
    const buffer = Buffer.from(base64Data, "base64")

    await writeFile(filePath, buffer)

    const url = `/uploads/${uniqueName}`
    return response.json({ success: true, url, filename: uniqueName })
  } catch (err) {
    console.error("Upload error:", err)
    return response.status(500).json({ error: "Failed to upload image" })
  }
})

// ----------------------------------------------------
// Products APIs (Frontend catalog + Admin product management)
// ----------------------------------------------------
app.get("/api/products", async (request, response, next) => {
  try {
    const category = typeof request.query.category === "string" ? request.query.category : undefined
    const search = typeof request.query.search === "string" ? request.query.search : undefined
    const products = await localStore.getProducts({ category, search, activeOnly: false })
    return response.json({ products })
  } catch (err) {
    next(err)
  }
})

app.post(["/api/products", "/api/admin/products"], async (request, response, next) => {
  try {
    const body = request.body
    if (!isRecord(body)) {
      return response.status(400).json({ error: "Product payload is required." })
    }

    const name = typeof body.name === "string" ? body.name.trim() : ""
    const price = Number(body.price)

    if (!name || isNaN(price) || price < 0) {
      return response.status(400).json({ error: "Valid product name and price are required." })
    }

    const newProduct = await localStore.addProduct(body)

    // If Postgres is also connected, sync it into Postgres
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO products (name, brand, category, sku, price, quantity, active, image)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (sku) DO UPDATE SET
             name = EXCLUDED.name,
             price = EXCLUDED.price,
             quantity = EXCLUDED.quantity`,
          [
            newProduct.name,
            newProduct.brand,
            newProduct.category,
            newProduct.sku,
            newProduct.price,
            newProduct.quantity,
            newProduct.active,
            newProduct.image,
          ],
        )
      } catch (dbErr) {
        console.warn("Postgres product sync warning:", dbErr)
      }
    }

    return response.status(201).json({ success: true, product: newProduct })
  } catch (err) {
    next(err)
  }
})

app.patch("/api/admin/products/:id", async (request, response, next) => {
  try {
    const id = request.params.id
    const updated = await localStore.updateProduct(id, request.body)
    if (!updated) {
      return response.status(404).json({ error: "Product not found." })
    }
    return response.json({ success: true, product: updated })
  } catch (err) {
    next(err)
  }
})

app.delete("/api/admin/products/:id", async (request, response, next) => {
  try {
    const id = request.params.id
    const deleted = await localStore.deleteProduct(id)
    if (!deleted) {
      return response.status(404).json({ error: "Product not found." })
    }
    return response.json({ success: true, message: "Product deleted." })
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------
// Order Creation (Frontend Checkout & Admin Manual Order)
// ----------------------------------------------------
app.post("/api/orders", async (request, response, next) => {
  const body: unknown = request.body
  if (!isRecord(body)) {
    return response.status(400).json({ error: "Order details are required." })
  }

  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : ""
  const phone = typeof body.phone === "string" ? body.phone.trim() : ""
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const paymentMethod = body.paymentMethod === "airtel" ? "airtel" : "mtn"
  const address = isRecord(body.deliveryAddress) ? body.deliveryAddress : null

  if (!customerName || !phone || !email || !address) {
    return response.status(400).json({ error: "Customer name, phone, email, and delivery address are required." })
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return response.status(400).json({ error: "An order must contain at least 1 product." })
  }

  const requestedItems: { sku: string; quantity: number }[] = []
  for (const item of body.items) {
    if (!isRecord(item) || typeof item.sku !== "string") continue
    const qty = Number(item.quantity)
    if (qty > 0) {
      requestedItems.push({ sku: item.sku.trim(), quantity: qty })
    }
  }

  if (requestedItems.length === 0) {
    return response.status(400).json({ error: "One or more order items are invalid." })
  }

  // Handle order with LocalStore
  if (!pool) {
    const deliveryRecord: Record<string, string> = {}
    for (const [k, v] of Object.entries(address)) {
      if (typeof v === "string") deliveryRecord[k] = v
    }

    const requestedDeliveryTime = typeof body.requestedDeliveryTime === "string" ? body.requestedDeliveryTime : null
    const customerInstructions = typeof body.customerInstructions === "string" ? body.customerInstructions : (typeof address.instructions === "string" ? address.instructions : null)
    const channel = body.channel === "whatsapp" ? "whatsapp" : "web"

    const order = await localStore.createOrder({
      customerName,
      phone,
      email,
      deliveryAddress: deliveryRecord,
      paymentMethod,
      items: requestedItems,
      requestedDeliveryTime,
      channel,
      customerInstructions,
    })

    publishOrderCreated(order.id)

    return response.status(201).json({
      orderId: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      requestedDeliveryTime: order.requestedDeliveryTime,
      channel: order.channel,
      createdAt: order.createdAt,
    })
  }

  // Handle order with PostgreSQL when configured
  const client = await pool.connect()
  let transactionStarted = false

  try {
    await client.query("BEGIN")
    transactionStarted = true

    const productResult = await client.query(
      `SELECT id, name, category, sku, price, active
       FROM products
       WHERE sku = ANY($1::text[]) AND active = TRUE
       FOR SHARE`,
      [requestedItems.map((item) => item.sku)],
    )

    const productsBySku = new Map(productResult.rows.map((product) => [product.sku, product]))
    const missingSku = requestedItems.find((item) => !productsBySku.has(item.sku))

    if (missingSku) {
      await client.query("ROLLBACK")
      transactionStarted = false
      return response.status(409).json({
        error: `Product ${missingSku.sku} is unavailable. Please update your cart.`,
      })
    }

    const orderItems = requestedItems.map((item) => {
      const product = productsBySku.get(item.sku)!
      const unitPrice = Number(product.price)
      return {
        productId: String(product.id),
        productName: String(product.name),
        category: String(product.category || "Uncategorized"),
        sku: String(product.sku),
        quantity: item.quantity,
        unitPrice,
        lineTotal: Number((unitPrice * item.quantity).toFixed(2)),
      }
    })

    const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0)
    const deliveryFee = defaultDeliveryFee
    const total = subtotal + deliveryFee

    const customerResult = await client.query(
      `INSERT INTO customers (name, email)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [customerName, email],
    )

    const addressSnapshot: Record<string, string> = {}
    for (const [k, v] of Object.entries(address)) {
      if (typeof v === "string") addressSnapshot[k] = v.trim()
    }

    const orderResult = await client.query(
      `INSERT INTO orders (
         customer_id, customer_name, phone, email, delivery_address, status,
         payment_status, payment_method, subtotal, delivery_fee, total_amount
       )
       VALUES ($1, $2, $3, $4, $5, 'PENDING_PAYMENT', 'PENDING', $6, $7, $8, $9)
       RETURNING id, status, payment_status, created_at`,
      [
        customerResult.rows[0].id,
        customerName,
        phone,
        email,
        addressSnapshot,
        paymentMethod,
        subtotal,
        deliveryFee,
        total,
      ],
    )

    const order = orderResult.rows[0]

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (
           order_id, product_id, product_name, category, quantity, unit_price, line_total
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          order.id,
          item.productId,
          item.productName,
          item.category,
          item.quantity,
          item.unitPrice,
          item.lineTotal,
        ],
      )
    }

    await client.query("COMMIT")
    transactionStarted = false

    const orderId = String(order.id)
    publishOrderCreated(orderId)

    return response.status(201).json({
      orderId,
      status: order.status,
      paymentStatus: order.payment_status,
      subtotal,
      deliveryFee,
      total,
      createdAt: order.created_at,
    })
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK")
      } catch {}
    }
    next(error)
  } finally {
    client.release()
  }
})

// Admin endpoint to manually create an order
app.post("/api/admin/orders", async (request, response, next) => {
  try {
    const body = request.body
    if (!isRecord(body) || !body.customerName || !body.phone || !Array.isArray(body.items)) {
      return response.status(400).json({ error: "Customer name, phone, and items are required." })
    }

    const items: Array<{ sku: string; quantity: number }> = []
    for (const it of body.items) {
      if (isRecord(it) && typeof it.sku === "string") {
        items.push({ sku: it.sku.trim(), quantity: Math.max(1, Number(it.quantity) || 1) })
      }
    }

    if (items.length === 0) {
      return response.status(400).json({ error: "At least one item is required." })
    }

    const order = await localStore.createOrder({
      customerName: String(body.customerName).trim(),
      phone: String(body.phone).trim(),
      email: String(body.email || "customer@dubazaarmart.com").trim().toLowerCase(),
      deliveryAddress: isRecord(body.deliveryAddress)
        ? (body.deliveryAddress as Record<string, string>)
        : { province: "Kigali", district: "Gasabo", sector: "Remera", cell: "Rukiri" },
      paymentMethod: String(body.paymentMethod || "mtn"),
      status: String(body.status || "PAID"),
      paymentStatus: String(body.paymentStatus || "PAID"),
      items,
    })

    publishOrderCreated(order.id)
    return response.status(201).json({ success: true, order })
  } catch (err) {
    next(err)
  }
})

// Update order status
app.patch("/api/admin/orders/:id/status", async (request, response, next) => {
  try {
    const id = request.params.id
    const { status, paymentStatus } = request.body || {}
    const order = await localStore.updateOrderStatus(id, status, paymentStatus)
    if (!order) {
      return response.status(404).json({ error: "Order not found." })
    }
    publishOrderCreated(order.id)
    return response.json({ success: true, order })
  } catch (err) {
    next(err)
  }
})

// Cancel order with recorded reason
app.patch("/api/admin/orders/:id/cancel", async (request, response, next) => {
  try {
    const id = request.params.id
    const reason = typeof request.body?.reason === "string" ? request.body.reason.trim() : "Cancelled by admin"
    const order = await localStore.cancelOrder(id, reason)
    if (!order) {
      return response.status(404).json({ error: "Order not found." })
    }
    publishOrderCreated(order.id)
    return response.json({ success: true, order })
  } catch (err) {
    next(err)
  }
})

// Record authorized manual payment
app.patch("/api/admin/orders/:id/payment", async (request, response, next) => {
  try {
    const id = request.params.id
    const note = typeof request.body?.note === "string" ? request.body.note.trim() : ""
    const order = await localStore.recordManualPayment(id, note)
    if (!order) {
      return response.status(404).json({ error: "Order not found." })
    }
    publishOrderCreated(order.id)
    return response.json({ success: true, order })
  } catch (err) {
    next(err)
  }
})

// Permanently delete customer order
app.delete("/api/admin/orders/:id", async (request, response, next) => {
  try {
    const id = request.params.id
    const deleted = await localStore.deleteOrder(id)
    if (!deleted) {
      return response.status(404).json({ error: "Order not found." })
    }
    publishOrderCreated(id)
    return response.json({ success: true, message: `Order #${id} deleted.` })
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------
// WhatsApp Order Placement (Section 3.1)
// ----------------------------------------------------
app.post("/api/orders/whatsapp", async (request, response, next) => {
  try {
    const body = request.body
    if (!isRecord(body) || !body.customerName || !Array.isArray(body.items)) {
      return response.status(400).json({ error: "Customer name and items are required." })
    }

    const customerName = String(body.customerName).trim()
    const phone = String(body.phone || "+250789545954").trim()
    const email = String(body.email || "whatsapp-order@dubazaarmart.rw").trim().toLowerCase()
    const address = isRecord(body.deliveryAddress)
      ? (body.deliveryAddress as Record<string, string>)
      : { province: "Kigali", district: "WhatsApp Enquiry" }

    const requestedItems: { sku: string; quantity: number }[] = []
    for (const it of body.items) {
      if (isRecord(it) && typeof it.sku === "string") {
        requestedItems.push({ sku: it.sku.trim(), quantity: Math.max(1, Number(it.quantity) || 1) })
      }
    }

    if (requestedItems.length === 0) {
      return response.status(400).json({ error: "Cart has no items to order." })
    }

    const order = await localStore.createOrder({
      customerName,
      phone,
      email,
      deliveryAddress: address,
      paymentMethod: "whatsapp",
      status: "PENDING_PAYMENT",
      paymentStatus: "PENDING",
      channel: "whatsapp",
      customerInstructions: "Order placed via WhatsApp enquiry",
      items: requestedItems,
    })

    publishOrderCreated(order.id)

    // Build structured message strictly following Section 3.1
    const settings = await localStore.getSettings()
    const whatsappNum = settings.whatsappNumber.replace(/[^0-9]/g, "")

    let msg = `Customer Order – DubazaarMart\n\n`
    msg += `My name is: ${customerName}\n\n`
    msg += `I would like to order the following products:\n\n`
    order.items.forEach((it, idx) => {
      msg += `${idx + 1}. ${it.productName}\n`
      msg += `   - Quantity: ${it.quantity}\n`
      msg += `   - Unit price: ${it.unitPrice.toLocaleString()} RWF\n`
      msg += `   - Total: ${it.lineTotal.toLocaleString()} RWF\n\n`
    })
    msg += `*Grand Total: ${order.total.toLocaleString()} RWF*\n`
    msg += `(Order Ref: #${order.id})`

    const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(msg)}`

    return response.status(201).json({
      success: true,
      orderId: order.id,
      whatsappUrl,
      messageText: msg,
      order,
    })
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------
// Company Purchase Orders (Section 6 - USD)
// ----------------------------------------------------
app.get("/api/admin/company-orders", async (request, response, next) => {
  try {
    const search = typeof request.query.search === "string" ? request.query.search : undefined
    const status = typeof request.query.status === "string" ? request.query.status : undefined
    const companyOrders = await localStore.getCompanyOrders(search, status)
    return response.json({ companyOrders })
  } catch (err) {
    next(err)
  }
})

app.post("/api/admin/company-orders", async (request, response, next) => {
  try {
    const body = request.body
    if (!isRecord(body) || !body.supplierName || !body.shippingCompany || !body.expectedArrival || !Array.isArray(body.items)) {
      return response.status(400).json({
        error: "Supplier name, shipping company, expected arrival date, and items are required.",
      })
    }
    const order = await localStore.createCompanyOrder(body as any)
    return response.status(201).json({ success: true, companyOrder: order })
  } catch (err) {
    next(err)
  }
})

app.patch("/api/admin/company-orders/:id", async (request, response, next) => {
  try {
    const id = request.params.id
    const updated = await localStore.updateCompanyOrder(id, request.body)
    if (!updated) return response.status(404).json({ error: "Company Purchase Order not found." })
    return response.json({ success: true, companyOrder: updated })
  } catch (err) {
    next(err)
  }
})

app.post("/api/admin/company-orders/:id/receive", async (request, response, next) => {
  try {
    const id = request.params.id
    const items = Array.isArray(request.body?.receivedItems) ? request.body.receivedItems : []
    const result = await localStore.addCompanyOrderToStock(id, items)
    return response.json(result)
  } catch (err) {
    next(err)
  }
})

// Permanently delete company purchase order
app.delete("/api/admin/company-orders/:id", async (request, response, next) => {
  try {
    const id = request.params.id
    const deleted = await localStore.deleteCompanyOrder(id)
    if (!deleted) {
      return response.status(404).json({ error: "Purchase order not found." })
    }
    return response.json({ success: true, message: `Purchase order #${id} deleted.` })
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------
// Stock Management & Movement History (Section 7)
// ----------------------------------------------------
app.get("/api/admin/stock", async (_request, response, next) => {
  try {
    const summary = await localStore.getStockSummary()
    return response.json(summary)
  } catch (err) {
    next(err)
  }
})

app.post("/api/admin/stock/remove", async (request, response, next) => {
  try {
    const { productId, quantity, reason } = request.body || {}
    if (!productId || !quantity || !reason) {
      return response.status(400).json({ error: "Product ID, quantity, and reason for removal are required." })
    }
    const result = await localStore.removeStockManual(productId, Number(quantity), String(reason))
    return response.json(result)
  } catch (err) {
    next(err)
  }
})

app.patch("/api/admin/stock/:productId", async (request, response, next) => {
  try {
    const updated = await localStore.updateStockItem(request.params.productId, request.body)
    return response.json({ success: true, product: updated })
  } catch (err) {
    next(err)
  }
})

app.get("/api/admin/stock/movements", async (request, response, next) => {
  try {
    const productId = typeof request.query.productId === "string" ? request.query.productId : undefined
    const movements = await localStore.getStockMovements(productId)
    return response.json({ movements })
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------
// Website Settings & Company Information (Section 8.5)
// ----------------------------------------------------
app.get("/api/settings", async (_request, response, next) => {
  try {
    const settings = await localStore.getSettings()
    return response.json({ settings })
  } catch (err) {
    next(err)
  }
})

app.post("/api/admin/settings", async (request, response, next) => {
  try {
    const updated = await localStore.updateSettings(request.body)
    return response.json({ success: true, settings: updated })
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------
// Announcements & Promotions (Section 8.6)
// ----------------------------------------------------
app.get("/api/announcements/active", async (_request, response, next) => {
  try {
    const announcements = await localStore.getActiveAnnouncements()
    return response.json({ announcements })
  } catch (err) {
    next(err)
  }
})

app.get("/api/admin/announcements", async (_request, response, next) => {
  try {
    const announcements = await localStore.getAnnouncements()
    return response.json({ announcements })
  } catch (err) {
    next(err)
  }
})

app.post("/api/admin/announcements", async (request, response, next) => {
  try {
    const { title, message, tag, startDate, endDate } = request.body || {}
    if (!title || !message) {
      return response.status(400).json({ error: "Title and message are required." })
    }
    const ann = await localStore.createAnnouncement({ title, message, tag, startDate, endDate })
    return response.status(201).json({ success: true, announcement: ann })
  } catch (err) {
    next(err)
  }
})

app.patch("/api/admin/announcements/:id", async (request, response, next) => {
  try {
    const updated = await localStore.updateAnnouncement(request.params.id, request.body)
    if (!updated) return response.status(404).json({ error: "Announcement not found." })
    return response.json({ success: true, announcement: updated })
  } catch (err) {
    next(err)
  }
})

app.delete("/api/admin/announcements/:id", async (request, response, next) => {
  try {
    const deleted = await localStore.deleteAnnouncement(request.params.id)
    if (!deleted) return response.status(404).json({ error: "Announcement not found." })
    return response.json({ success: true, message: "Announcement deleted." })
  } catch (err) {
    next(err)
  }
})

// ----------------------------------------------------
// Admin Orders Query
// ----------------------------------------------------
app.get("/api/admin/orders", async (request, response, next) => {
  if (!pool) {
    const page = Number(request.query.page ?? 1)
    const pageSize = Number(request.query.pageSize ?? 10)
    const search = typeof request.query.search === "string" ? request.query.search : ""
    const status = typeof request.query.status === "string" ? request.query.status : ""
    const paymentStatus = typeof request.query.paymentStatus === "string" ? request.query.paymentStatus : ""
    const channel = typeof request.query.channel === "string" ? request.query.channel : ""

    const data = await localStore.getOrders({ page, pageSize, search, status, paymentStatus, channel })
    return response.json(data)
  }

  try {
    const page = Number(request.query.page ?? 1)
    const pageSize = Number(request.query.pageSize ?? 10)
    const pageSizes = [10, 25, 50, 100]

    if (!Number.isInteger(page) || page < 1 || !pageSizes.includes(pageSize)) {
      return response.status(400).json({ error: "Invalid order page or page size." })
    }

    const search = typeof request.query.search === "string" ? request.query.search.trim().slice(0, 120) : ""
    const orderStatus = typeof request.query.status === "string" ? request.query.status : ""
    const paymentStatus = typeof request.query.paymentStatus === "string" ? request.query.paymentStatus : ""

    const values: (string | number)[] = []
    const conditions: string[] = []

    const addValue = (value: string | number) => {
      values.push(value)
      return `$${values.length}`
    }

    if (search) {
      const term = addValue(`%${search}%`)
      conditions.push(`(
        o.id::text ILIKE ${term}
        OR o.customer_name ILIKE ${term}
        OR o.phone ILIKE ${term}
        OR o.email ILIKE ${term}
      )`)
    }

    if (orderStatus) conditions.push(`o.status = ${addValue(orderStatus)}`)
    if (paymentStatus) conditions.push(`o.payment_status = ${addValue(paymentStatus)}`)

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
    const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM orders o ${whereClause}`, values)
    const totalOrders = Number(countResult.rows[0].total)
    const offset = (page - 1) * pageSize
    const orderValues = [...values, pageSize, offset]

    const orderResult = await pool.query(
      `SELECT o.id, COALESCE(NULLIF(o.customer_name, ''), c.name, 'Guest customer') AS customer_name,
         o.status, o.payment_status, o.payment_method, o.subtotal,
         o.delivery_fee, o.total_amount, o.created_at
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       ${whereClause}
       ORDER BY o.created_at DESC, o.id DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      orderValues,
    )

    const orderIds = orderResult.rows.map((order) => String(order.id))
    const itemResult = orderIds.length
      ? await pool.query(
          `SELECT order_id, product_name, category, quantity, unit_price, line_total
           FROM order_items
           WHERE order_id = ANY($1::uuid[])
           ORDER BY order_id, id`,
          [orderIds],
        )
      : { rows: [] }

    const itemsByOrder = new Map<string, typeof itemResult.rows>()
    for (const item of itemResult.rows) {
      const orderId = String(item.order_id)
      const currentItems = itemsByOrder.get(orderId) ?? []
      currentItems.push(item)
      itemsByOrder.set(orderId, currentItems)
    }

    return response.json({
      orders: orderResult.rows.map((order) => ({
        id: String(order.id),
        customerName: order.customer_name,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        subtotal: order.subtotal === null ? null : Number(order.subtotal),
        deliveryFee: order.delivery_fee === null ? null : Number(order.delivery_fee),
        total: Number(order.total_amount),
        createdAt: order.created_at,
        items: (itemsByOrder.get(String(order.id)) ?? []).map((item) => ({
          productName: item.product_name || "Historical item details unavailable",
          category: item.category || "—",
          quantity: Number(item.quantity),
          unitPrice: item.product_name ? Number(item.unit_price) : null,
          lineTotal: item.product_name ? Number(item.line_total) : null,
        })),
      })),
      page,
      pageSize,
      totalOrders,
      totalPages: Math.ceil(totalOrders / pageSize),
      hasNextPage: offset + orderResult.rows.length < totalOrders,
      hasPreviousPage: page > 1,
    })
  } catch (error) {
    next(error)
  }
})

// ----------------------------------------------------
// Admin Dashboard Aggregates
// ----------------------------------------------------
app.get("/api/admin/dashboard", async (request, response, next) => {
  const requestedRange = request.query.range
  const range = requestedRange === "30d" || requestedRange === "12m" ? requestedRange : "7d"

  if (!pool) {
    const data = await localStore.getDashboardData(range)
    return response.json(data)
  }

  try {
    const revenueQuery =
      range === "12m"
        ? pool.query(`
          SELECT periods.period_start::date AS date, COALESCE(SUM(o.total_amount), 0) AS amount
          FROM generate_series(
            date_trunc('month', CURRENT_DATE) - INTERVAL '11 months',
            date_trunc('month', CURRENT_DATE),
            INTERVAL '1 month'
          ) AS periods(period_start)
          LEFT JOIN orders o ON o.created_at >= periods.period_start
            AND o.created_at < periods.period_start + INTERVAL '1 month'
            AND o.payment_status = 'PAID'
          GROUP BY periods.period_start
          ORDER BY periods.period_start
        `)
        : pool.query(
            `
          SELECT periods.period_start::date AS date, COALESCE(SUM(o.total_amount), 0) AS amount
          FROM generate_series(
            CURRENT_DATE - (($1::int - 1) * INTERVAL '1 day'),
            CURRENT_DATE,
            INTERVAL '1 day'
          ) AS periods(period_start)
          LEFT JOIN orders o ON o.created_at >= periods.period_start
            AND o.created_at < periods.period_start + INTERVAL '1 day'
            AND o.payment_status = 'PAID'
          GROUP BY periods.period_start
          ORDER BY periods.period_start
        `,
            [range === "30d" ? 30 : 7],
          )

    const [
      summary,
      orders,
      products,
      customers,
      inventory,
      revenue,
      orderPipeline,
      paymentBreakdown,
      categorySales,
      topProducts,
      inventoryHealth,
    ] = await Promise.all([
      pool.query(`
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
        FROM orders
      `),
      pool.query(`
        SELECT o.id, COALESCE(c.name, 'Guest customer') AS customer, o.total_amount AS amount,
          o.status, o.created_at AS date, COUNT(oi.id)::int AS items
        FROM orders o
        LEFT JOIN customers c ON c.id = o.customer_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        GROUP BY o.id, c.name
        ORDER BY o.created_at DESC
        LIMIT 100
      `),
      pool.query("SELECT id, name, brand, category, sku, price, quantity, active, image FROM products ORDER BY created_at DESC LIMIT 200"),
      pool.query(`
        SELECT c.name, c.email, COUNT(o.id)::int AS orders,
          COALESCE(SUM(o.total_amount), 0) AS total, c.created_at AS joined
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT 100
      `),
      pool.query("SELECT id, name, sku, quantity FROM products ORDER BY quantity ASC, name ASC LIMIT 200"),
      revenueQuery,
      pool.query(`
        SELECT status AS label, COUNT(*)::int AS value
        FROM orders
        GROUP BY status
        ORDER BY COUNT(*) DESC
      `),
      pool.query(`
        SELECT payment_status AS label, COUNT(*)::int AS value,
          COALESCE(SUM(total_amount), 0) AS amount
        FROM orders
        GROUP BY payment_status
        ORDER BY COUNT(*) DESC
      `),
      pool.query(`
        SELECT COALESCE(NULLIF(oi.category, ''), 'Uncategorized') AS label,
          SUM(oi.quantity)::int AS value,
          COALESCE(SUM(oi.line_total), 0) AS amount
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.payment_status = 'PAID'
        GROUP BY COALESCE(NULLIF(oi.category, ''), 'Uncategorized')
        ORDER BY amount DESC
        LIMIT 6
      `),
      pool.query(`
        SELECT COALESCE(NULLIF(oi.product_name, ''), 'Unknown product') AS label,
          SUM(oi.quantity)::int AS value,
          COALESCE(SUM(oi.line_total), 0) AS amount
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.payment_status = 'PAID'
        GROUP BY COALESCE(NULLIF(oi.product_name, ''), 'Unknown product')
        ORDER BY value DESC, amount DESC
        LIMIT 5
      `),
      pool.query(`
        SELECT health.label, health.sort_order, COUNT(p.id)::int AS value
        FROM (
          VALUES ('Out of stock', 1), ('Low stock', 2), ('Healthy', 3), ('Inactive', 4)
        ) AS health(label, sort_order)
        LEFT JOIN products p ON
          CASE
            WHEN NOT p.active THEN 'Inactive'
            WHEN p.quantity = 0 THEN 'Out of stock'
            WHEN p.quantity <= 5 THEN 'Low stock'
            ELSE 'Healthy'
          END = health.label
        GROUP BY health.label, health.sort_order
        ORDER BY health.sort_order
      `),
    ])

    const totals = summary.rows[0]
    const formatCurrency = (value: string | number) => `RWF ${Number(value).toLocaleString("en-US")}`

    return response.json({
      stats: [
        {
          label: "Confirmed revenue",
          value: formatCurrency(totals.total_revenue),
          change: "Verified paid",
          icon: "revenue",
          up: true,
        },
        {
          label: "Expected revenue",
          value: formatCurrency(totals.expected_revenue),
          change: "Awaiting payment",
          icon: "expected",
          up: true,
        },
        {
          label: "Today's revenue",
          value: formatCurrency(totals.todays_revenue),
          change: "Verified today",
          icon: "trend",
          up: true,
        },
        {
          label: "Total Orders",
          value: Number(totals.total_orders).toLocaleString("en-US"),
          change: `${Number(totals.pending_orders).toLocaleString("en-US")} pending`,
          icon: "orders",
          up: true,
        },
        {
          label: "Paid Orders",
          value: Number(totals.paid_orders).toLocaleString("en-US"),
          change: `${Number(totals.completed_orders).toLocaleString("en-US")} delivered`,
          icon: "paid",
          up: true,
        },
        {
          label: "Total Customers",
          value: Number(totals.total_customers).toLocaleString("en-US"),
          change: "All time",
          icon: "customers",
          up: true,
        },
        {
          label: "Active Products",
          value: Number(totals.total_products).toLocaleString("en-US"),
          change: "Available catalog",
          icon: "products",
          up: true,
        },
        {
          label: "Low Stock Items",
          value: Number(totals.low_stock).toLocaleString("en-US"),
          change: "5 or fewer",
          icon: "inventory",
          up: false,
        },
      ],
      recentOrders: orders.rows.map((row) => ({
        ...row,
        id: String(row.id),
        amount: Number(row.amount),
        date: new Date(row.date).toISOString().slice(0, 10),
      })),
      products: products.rows.map((row) => ({
        ...row,
        id: String(row.id),
        price: Number(row.price),
      })),
      customers: customers.rows.map((row) => ({
        ...row,
        orders: Number(row.orders),
        total: Number(row.total),
        joined: new Date(row.joined).toISOString().slice(0, 10),
      })),
      inventory: inventory.rows.map((row) => ({ ...row, id: String(row.id) })),
      revenueTrend: revenue.rows.map((row) => ({
        date: String(row.date).slice(0, 10),
        amount: Number(row.amount),
      })),
      orderPipeline: orderPipeline.rows.map((row) => ({
        label: String(row.label),
        value: Number(row.value),
      })),
      paymentBreakdown: paymentBreakdown.rows.map((row) => ({
        label: String(row.label),
        value: Number(row.value),
        amount: Number(row.amount),
      })),
      categorySales: categorySales.rows.map((row) => ({
        label: String(row.label),
        value: Number(row.value),
        amount: Number(row.amount),
      })),
      topProducts: topProducts.rows.map((row) => ({
        label: String(row.label),
        value: Number(row.value),
        amount: Number(row.amount),
      })),
      inventoryHealth: inventoryHealth.rows.map((row) => ({
        label: String(row.label),
        value: Number(row.value),
      })),
    })
  } catch (error) {
    next(error)
  }
})

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error("Dashboard API error:", error)
  response.status(500).json({ error: "The request could not be completed." })
}

app.use(errorHandler)

async function start() {
  const port = Number(process.env.BACKEND_PORT ?? 3001)

  if (!pool) {
    console.log(`[Backend] DATABASE_URL not set. Running with persistent local JSON store (backend/data/store.json).`)
    console.log(`[Backend] Admin configured: IntoreTech@gmail.com`)
    app.listen(port, () => console.log(`Dashboard API listening on port ${port}.`))
    return
  }

  const schema = await readFile(fileURLToPath(schemaUrl), "utf8")

  if (process.argv.includes("--init-db")) {
    await pool.query(schema)
    console.log("Dashboard database schema initialized.")
    await pool.end()
    return
  }

  await pool.query(schema)
  app.listen(port, () => console.log(`Dashboard API listening on port ${port}.`))
}

start().catch(async (error) => {
  console.error("Unable to start dashboard backend:", error)
  if (pool) {
    await pool.end()
  }
  process.exitCode = 1
})
