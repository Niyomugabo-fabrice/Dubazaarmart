import { readFile, writeFile, mkdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

export interface StoredProduct {
  id: string
  name: string
  category: string
  brand: string
  description: string
  price: number
  originalPrice: number
  discount: number
  image: string
  images: string[]
  quantity: number
  sku: string
  condition: "New" | "Refurbished"
  specs: Record<string, string>
  warranty: string
  featured: boolean
  active: boolean
  rating: number
  reviews: number
  badge?: string
  expectedFullStock?: number
  unitCost?: number
  minStock?: number
  createdAt: string
  updatedAt: string
}

export interface StoredCustomer {
  id: string
  name: string
  email: string
  ordersCount: number
  totalSpent: number
  createdAt: string
}

export interface StoredOrderItem {
  id: string
  orderId: string
  productId: string
  productName: string
  category: string
  sku: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface StoredOrder {
  id: string
  customerId: string | null
  customerName: string
  phone: string
  email: string
  deliveryAddress: Record<string, string>
  status: string
  paymentStatus: string
  paymentMethod: string
  subtotal: number
  deliveryFee: number
  total: number
  requestedDeliveryTime?: string | null
  channel?: "web" | "whatsapp"
  cancelReason?: string | null
  customerInstructions?: string | null
  createdAt: string
  items: StoredOrderItem[]
}

export interface StoredCompanyOrderItem {
  id: string
  productName: string
  category: string
  unitPrice: number // in USD
  quantityOrdered: number
  quantityReceived: number
  totalPrice: number
  addedToStock: boolean
}

export interface StoredCompanyOrder {
  id: string
  poNumber: string
  supplierName: string
  supplierContact: string
  shippingCompany: string
  orderDate: string
  expectedArrival: string // ISO string
  currency: "USD"
  shippingCost: number
  otherCharges: number
  totalAmount: number
  status: "ORDERED" | "SHIPPED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED"
  paymentStatus: "PAID" | "PENDING" | "PARTIAL"
  notes: string
  items: StoredCompanyOrderItem[]
  createdAt: string
  updatedAt: string
}

export interface StoredStockMovement {
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

export interface StoredAnnouncement {
  id: string
  title: string
  message: string
  tag: string
  active: boolean
  startDate?: string
  endDate?: string
  createdAt: string
}

export interface StoredWebsiteSettings {
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
  updatedAt: string
}

export interface StoreData {
  admin: {
    email: string
    password: string
    name: string
  }
  products: StoredProduct[]
  customers: StoredCustomer[]
  orders: StoredOrder[]
  companyOrders: StoredCompanyOrder[]
  stockMovements: StoredStockMovement[]
  announcements: StoredAnnouncement[]
  settings: StoredWebsiteSettings
}

const STORE_DIR = path.resolve(process.cwd(), "backend", "data")
const STORE_FILE = path.join(STORE_DIR, "store.json")

const INITIAL_ADMIN = {
  email: "IntoreTech@gmail.com",
  password: "Bahoo!123",
  name: "IntoreTech Admin",
}

const INITIAL_PRODUCTS: StoredProduct[] = [
  {
    id: "p1",
    name: "Samsung Galaxy S24 Ultra",
    category: "smartphones",
    brand: "Samsung",
    description: "The ultimate Samsung flagship with a built-in S Pen, 200MP camera system, and Snapdragon 8 Gen 3 processor. Experience AI-powered photography and productivity like never before.",
    price: 1450000,
    originalPrice: 1800000,
    discount: 19,
    image: "https://images.unsplash.com/photo-1675315936697-1bd8e939948e?w=600&h=600&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1675315936697-1bd8e939948e?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1511140973288-19bf21d7e771?w=600&h=600&fit=crop&auto=format",
    ],
    quantity: 12,
    sku: "SAM-S24U-BLK",
    condition: "New",
    specs: {
      Display: '6.8" Dynamic AMOLED 2X, 120Hz',
      Processor: "Snapdragon 8 Gen 3",
      RAM: "12GB",
      Storage: "256GB / 512GB / 1TB",
      Camera: "200MP + 50MP + 12MP + 10MP",
      Battery: "5000 mAh, 45W charging",
      OS: "Android 14, One UI 6.1",
    },
    warranty: "1 year official warranty",
    featured: true,
    active: true,
    rating: 4.8,
    reviews: 247,
    badge: "Best Seller",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p2",
    name: 'Apple MacBook Pro 14" M3 Pro',
    category: "laptops",
    brand: "Apple",
    description: "The most advanced MacBook Pro ever, featuring the M3 Pro chip with breakthrough performance and battery life in a stunning Liquid Retina XDR display.",
    price: 2850000,
    originalPrice: 3200000,
    discount: 11,
    image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=600&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&h=600&fit=crop&auto=format",
    ],
    quantity: 7,
    sku: "APL-MBP14-M3P",
    condition: "New",
    specs: {
      Chip: "Apple M3 Pro (11-core CPU, 14-core GPU)",
      Display: '14.2" Liquid Retina XDR, 120Hz ProMotion',
      RAM: "18GB Unified Memory",
      Storage: "512GB SSD",
      Battery: "Up to 18 hours",
      Ports: "3x Thunderbolt 4, HDMI, SD card, MagSafe 3",
    },
    warranty: "1 year Apple warranty",
    featured: true,
    active: true,
    rating: 4.9,
    reviews: 183,
    badge: "Featured",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p3",
    name: "Sony WH-1000XM5 Headphones",
    category: "headphones",
    brand: "Sony",
    description: "Industry-leading noise cancellation with eight microphones and two processors. Exceptional call quality and up to 30 hours battery life.",
    price: 380000,
    originalPrice: 480000,
    discount: 21,
    image: "https://images.unsplash.com/photo-1605170876472-db58e15c430e?w=600&h=600&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1605170876472-db58e15c430e?w=600&h=600&fit=crop&auto=format",
    ],
    quantity: 28,
    sku: "SNY-WH1000XM5-BLK",
    condition: "New",
    specs: {
      "Noise Cancellation": "Industry-leading ANC",
      Battery: "30 hours with ANC, 40 hours without",
      Charging: "USB-C, 3 min = 3 hours",
      Connectivity: "Bluetooth 5.2, multipoint",
      Weight: "250g",
    },
    warranty: "1 year Sony warranty",
    featured: true,
    active: true,
    rating: 4.7,
    reviews: 392,
    badge: "Hot Deal",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p4",
    name: "Apple AirPods Pro (2nd Gen)",
    category: "earbuds",
    brand: "Apple",
    description: "AirPods Pro feature the Apple H2 chip with up to 2x more active noise cancellation, Adaptive Transparency, and Personalized Spatial Audio.",
    price: 320000,
    originalPrice: 380000,
    discount: 16,
    image: "https://images.unsplash.com/photo-1623593476737-0fc80f6be51d?w=600&h=600&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1623593476737-0fc80f6be51d?w=600&h=600&fit=crop&auto=format",
    ],
    quantity: 45,
    sku: "APL-APP2-WHT",
    condition: "New",
    specs: {
      Chip: "Apple H2",
      ANC: "2x Active Noise Cancellation",
      Battery: "6 hours (30 hours with case)",
      Connectivity: "Bluetooth 5.3",
      "Water Resistance": "IPX4",
    },
    warranty: "1 year Apple warranty",
    featured: false,
    active: true,
    rating: 4.8,
    reviews: 521,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p5",
    name: "Samsung Galaxy Tab S9 Ultra",
    category: "tablets",
    brand: "Samsung",
    description: 'The most powerful Galaxy Tab ever. A massive 14.6" Dynamic AMOLED 2X display, Snapdragon 8 Gen 2, and seamless multitasking with DeX mode.',
    price: 1150000,
    originalPrice: 1400000,
    discount: 18,
    image: "https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=600&h=600&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=600&h=600&fit=crop&auto=format",
    ],
    quantity: 9,
    sku: "SAM-GTS9U-GRA",
    condition: "New",
    specs: {
      Display: '14.6" Dynamic AMOLED 2X, 120Hz',
      Processor: "Snapdragon 8 Gen 2",
      RAM: "12GB",
      Storage: "256GB",
      Battery: "11200 mAh, 45W",
      Pen: "S Pen included",
    },
    warranty: "1 year Samsung warranty",
    featured: true,
    active: true,
    rating: 4.7,
    reviews: 98,
    badge: "New Arrival",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p6",
    name: "Apple Watch Ultra 2",
    category: "smartwatches",
    brand: "Apple",
    description: "The most rugged and capable Apple Watch ever built for elite athletes and adventurers. Ultra-precise GPS, 36-hour battery, and a titanium case.",
    price: 980000,
    originalPrice: 1120000,
    discount: 13,
    image: "https://images.unsplash.com/photo-1768561327952-119a4c9c76f7?w=600&h=600&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1768561327952-119a4c9c76f7?w=600&h=600&fit=crop&auto=format",
    ],
    quantity: 6,
    sku: "APL-AWU2-TIT",
    condition: "New",
    specs: {
      Case: "49mm Titanium",
      Display: "Always-on Retina LTPO OLED",
      Battery: "36 hours, 60 hours in Low Power Mode",
      GPS: "Precision dual-frequency GPS",
      Water: "100m water resistance",
      Chip: "Apple S9 SiP",
    },
    warranty: "1 year Apple warranty",
    featured: true,
    active: true,
    rating: 4.9,
    reviews: 67,
    badge: "Premium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p7",
    name: "iPhone 15 Pro Max",
    category: "smartphones",
    brand: "Apple",
    description: "Forged in titanium and featuring the A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever.",
    price: 1680000,
    originalPrice: 1900000,
    discount: 12,
    image: "https://images.unsplash.com/photo-1608223483290-fb6031e8b5da?w=600&h=600&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1608223483290-fb6031e8b5da?w=600&h=600&fit=crop&auto=format",
    ],
    quantity: 14,
    sku: "APL-IP15PM-BLK",
    condition: "New",
    specs: {
      Display: '6.7" Super Retina XDR, 120Hz ProMotion',
      Chip: "A17 Pro (3nm)",
      Camera: "48MP main + 12MP ultrawide + 12MP 5x telephoto",
      Battery: "4422 mAh, USB-C charging",
      Storage: "256GB / 512GB / 1TB",
    },
    warranty: "1 year Apple warranty",
    featured: true,
    active: true,
    rating: 4.8,
    reviews: 309,
    badge: "Top Pick",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p8",
    name: "Anker 737 Power Bank 24000mAh",
    category: "power-banks",
    brand: "Anker",
    description: "24000mAh capacity with 140W total output, smart display, and bi-directional fast charging. Power everything from phones to laptops.",
    price: 125000,
    originalPrice: 155000,
    discount: 19,
    image: "https://images.unsplash.com/photo-1530893609608-32a9af3aa95c?w=600&h=600&fit=crop&auto=format",
    images: [
      "https://images.unsplash.com/photo-1530893609608-32a9af3aa95c?w=600&h=600&fit=crop&auto=format",
    ],
    quantity: 55,
    sku: "ANK-737-BLK",
    condition: "New",
    specs: {
      Capacity: "24000mAh",
      Output: "140W maximum",
      Ports: "2x USB-C + 1x USB-A",
      Display: "Smart digital display",
      Weight: "706g",
    },
    warranty: "18 months Anker warranty",
    featured: false,
    active: true,
    rating: 4.6,
    reviews: 178,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const INITIAL_CUSTOMERS: StoredCustomer[] = [
  {
    id: "c1",
    name: "Claudine Uwimana",
    email: "claudine.u@gmail.com",
    ordersCount: 2,
    totalSpent: 1830000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: "c2",
    name: "Jean-Paul Hakizimana",
    email: "jp.hakiza@yahoo.com",
    ordersCount: 1,
    totalSpent: 2860000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    id: "c3",
    name: "Amina Kabanda",
    email: "amina.k@outlook.com",
    ordersCount: 1,
    totalSpent: 390000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
]

const INITIAL_ORDERS: StoredOrder[] = [
  {
    id: "ORD-94A1F8B2",
    customerId: "c1",
    customerName: "Claudine Uwimana",
    phone: "+250 788 112 233",
    email: "claudine.u@gmail.com",
    deliveryAddress: {
      province: "Kigali",
      district: "Gasabo",
      sector: "Kimironko",
      cell: "Bibare",
      street: "KG 123 St",
      instructions: "Near Kimironko Market",
    },
    status: "DELIVERED",
    paymentStatus: "PAID",
    paymentMethod: "mtn",
    subtotal: 1450000,
    deliveryFee: 10000,
    total: 1460000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    items: [
      {
        id: "item-1",
        orderId: "ORD-94A1F8B2",
        productId: "p1",
        productName: "Samsung Galaxy S24 Ultra",
        category: "smartphones",
        sku: "SAM-S24U-BLK",
        quantity: 1,
        unitPrice: 1450000,
        lineTotal: 1450000,
      },
    ],
  },
  {
    id: "ORD-B3C847E1",
    customerId: "c2",
    customerName: "Jean-Paul Hakizimana",
    phone: "+250 789 445 566",
    email: "jp.hakiza@yahoo.com",
    deliveryAddress: {
      province: "Northern",
      district: "Musanze",
      sector: "Muhoza",
      cell: "Ruhengeri",
      street: "NM 45 Ave",
      instructions: "Town centre near bank",
    },
    status: "PROCESSING",
    paymentStatus: "PAID",
    paymentMethod: "airtel",
    subtotal: 2850000,
    deliveryFee: 10000,
    total: 2860000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    items: [
      {
        id: "item-2",
        orderId: "ORD-B3C847E1",
        productId: "p2",
        productName: 'Apple MacBook Pro 14" M3 Pro',
        category: "laptops",
        sku: "APL-MBP14-M3P",
        quantity: 1,
        unitPrice: 2850000,
        lineTotal: 2850000,
      },
    ],
  },
  {
    id: "ORD-D2F904A7",
    customerId: "c3",
    customerName: "Amina Kabanda",
    phone: "+250 783 778 899",
    email: "amina.k@outlook.com",
    deliveryAddress: {
      province: "Southern",
      district: "Huye",
      sector: "Ngoma",
      cell: "Matyazo",
      street: "HU 88 St",
      instructions: "Call when reaching junction",
    },
    status: "PENDING_PAYMENT",
    paymentStatus: "PENDING",
    paymentMethod: "mtn",
    subtotal: 380000,
    deliveryFee: 10000,
    total: 390000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    items: [
      {
        id: "item-3",
        orderId: "ORD-D2F904A7",
        productId: "p3",
        productName: "Sony WH-1000XM5 Headphones",
        category: "headphones",
        sku: "SNY-WH1000XM5-BLK",
        quantity: 1,
        unitPrice: 380000,
        lineTotal: 380000,
      },
    ],
  },
]

const INITIAL_COMPANY_ORDERS: StoredCompanyOrder[] = [
  {
    id: "po_1",
    poNumber: "PO-001",
    supplierName: "Dubai Electronics Wholesale FZ-LLC",
    supplierContact: "+971 4 382 9900 / orders@dubaielectronics.ae",
    shippingCompany: "Emirates Cargo & DHL Global",
    orderDate: "2026-11-10T08:00:00.000Z",
    expectedArrival: "2026-11-25T10:00:00.000Z",
    currency: "USD",
    shippingCost: 450,
    otherCharges: 150,
    totalAmount: 22400,
    status: "SHIPPED",
    paymentStatus: "PAID",
    notes: "Direct container shipment via Dubai to Kigali International Airport.",
    items: [
      {
        id: "poi_1",
        productName: "Samsung Galaxy S24 Ultra",
        category: "smartphones",
        unitPrice: 150,
        quantityOrdered: 40,
        quantityReceived: 0,
        totalPrice: 6000,
        addedToStock: false,
      },
      {
        id: "poi_2",
        productName: "Apple MacBook Pro 14\" M3 Pro",
        category: "laptops",
        unitPrice: 500,
        quantityOrdered: 30,
        quantityReceived: 0,
        totalPrice: 15000,
        addedToStock: false,
      },
      {
        id: "poi_3",
        productName: "Apple AirPods Pro 2nd Gen",
        category: "audio",
        unitPrice: 40,
        quantityOrdered: 20,
        quantityReceived: 0,
        totalPrice: 800,
        addedToStock: false,
      },
    ],
    createdAt: "2026-11-10T08:00:00.000Z",
    updatedAt: "2026-11-10T08:00:00.000Z",
  },
]

const INITIAL_STOCK_MOVEMENTS: StoredStockMovement[] = [
  {
    id: "mov_1",
    productId: "p1",
    productName: "Samsung Galaxy S24 Ultra",
    sku: "SAM-S24U-BLK",
    quantity: -1,
    movementType: "SALE",
    reason: "Online Customer Order ORD-B3C847E1",
    referenceId: "ORD-B3C847E1",
    createdAt: "2026-11-15T19:15:00.000Z",
  },
  {
    id: "mov_2",
    productId: "p2",
    productName: "Apple MacBook Pro 14\" M3 Pro",
    sku: "APL-MBP14-M3P",
    quantity: -1,
    movementType: "SALE",
    reason: "Online Customer Order ORD-A1B2C3D4",
    referenceId: "ORD-A1B2C3D4",
    createdAt: "2026-11-15T14:30:00.000Z",
  },
]

const INITIAL_ANNOUNCEMENTS: StoredAnnouncement[] = [
  {
    id: "ann_1",
    title: "⚡ Flash Friday Dubai Deals",
    message: "Enjoy up to 25% off authentic electronics direct from Dubai wholesalers! Free nationwide delivery on orders over RWF 500,000.",
    tag: "Flash Friday",
    active: true,
    createdAt: new Date().toISOString(),
  },
]

const INITIAL_SETTINGS: StoredWebsiteSettings = {
  shopName: "DubazaarMart",
  companyEmail: "info@dubazaarmart.rw",
  supportEmail: "support@dubazaarmart.rw",
  phoneNumber: "+250789545954",
  whatsappNumber: "+250789545954",
  momoNumber: "+250789545954",
  businessAddress: "Kigali, Rwanda (Dubai Wholesale Direct)",
  currency: "RWF",
  standardDeliveryFee: 10000,
  expressDeliveryFee: 25000,
  freeDeliveryThreshold: 500000,
  updatedAt: new Date().toISOString(),
}

class LocalStore {
  private memoryData: StoreData | null = null
  private writeLock: Promise<void> = Promise.resolve()

  private async ensureDir() {
    if (!existsSync(STORE_DIR)) {
      await mkdir(STORE_DIR, { recursive: true })
    }
  }

  private async load(): Promise<StoreData> {
    if (this.memoryData) return this.memoryData

    await this.ensureDir()

    if (existsSync(STORE_FILE)) {
      try {
        const raw = await readFile(STORE_FILE, "utf-8")
        const parsed = JSON.parse(raw) as Partial<StoreData>
        this.memoryData = {
          admin: parsed.admin ?? INITIAL_ADMIN,
          products: Array.isArray(parsed.products)
            ? parsed.products.map(p => ({
                ...p,
                expectedFullStock: p.expectedFullStock ?? 20,
                unitCost: p.unitCost ?? Math.round((p.price || 100000) * 0.75),
                minStock: p.minStock ?? 5,
              }))
            : [],
          customers: Array.isArray(parsed.customers) ? parsed.customers : [],
          orders: Array.isArray(parsed.orders)
            ? parsed.orders.map(o => ({
                ...o,
                requestedDeliveryTime: o.requestedDeliveryTime ?? null,
                channel: o.channel ?? "web",
                cancelReason: o.cancelReason ?? null,
                customerInstructions: o.customerInstructions ?? (o.deliveryAddress?.instructions || null),
              }))
            : [],
          companyOrders: Array.isArray(parsed.companyOrders) ? parsed.companyOrders : [],
          stockMovements: Array.isArray(parsed.stockMovements) ? parsed.stockMovements : [],
          announcements: Array.isArray(parsed.announcements) ? parsed.announcements : [],
          settings: parsed.settings ? { ...INITIAL_SETTINGS, ...parsed.settings } : INITIAL_SETTINGS,
        }
        return this.memoryData
      } catch (err) {
        console.error("Failed to parse store.json, resetting to defaults", err)
      }
    }

    this.memoryData = {
      admin: INITIAL_ADMIN,
      products: [],
      customers: [],
      orders: [],
      companyOrders: [],
      stockMovements: [],
      announcements: [],
      settings: INITIAL_SETTINGS,
    }

    await this.save(this.memoryData)
    return this.memoryData
  }

  private async save(data: StoreData): Promise<void> {
    this.memoryData = data
    this.writeLock = this.writeLock.then(async () => {
      try {
        await this.ensureDir()
        await writeFile(STORE_FILE, JSON.stringify(data, null, 2), "utf-8")
      } catch (err) {
        console.error("Error saving store.json", err)
      }
    })
    return this.writeLock
  }

  // Admin validation
  async validateAdmin(email: string, pass: string): Promise<boolean> {
    const data = await this.load()
    return (
      data.admin.email.toLowerCase().trim() === email.toLowerCase().trim() &&
      data.admin.password === pass
    )
  }

  async getAdminInfo() {
    const data = await this.load()
    return {
      email: data.admin.email,
      name: data.admin.name,
      role: "admin",
    }
  }

  // Products
  async getProducts(params?: { category?: string; search?: string; activeOnly?: boolean }): Promise<StoredProduct[]> {
    const data = await this.load()
    let list = [...data.products]

    if (params?.activeOnly) {
      list = list.filter(p => p.active)
    }
    if (params?.category && params.category !== "all") {
      list = list.filter(p => p.category.toLowerCase() === params.category!.toLowerCase())
    }
    if (params?.search) {
      const q = params.search.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    }

    return list
  }

  async getProductById(id: string): Promise<StoredProduct | null> {
    const data = await this.load()
    return data.products.find(p => p.id === id) ?? null
  }

  async getProductBySku(sku: string): Promise<StoredProduct | null> {
    const data = await this.load()
    return data.products.find(p => p.sku.toLowerCase() === sku.toLowerCase()) ?? null
  }

  async addProduct(input: Partial<StoredProduct>): Promise<StoredProduct> {
    const data = await this.load()
    const now = new Date().toISOString()
    const id = input.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const sku = input.sku?.trim() || `DUB-${(input.category || "GEN").slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

    const price = Number(input.price) || 0
    const originalPrice = Number(input.originalPrice) || price
    const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0

    const newProduct: StoredProduct = {
      id,
      name: input.name?.trim() || "Untitled Product",
      category: input.category?.trim().toLowerCase() || "accessories",
      brand: input.brand?.trim() || "Dubazaar Direct",
      description: input.description?.trim() || "Authentic Dubai-sourced premium product.",
      price,
      originalPrice,
      discount,
      image: input.image || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop&auto=format",
      images: input.images && input.images.length > 0 ? input.images : [input.image || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop&auto=format"],
      quantity: typeof input.quantity === "number" ? input.quantity : 10,
      sku,
      condition: input.condition || "New",
      specs: input.specs || { Origin: "Dubai, UAE", Condition: "Brand New Sealed" },
      warranty: input.warranty || "1 year official warranty",
      featured: Boolean(input.featured),
      active: input.active !== undefined ? Boolean(input.active) : true,
      rating: input.rating || 5.0,
      reviews: input.reviews || 0,
      badge: input.badge || (discount >= 15 ? "Hot Deal" : "New Arrival"),
      createdAt: now,
      updatedAt: now,
    }

    data.products.unshift(newProduct)
    await this.save(data)
    return newProduct
  }

  async updateProduct(id: string, updates: Partial<StoredProduct>): Promise<StoredProduct | null> {
    const data = await this.load()
    const index = data.products.findIndex(p => p.id === id)
    if (index === -1) return null

    const current = data.products[index]
    const updated: StoredProduct = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    data.products[index] = updated
    await this.save(data)
    return updated
  }

  async deleteProduct(id: string): Promise<boolean> {
    const data = await this.load()
    const index = data.products.findIndex(p => p.id === id)
    if (index === -1) return false

    data.products.splice(index, 1)
    await this.save(data)
    return true
  }

  // Orders
  async createOrder(params: {
    customerName: string
    phone: string
    email: string
    deliveryAddress: Record<string, string>
    paymentMethod: string
    items: Array<{ sku: string; quantity: number }>
    status?: string
    paymentStatus?: string
    requestedDeliveryTime?: string | null
    channel?: "web" | "whatsapp"
    customerInstructions?: string | null
  }): Promise<StoredOrder> {
    const data = await this.load()
    const now = new Date().toISOString()
    const orderId = `ORD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`

    // Resolve items and calculate totals
    const orderItems: StoredOrderItem[] = []
    let subtotal = 0

    for (const itemReq of params.items) {
      const product = data.products.find(p => p.sku.toLowerCase() === itemReq.sku.toLowerCase())
      const unitPrice = product ? product.price : 0
      const lineTotal = unitPrice * itemReq.quantity
      subtotal += lineTotal

      orderItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderId,
        productId: product ? product.id : "",
        productName: product ? product.name : `Product (${itemReq.sku})`,
        category: product ? product.category : "Electronics",
        sku: itemReq.sku,
        quantity: itemReq.quantity,
        unitPrice,
        lineTotal,
      })

      // Decrement inventory stock
      if (product) {
        product.quantity = Math.max(0, product.quantity - itemReq.quantity)
        
        // Record stock movement
        data.stockMovements.unshift({
          id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: -itemReq.quantity,
          movementType: "SALE",
          reason: `Customer order ${orderId} (${params.channel === "whatsapp" ? "WhatsApp" : "Online"})`,
          referenceId: orderId,
          createdAt: now,
        })
      }
    }

    const deliveryFee = 10000
    const total = subtotal + deliveryFee

    // Record or update customer
    let customer = data.customers.find(c => c.email.toLowerCase() === params.email.toLowerCase())
    if (!customer) {
      customer = {
        id: `c_${Date.now()}`,
        name: params.customerName,
        email: params.email.toLowerCase(),
        ordersCount: 1,
        totalSpent: total,
        createdAt: now,
      }
      data.customers.unshift(customer)
    } else {
      customer.ordersCount += 1
      customer.totalSpent += total
      customer.name = params.customerName
    }

    const newOrder: StoredOrder = {
      id: orderId,
      customerId: customer.id,
      customerName: params.customerName,
      phone: params.phone,
      email: params.email.toLowerCase(),
      deliveryAddress: params.deliveryAddress,
      status: params.status || "PENDING_PAYMENT",
      paymentStatus: params.paymentStatus || "PENDING",
      paymentMethod: params.paymentMethod,
      subtotal,
      deliveryFee,
      total,
      requestedDeliveryTime: params.requestedDeliveryTime || null,
      channel: params.channel || "web",
      customerInstructions: params.customerInstructions || params.deliveryAddress.instructions || null,
      createdAt: now,
      items: orderItems,
    }

    data.orders.unshift(newOrder)
    await this.save(data)
    return newOrder
  }

  async getOrders(params: {
    page?: number
    pageSize?: number
    search?: string
    status?: string
    paymentStatus?: string
    channel?: string
  }) {
    const data = await this.load()
    let list = [...data.orders]

    if (params.status && params.status !== "ALL") {
      list = list.filter(o => o.status === params.status)
    }
    if (params.paymentStatus && params.paymentStatus !== "ALL") {
      list = list.filter(o => o.paymentStatus === params.paymentStatus)
    }
    if (params.channel && params.channel !== "ALL") {
      list = list.filter(o => o.channel === params.channel)
    }
    if (params.search) {
      const q = params.search.toLowerCase()
      list = list.filter(
        o =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          o.phone.toLowerCase().includes(q) ||
          o.items.some(i => i.productName.toLowerCase().includes(q)),
      )
    }

    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const totalOrders = list.length
    const totalPages = Math.max(1, Math.ceil(totalOrders / pageSize))
    const offset = (page - 1) * pageSize
    const paginated = list.slice(offset, offset + pageSize)

    return {
      orders: paginated,
      page,
      pageSize,
      totalOrders,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    }
  }

  async getOrderById(orderId: string): Promise<StoredOrder | null> {
    const data = await this.load()
    return data.orders.find(o => o.id === orderId) ?? null
  }

  async updateOrderStatus(orderId: string, status?: string, paymentStatus?: string): Promise<StoredOrder | null> {
    const data = await this.load()
    const order = data.orders.find(o => o.id === orderId)
    if (!order) return null

    if (status) order.status = status
    if (paymentStatus) order.paymentStatus = paymentStatus

    await this.save(data)
    return order
  }

  async cancelOrder(orderId: string, reason: string): Promise<StoredOrder | null> {
    const data = await this.load()
    const order = data.orders.find(o => o.id === orderId)
    if (!order) return null

    order.status = "CANCELLED"
    order.paymentStatus = "CANCELLED"
    order.cancelReason = reason

    // Reconcile stock
    const now = new Date().toISOString()
    for (const item of order.items) {
      const prod = data.products.find(p => p.sku.toLowerCase() === item.sku.toLowerCase() || p.id === item.productId)
      if (prod) {
        prod.quantity += item.quantity
        data.stockMovements.unshift({
          id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: item.quantity,
          movementType: "ADJUSTMENT",
          reason: `Stock restored from cancelled order ${orderId}: ${reason}`,
          referenceId: orderId,
          createdAt: now,
        })
      }
    }

    await this.save(data)
    return order
  }

  async recordManualPayment(orderId: string, note?: string): Promise<StoredOrder | null> {
    const data = await this.load()
    const order = data.orders.find(o => o.id === orderId)
    if (!order) return null

    order.paymentStatus = "PAID"
    if (order.status === "PENDING_PAYMENT") {
      order.status = "PROCESSING"
    }
    if (note) {
      order.customerInstructions = (order.customerInstructions ? `${order.customerInstructions} | ` : "") + `Manual payment authorized: ${note}`
    }

    await this.save(data)
    return order
  }

  async deleteOrder(orderId: string): Promise<boolean> {
    const data = await this.load()
    const index = data.orders.findIndex(o => o.id === orderId)
    if (index === -1) return false

    const order = data.orders[index]

    // If order was not cancelled, return stock
    if (order.status !== "CANCELLED") {
      const now = new Date().toISOString()
      for (const item of order.items) {
        const prod = data.products.find(p => p.sku.toLowerCase() === item.sku.toLowerCase() || p.id === item.productId)
        if (prod) {
          prod.quantity += item.quantity
        }
      }
    }

    // Decrement customer stats if applicable
    const customer = data.customers.find(c => c.id === order.customerId || c.email.toLowerCase() === order.email.toLowerCase())
    if (customer) {
      customer.ordersCount = Math.max(0, customer.ordersCount - 1)
      customer.totalSpent = Math.max(0, customer.totalSpent - order.total)
    }

    data.orders.splice(index, 1)
    await this.save(data)
    return true
  }

  // ----------------------------------------------------
  // Company Orders / Purchase Orders (USD)
  // ----------------------------------------------------
  async getCompanyOrders(search?: string, status?: string): Promise<StoredCompanyOrder[]> {
    const data = await this.load()
    let list = [...data.companyOrders]

    if (status && status !== "ALL") {
      list = list.filter(po => po.status === status)
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        po =>
          po.poNumber.toLowerCase().includes(q) ||
          po.supplierName.toLowerCase().includes(q) ||
          po.shippingCompany.toLowerCase().includes(q) ||
          po.items.some(it => it.productName.toLowerCase().includes(q)),
      )
    }

    // Sort by expected arrival
    return list.sort((a, b) => new Date(a.expectedArrival).getTime() - new Date(b.expectedArrival).getTime())
  }

  async createCompanyOrder(input: {
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
  }): Promise<StoredCompanyOrder> {
    const data = await this.load()
    const now = new Date().toISOString()
    const poNumber = `PO-${String(data.companyOrders.length + 1).padStart(3, "0")}`

    const shippingCost = Number(input.shippingCost) || 0
    const otherCharges = Number(input.otherCharges) || 0

    const items: StoredCompanyOrderItem[] = input.items.map((it, idx) => ({
      id: `poi_${Date.now()}_${idx}`,
      productName: it.productName.trim(),
      category: it.category?.trim() || "electronics",
      unitPrice: Number(it.unitPrice) || 0,
      quantityOrdered: Number(it.quantityOrdered) || 1,
      quantityReceived: 0,
      totalPrice: Number(((Number(it.unitPrice) || 0) * (Number(it.quantityOrdered) || 1)).toFixed(2)),
      addedToStock: false,
    }))

    const productTotal = items.reduce((sum, it) => sum + it.totalPrice, 0)
    const totalAmount = Number((productTotal + shippingCost + otherCharges).toFixed(2))

    const newPO: StoredCompanyOrder = {
      id: `po_${Date.now()}`,
      poNumber,
      supplierName: input.supplierName.trim(),
      supplierContact: input.supplierContact?.trim() || "",
      shippingCompany: input.shippingCompany.trim(),
      orderDate: now,
      expectedArrival: new Date(input.expectedArrival).toISOString(),
      currency: "USD",
      shippingCost,
      otherCharges,
      totalAmount,
      status: "ORDERED",
      paymentStatus: "PAID",
      notes: input.notes?.trim() || "",
      items,
      createdAt: now,
      updatedAt: now,
    }

    data.companyOrders.unshift(newPO)
    await this.save(data)
    return newPO
  }

  async updateCompanyOrder(id: string, updates: Partial<StoredCompanyOrder>): Promise<StoredCompanyOrder | null> {
    const data = await this.load()
    const index = data.companyOrders.findIndex(po => po.id === id)
    if (index === -1) return null

    const current = data.companyOrders[index]
    const updated: StoredCompanyOrder = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    data.companyOrders[index] = updated
    await this.save(data)
    return updated
  }

  async addCompanyOrderToStock(
    poId: string,
    receivedItems: Array<{ itemId: string; quantityReceived: number }>,
  ): Promise<{ success: boolean; po: StoredCompanyOrder; addedCount: number; message: string }> {
    const data = await this.load()
    const po = data.companyOrders.find(p => p.id === poId)
    if (!po) {
      throw new Error("Company Purchase Order not found.")
    }

    const now = new Date().toISOString()
    let totalAdded = 0

    for (const rec of receivedItems) {
      const item = po.items.find(it => it.id === rec.itemId)
      if (!item) continue

      const qtyToAdd = Math.max(0, Number(rec.quantityReceived) || 0)
      if (qtyToAdd <= 0) continue

      // Verify we don't exceed ordered quantity
      const remainingOrdered = item.quantityOrdered - (item.quantityReceived || 0)
      const actualQtyToAdd = Math.min(qtyToAdd, remainingOrdered)
      if (actualQtyToAdd <= 0) continue

      item.quantityReceived = (item.quantityReceived || 0) + actualQtyToAdd
      if (item.quantityReceived >= item.quantityOrdered) {
        item.addedToStock = true
      }

      // Update warehouse stock
      let product = data.products.find(
        p => p.name.toLowerCase() === item.productName.toLowerCase(),
      )
      if (!product) {
        // Create product into catalog if it was a new imported product
        product = {
          id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: item.productName,
          category: item.category || "electronics",
          brand: "Dubai Import",
          description: `Imported direct from ${po.supplierName}.`,
          price: Math.round(item.unitPrice * 1400 * 1.3), // approx RWF selling price
          originalPrice: Math.round(item.unitPrice * 1400 * 1.5),
          discount: 15,
          image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop&auto=format",
          images: [],
          quantity: actualQtyToAdd,
          sku: `IMP-${(item.category || "GEN").slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          condition: "New",
          specs: { Origin: "Dubai, UAE", Supplier: po.supplierName },
          warranty: "1 year official warranty",
          featured: false,
          active: true,
          rating: 5.0,
          reviews: 0,
          expectedFullStock: Math.max(20, actualQtyToAdd),
          unitCost: Math.round(item.unitPrice * 1400),
          minStock: 5,
          createdAt: now,
          updatedAt: now,
        }
        data.products.unshift(product)
      } else {
        product.quantity += actualQtyToAdd
        product.updatedAt = now
      }

      // Record in Stock Movement History
      data.stockMovements.unshift({
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: actualQtyToAdd,
        movementType: "PURCHASE_RECEIPT",
        reason: `Received from ${po.poNumber} (${po.supplierName})`,
        referenceId: po.poNumber,
        createdAt: now,
      })

      totalAdded += actualQtyToAdd
    }

    // Determine status
    const allFull = po.items.every(it => (it.quantityReceived || 0) >= it.quantityOrdered)
    const anyReceived = po.items.some(it => (it.quantityReceived || 0) > 0)
    po.status = allFull ? "RECEIVED" : anyReceived ? "PARTIALLY_RECEIVED" : po.status
    po.updatedAt = now

    await this.save(data)
    return {
      success: true,
      po,
      addedCount: totalAdded,
      message: `Successfully received and added ${totalAdded} units to warehouse stock.`,
    }
  }

  async deleteCompanyOrder(poId: string): Promise<boolean> {
    const data = await this.load()
    const index = data.companyOrders.findIndex(po => po.id === poId || po.poNumber === poId)
    if (index === -1) return false

    data.companyOrders.splice(index, 1)
    await this.save(data)
    return true
  }

  // ----------------------------------------------------
  // Stock Management & Movement History
  // ----------------------------------------------------
  async getStockSummary() {
    const data = await this.load()
    const products = data.products

    let totalStockUnits = 0
    let totalInventoryValue = 0

    const items = products.map(p => {
      const quantity = p.quantity
      const targetStock = p.expectedFullStock ?? 20
      const minStock = p.minStock ?? 5
      const unitCost = p.unitCost ?? Math.round(p.price * 0.75)
      const totalValue = quantity * unitCost

      totalStockUnits += quantity
      totalInventoryValue += totalValue

      let statusColor: "RED" | "YELLOW" | "GREEN"
      if (quantity <= minStock) {
        statusColor = "RED" // low stock
      } else if (quantity < targetStock) {
        statusColor = "YELLOW" // average stock
      } else {
        statusColor = "GREEN" // full / high stock
      }

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        brand: p.brand,
        category: p.category,
        quantity,
        targetStock,
        minStock,
        unitCost,
        sellingPrice: p.price,
        totalValue,
        statusColor,
        active: p.active,
        image: p.image,
        lastUpdated: p.updatedAt,
      }
    })

    return {
      items,
      totalProducts: products.length,
      totalStockUnits,
      totalInventoryValue,
      lowStockCount: items.filter(i => i.statusColor === "RED").length,
      averageStockCount: items.filter(i => i.statusColor === "YELLOW").length,
      fullStockCount: items.filter(i => i.statusColor === "GREEN").length,
    }
  }

  async removeStockManual(productId: string, quantity: number, reason: string): Promise<{ success: boolean; remainingQuantity: number }> {
    const data = await this.load()
    const product = data.products.find(p => p.id === productId || p.sku.toLowerCase() === productId.toLowerCase())
    if (!product) {
      throw new Error("Product not found in stock.")
    }

    const qtyToRemove = Math.max(1, Number(quantity) || 1)
    if (product.quantity < qtyToRemove) {
      throw new Error(`Cannot remove ${qtyToRemove} units. Only ${product.quantity} units available in stock.`)
    }

    product.quantity -= qtyToRemove
    const now = new Date().toISOString()
    product.updatedAt = now

    // Record in movements
    data.stockMovements.unshift({
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: -qtyToRemove,
      movementType: "MANUAL_REMOVAL",
      reason: reason.trim() || "Manual removal / external sale",
      createdAt: now,
    })

    await this.save(data)
    return { success: true, remainingQuantity: product.quantity }
  }

  async updateStockItem(
    productId: string,
    updates: { expectedFullStock?: number; unitCost?: number; minStock?: number; quantity?: number },
  ) {
    const data = await this.load()
    const product = data.products.find(p => p.id === productId || p.sku.toLowerCase() === productId.toLowerCase())
    if (!product) throw new Error("Product not found.")

    const now = new Date().toISOString()
    if (typeof updates.expectedFullStock === "number") product.expectedFullStock = updates.expectedFullStock
    if (typeof updates.unitCost === "number") product.unitCost = updates.unitCost
    if (typeof updates.minStock === "number") product.minStock = updates.minStock

    if (typeof updates.quantity === "number" && updates.quantity !== product.quantity) {
      const diff = updates.quantity - product.quantity
      product.quantity = updates.quantity
      data.stockMovements.unshift({
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: diff,
        movementType: "ADJUSTMENT",
        reason: "Stock audit / inventory target adjustment",
        createdAt: now,
      })
    }

    product.updatedAt = now
    await this.save(data)
    return product
  }

  async getStockMovements(productId?: string, limit = 100): Promise<StoredStockMovement[]> {
    const data = await this.load()
    let list = [...data.stockMovements]
    if (productId) {
      list = list.filter(m => m.productId === productId)
    }
    return list.slice(0, limit)
  }

  // ----------------------------------------------------
  // Website Settings & Company Info
  // ----------------------------------------------------
  async getSettings(): Promise<StoredWebsiteSettings> {
    const data = await this.load()
    return data.settings
  }

  async updateSettings(updates: Partial<StoredWebsiteSettings>): Promise<StoredWebsiteSettings> {
    const data = await this.load()
    data.settings = {
      ...data.settings,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    await this.save(data)
    return data.settings
  }

  // ----------------------------------------------------
  // Announcements
  // ----------------------------------------------------
  async getAnnouncements(): Promise<StoredAnnouncement[]> {
    const data = await this.load()
    return data.announcements
  }

  async getActiveAnnouncements(): Promise<StoredAnnouncement[]> {
    const data = await this.load()
    const now = new Date().getTime()
    return data.announcements.filter(a => {
      if (!a.active) return false
      if (a.startDate && new Date(a.startDate).getTime() > now) return false
      if (a.endDate && new Date(a.endDate).getTime() < now) return false
      return true
    })
  }

  async createAnnouncement(input: {
    title: string
    message: string
    tag?: string
    startDate?: string
    endDate?: string
  }): Promise<StoredAnnouncement> {
    const data = await this.load()
    const newAnn: StoredAnnouncement = {
      id: `ann_${Date.now()}`,
      title: input.title.trim(),
      message: input.message.trim(),
      tag: input.tag?.trim() || "Announcement",
      active: true,
      startDate: input.startDate || undefined,
      endDate: input.endDate || undefined,
      createdAt: new Date().toISOString(),
    }
    data.announcements.unshift(newAnn)
    await this.save(data)
    return newAnn
  }

  async updateAnnouncement(id: string, updates: Partial<StoredAnnouncement>): Promise<StoredAnnouncement | null> {
    const data = await this.load()
    const index = data.announcements.findIndex(a => a.id === id)
    if (index === -1) return null

    data.announcements[index] = {
      ...data.announcements[index],
      ...updates,
    }
    await this.save(data)
    return data.announcements[index]
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const data = await this.load()
    const index = data.announcements.findIndex(a => a.id === id)
    if (index === -1) return false
    data.announcements.splice(index, 1)
    await this.save(data)
    return true
  }

  // Dashboard Aggregations
  async getDashboardData(range: "7d" | "30d" | "12m" = "7d") {
    const data = await this.load()
    const orders = data.orders
    const products = data.products
    const customers = data.customers

    const paidOrders = orders.filter(o => o.paymentStatus === "PAID")
    const pendingOrders = orders.filter(o => o.paymentStatus === "PENDING" || o.paymentStatus === "PROCESSING")

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0)
    const expectedRevenue = pendingOrders.reduce((sum, o) => sum + o.total, 0)

    const todayStr = new Date().toISOString().slice(0, 10)
    const todaysRevenue = paidOrders
      .filter(o => o.createdAt.slice(0, 10) === todayStr)
      .reduce((sum, o) => sum + o.total, 0)

    const lowStockCount = products.filter(p => p.quantity <= 5 && p.active).length
    const activeProductsCount = products.filter(p => p.active).length

    // Revenue Trend by dates
    const days = range === "30d" ? 30 : range === "12m" ? 12 : 7
    const revenueTrend: Array<{ date: string; amount: number }> = []

    if (range === "12m") {
      const now = new Date()
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = d.toISOString().slice(0, 7) // YYYY-MM
        const monthTotal = paidOrders
          .filter(o => o.createdAt.startsWith(monthKey))
          .reduce((sum, o) => sum + o.total, 0)
        revenueTrend.push({ date: `${monthKey}-01`, amount: monthTotal })
      }
    } else {
      const now = new Date()
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dayKey = d.toISOString().slice(0, 10)
        const dayTotal = paidOrders
          .filter(o => o.createdAt.slice(0, 10) === dayKey)
          .reduce((sum, o) => sum + o.total, 0)
        revenueTrend.push({ date: dayKey, amount: dayTotal })
      }
    }

    // Pipeline
    const pipelineMap = new Map<string, number>()
    for (const o of orders) {
      pipelineMap.set(o.status, (pipelineMap.get(o.status) || 0) + 1)
    }
    const orderPipeline = Array.from(pipelineMap.entries()).map(([label, value]) => ({ label, value }))

    // Payment breakdown
    const paymentMap = new Map<string, { value: number; amount: number }>()
    for (const o of orders) {
      const prev = paymentMap.get(o.paymentStatus) || { value: 0, amount: 0 }
      paymentMap.set(o.paymentStatus, { value: prev.value + 1, amount: prev.amount + o.total })
    }
    const paymentBreakdown = Array.from(paymentMap.entries()).map(([label, info]) => ({
      label,
      value: info.value,
      amount: info.amount,
    }))

    // Category Sales
    const categoryMap = new Map<string, { value: number; amount: number }>()
    for (const o of paidOrders) {
      for (const item of o.items) {
        const cat = item.category || "General"
        const prev = categoryMap.get(cat) || { value: 0, amount: 0 }
        categoryMap.set(cat, { value: prev.value + item.quantity, amount: prev.amount + item.lineTotal })
      }
    }
    const categorySales = Array.from(categoryMap.entries())
      .map(([label, info]) => ({ label, value: info.value, amount: info.amount }))
      .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))

    // Top products
    const topProdMap = new Map<string, { value: number; amount: number }>()
    for (const o of paidOrders) {
      for (const item of o.items) {
        const prod = item.productName
        const prev = topProdMap.get(prod) || { value: 0, amount: 0 }
        topProdMap.set(prod, { value: prev.value + item.quantity, amount: prev.amount + item.lineTotal })
      }
    }
    const topProducts = Array.from(topProdMap.entries())
      .map(([label, info]) => ({ label, value: info.value, amount: info.amount }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    // Inventory health
    const outOfStock = products.filter(p => p.quantity === 0 && p.active).length
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= 5 && p.active).length
    const healthy = products.filter(p => p.quantity > 5 && p.active).length
    const inactive = products.filter(p => !p.active).length
    const inventoryHealth = [
      { label: "Healthy", value: healthy },
      { label: "Low stock", value: lowStock },
      { label: "Out of stock", value: outOfStock },
      { label: "Inactive", value: inactive },
    ]

    const formatRWF = (n: number) => `RWF ${n.toLocaleString("en-US")}`

    return {
      stats: [
        {
          label: "Confirmed revenue",
          value: formatRWF(totalRevenue),
          change: "Verified paid",
          icon: "revenue",
          up: true,
        },
        {
          label: "Expected revenue",
          value: formatRWF(expectedRevenue),
          change: "Awaiting payment",
          icon: "expected",
          up: true,
        },
        {
          label: "Today's revenue",
          value: formatRWF(todaysRevenue),
          change: "Verified today",
          icon: "trend",
          up: true,
        },
        {
          label: "Total Orders",
          value: orders.length.toLocaleString("en-US"),
          change: `${pendingOrders.length} pending`,
          icon: "orders",
          up: true,
        },
        {
          label: "Paid Orders",
          value: paidOrders.length.toLocaleString("en-US"),
          change: `${orders.filter(o => o.status === "DELIVERED").length} delivered`,
          icon: "paid",
          up: true,
        },
        {
          label: "Total Customers",
          value: customers.length.toLocaleString("en-US"),
          change: "All time",
          icon: "customers",
          up: true,
        },
        {
          label: "Active Products",
          value: activeProductsCount.toLocaleString("en-US"),
          change: "Catalog count",
          icon: "products",
          up: true,
        },
        {
          label: "Low Stock Items",
          value: lowStockCount.toLocaleString("en-US"),
          change: "5 or fewer left",
          icon: "inventory",
          up: false,
        },
      ],
      recentOrders: orders.slice(0, 10).map(o => ({
        id: o.id,
        customer: o.customerName,
        amount: o.total,
        status: o.status,
        date: o.createdAt.slice(0, 10),
        items: o.items.length,
      })),
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        sku: p.sku,
        price: p.price,
        quantity: p.quantity,
        active: p.active,
        image: p.image,
      })),
      customers: customers.slice(0, 10).map(c => ({
        name: c.name,
        email: c.email,
        orders: c.ordersCount,
        total: c.totalSpent,
        joined: c.createdAt.slice(0, 10),
      })),
      inventory: products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        quantity: p.quantity,
      })),
      revenueTrend,
      orderPipeline,
      paymentBreakdown,
      categorySales,
      topProducts,
      inventoryHealth,
    }
  }
}

export const localStore = new LocalStore()
