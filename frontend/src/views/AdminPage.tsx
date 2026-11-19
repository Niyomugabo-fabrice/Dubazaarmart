"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  fetchAdminOrders,
  fetchDashboardData,
  streamAdminOrderEvents,
  fetchCompanyOrders,
  fetchStockSummary,
  fetchStockMovements,
  fetchWebsiteSettings,
  updateWebsiteSettings,
  cancelAdminOrder,
  recordAdminOrderPayment,
  deleteAdminOrder,
  deleteCompanyOrder,
  type AdminOrdersPage,
  type DashboardData,
  type RevenueRange,
  type AdminOrder,
  type CompanyOrder,
  type StockOverview,
  type StockItemSummary,
  type StockMovement,
  type WebsiteSettings,
} from "../lib/dashboardApi"
import { apiFetch, apiUrl } from "../services/api-client"
import SiteLogo from "../components/SiteLogo"
import { useAdminAuth } from "../store/adminAuthStore"
import { useProducts, fetchProductsFromBackend } from "../store/productsStore"
import AdminLoginView from "../components/AdminLoginView"
import LiveCountdown from "../components/LiveCountdown"
import type { StoredProduct } from "../types/product"
import { useAppNavigation } from "../lib/navigation"
import { useToast } from "../components/ui/Toast"

const AddProductModal = dynamic(() => import("../components/AddProductModal"))
const CreateOrderModal = dynamic(() => import("../components/CreateOrderModal"))
const CustomerOrderDetailsModal = dynamic(() => import("../components/CustomerOrderDetailsModal"))
const CancelOrderModal = dynamic(() => import("../components/CancelOrderModal"))
const CreateCompanyOrderModal = dynamic(() => import("../components/CreateCompanyOrderModal"))
const EditCompanyOrderModal = dynamic(() => import("../components/EditCompanyOrderModal"))
const ReceiveCompanyOrderModal = dynamic(() => import("../components/ReceiveCompanyOrderModal"))
const RemoveStockModal = dynamic(() => import("../components/RemoveStockModal"))
const EditStockItemModal = dynamic(() => import("../components/EditStockItemModal"))
const EditProductModal = dynamic(() => import("../components/EditProductModal"))
const ConfirmModal = dynamic(() => import("../components/ConfirmModal"))
const StaffManagementPanel = dynamic(() => import("./admin/StaffManagementPanel"), {
  loading: () => <div role="status" aria-live="polite" className="p-6 text-sm text-slate-500">Loading user management…</div>,
})
const AuditLogPanel = dynamic(() => import("./admin/AuditLogPanel"), {
  loading: () => <div role="status" aria-live="polite" className="p-6 text-sm text-slate-500">Loading audit logs…</div>,
})
const AnnouncementsPanel = dynamic(() => import("./admin/AnnouncementsPanel"), {
  loading: () => <div role="status" aria-live="polite" className="p-6 text-sm text-slate-500">Loading announcements…</div>,
})

function DashboardIcon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }

  if (
    name === "revenue" ||
    name === "expected" ||
    name === "trend" ||
    name === "paid"
  ) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path {...common} d="M4 19V9m5 10V5m5 14v-7m5 7V3" />
      </svg>
    )
  }
  if (name === "inventory") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          {...common}
          d="M12 8v5m0 4h.01M10.3 3.7 2.5 18a2 2 0 0 0 1.8 3h15.4a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path {...common} d="m4 7 8-4 8 4-8 4-8-4Zm0 0v10l8 4 8-4V7m-8 4v10" />
    </svg>
  )
}

function getSemanticColor(label: string, index: number): string {
  const normalized = label.toUpperCase()
  if (normalized.includes("PAID") || normalized.includes("DELIVERED") || normalized.includes("HEALTHY") || normalized.includes("IN_STOCK")) {
    return "#10B981" // Crisp Emerald
  }
  if (normalized.includes("PENDING") || normalized.includes("LOW")) {
    return "#F59E0B" // Crisp Amber
  }
  if (normalized.includes("PROCESSING") || normalized.includes("SHIPPED")) {
    return "#2563EB" // Crisp Royal Blue
  }
  if (normalized.includes("CANCEL") || normalized.includes("OUT_OF_STOCK") || normalized.includes("OUT OF STOCK") || normalized.includes("FAIL")) {
    return "#DC2626" // Crisp Red
  }
  if (normalized.includes("PACKED")) {
    return "#8B5CF6" // Purple
  }
  if (normalized.includes("INACTIVE") || normalized.includes("RETURN")) {
    return "#6B7280" // Slate Gray
  }
  const fallback = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EA580C", "#0D9488"]
  return fallback[index % fallback.length]
}

function HorizontalBreakdown({
  data,
  valueLabel,
  color,
}: {
  data: Array<{ label: string; value: number; amount?: number }>
  valueLabel: (item: { label: string; value: number; amount?: number }) => string
  color?: string
}) {
  const max = Math.max(0, ...data.map((item) => item.amount ?? item.value))
  const total = data.reduce((sum, item) => sum + (item.amount ?? item.value), 0)

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center text-xs text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <span className="text-xl mb-1">📊</span>
        <span>No sales recorded in this category yet</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const measure = item.amount ?? item.value
        const width = max > 0 ? Math.max(6, (measure / max) * 100) : 6
        const pct = total > 0 ? Math.round((measure / total) * 100) : 0
        const barColor = color || getSemanticColor(item.label, idx)

        return (
          <div key={item.label} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-[#111111] truncate">
                {item.label.replace(/_/g, " ")}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-black text-[#111111]">
                  {valueLabel(item)}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                  {pct}%
                </span>
              </div>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80 border border-slate-300/40">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${width}%`, background: barColor }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DonutBreakdown({
  data,
  centerLabel,
}: {
  data: Array<{ label: string; value: number }>
  centerLabel: string
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let cursor = 0
  const stops = data.map((item, index) => {
    const start = cursor
    cursor += total > 0 ? (item.value / total) * 100 : 0
    const color = getSemanticColor(item.label, index)
    return `${color} ${start}% ${cursor}%`
  })
  const background = total > 0 ? `conic-gradient(${stops.join(", ")})` : "#F1F5F9"

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[140px_1fr]">
      <div
        className="relative mx-auto h-36 w-36 rounded-full shadow-md"
        style={{ background, border: "3px solid #E2E8F0" }}
      >
        <div className="absolute inset-[16px] flex flex-col items-center justify-center rounded-full bg-white shadow-inner border border-slate-200">
          <div className="text-2xl font-black text-[#111111]">
            {total.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            {centerLabel}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => {
          const color = getSemanticColor(item.label, index)
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
          return (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 transition-all hover:bg-slate-100/80"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 w-3 flex-shrink-0 rounded-full shadow-xs"
                  style={{ background: color }}
                />
                <span className="truncate font-bold text-slate-800">
                  {item.label.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 font-bold text-slate-900">
                <span>{item.value.toLocaleString()}</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: `${color}18`, color }}
                >
                  {pct}%
                </span>
              </div>
            </div>
          )
        })}
        {data.length === 0 && (
          <div className="text-xs text-slate-500 p-4 text-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
            No records in this period
          </div>
        )}
      </div>
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "#F59E0B", // Amber
  PAID: "#10B981",            // Emerald Green
  PROCESSING: "#2563EB",      // Royal Blue
  PACKED: "#8B5CF6",          // Purple
  SHIPPED: "#6366F1",         // Indigo
  OUT_FOR_DELIVERY: "#EA580C",// Orange
  DELIVERED: "#059669",       // Forest Green
  CANCELLED: "#DC2626",       // Crimson Red
  RETURNED: "#6B7280",        // Gray
}

type AdminSection = "overview" | "orders" | "companyOrders" | "products" | "inventory" | "announcements" | "settings" | "staff" | "audit"

export default function AdminPage() {
  const { navigate } = useAppNavigation()
  const toast = useToast()
  const { isAuthenticated, admin, token: adminToken, login, logout } = useAdminAuth()
  const isManager = admin?.role === "MANAGER"
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const profileInitials = (admin?.name || "User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
  const hasPermission = useCallback(
    (permission: string) => isManager || admin?.role === "STAFF" || Boolean(admin?.permissions.includes(permission)),
    [admin, isManager],
  )
  const { products: storeProducts, deleteProduct } = useProducts()
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const [section, setSectionState] = useState<AdminSection>(() => {
    if (typeof window === "undefined") return "overview"
    const stored = sessionStorage.getItem("dubazaar_admin_section") as AdminSection
    if (stored && ["overview", "orders", "companyOrders", "products", "inventory", "announcements", "settings", "staff", "audit"].includes(stored)) {
      return stored
    }
    return "overview"
  })

  function setSection(s: AdminSection) {
    setSectionState(s)
    if (typeof window !== "undefined") {
      sessionStorage.setItem("dubazaar_admin_section", s)
    }
  }

  useEffect(() => {
    if (!profileMenuOpen) return
    function closeProfileMenu(event: PointerEvent) {
      if (event.target instanceof Node && !profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }
    function handleProfileMenuKey(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileMenuOpen(false)
    }
    document.addEventListener("pointerdown", closeProfileMenu)
    document.addEventListener("keydown", handleProfileMenuKey)
    return () => {
      document.removeEventListener("pointerdown", closeProfileMenu)
      document.removeEventListener("keydown", handleProfileMenuKey)
    }
  }, [profileMenuOpen])

  useEffect(() => {
    const requiredPermissions: Partial<Record<AdminSection, string>> = {
      overview: "reports.view",
      orders: "orders.view",
      companyOrders: "procurement.view",
      products: "products.view",
      inventory: "inventory.view",
      announcements: "announcements.view",
    }
    if (isManager || (section !== "settings" && section !== "staff" && section !== "audit" &&
      (!requiredPermissions[section] || hasPermission(requiredPermissions[section] as string)))) return
    const fallback: AdminSection = isManager
      ? "overview"
      : (["overview", "orders", "products", "inventory", "companyOrders", "announcements"] as AdminSection[])
        .find((candidate) => {
          const permission = requiredPermissions[candidate]
          return permission !== undefined && hasPermission(permission)
        }) ?? "overview"
    setSectionState(fallback)
    if (typeof window !== "undefined") sessionStorage.setItem("dubazaar_admin_section", fallback)
  }, [admin, hasPermission, isManager, section])
  const [productSearch, setProductSearch] = useState("")
  const [orderSearch, setOrderSearch] = useState("")
  const [orderFilter, setOrderFilter] = useState("ALL")
  const [paymentFilter, setPaymentFilter] = useState("ALL")
  const [channelFilter, setChannelFilter] = useState("ALL")
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersPageSize, setOrdersPageSize] = useState(10)
  const [ordersData, setOrdersData] = useState<AdminOrdersPage | null>(null)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [liveUpdatesConnected, setLiveUpdatesConnected] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [revenueRange, setRevenueRange] = useState<RevenueRange>("7d")
  const [refreshToken, setRefreshToken] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Modals & New Features State
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<AdminOrder | null>(null)
  const [orderIdToCancel, setOrderIdToCancel] = useState<string | null>(null)
  const [productToEdit, setProductToEdit] = useState<StoredProduct | null>(null)

  // Company Purchase Orders State
  const [companyOrders, setCompanyOrders] = useState<CompanyOrder[]>([])
  const [companyOrderSearch, setCompanyOrderSearch] = useState("")
  const [companyOrderStatusFilter, setCompanyOrderStatusFilter] = useState("ALL")
  const [companyOrdersLoading, setCompanyOrdersLoading] = useState(false)
  const [isCreateCompanyOrderOpen, setIsCreateCompanyOrderOpen] = useState(false)
  const [poForEdit, setPoForEdit] = useState<CompanyOrder | null>(null)
  const [poForReceive, setPoForReceive] = useState<CompanyOrder | null>(null)
  const [visibleCompanyOrderCount, setVisibleCompanyOrderCount] = useState(5)
  const [expandedCompanyOrderIds, setExpandedCompanyOrderIds] = useState<string[]>([])

  // Inventory & Stock State
  const [stockOverview, setStockOverview] = useState<StockOverview | null>(null)
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [stockTab, setStockTab] = useState<"items" | "movements">("items")
  const [stockSearch, setStockSearch] = useState("")
  const [isRemoveStockOpen, setIsRemoveStockOpen] = useState(false)
  const [preselectedStockItem, setPreselectedStockItem] = useState<StockItemSummary | null>(null)
  const [stockItemToEdit, setStockItemToEdit] = useState<StockItemSummary | null>(null)

  // Settings State
  const [settingsData, setSettingsData] = useState<WebsiteSettings | null>(null)
  const [settingsSaving, setSettingsSaving] = useState(false)

  // Confirmation Modals State
  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState<string | null>(null)
  const [confirmDeletePo, setConfirmDeletePo] = useState<{ id: string; poNumber: string } | null>(null)
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<{ id: string; name: string } | null>(null)

  async function handleUpdateOrderStatus(orderId: string, newStatus: string) {
    try {
      const isPaid = newStatus === "PAID" || newStatus === "DELIVERED"
      await apiFetch(apiUrl(`/api/admin/orders/${orderId}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
        body: JSON.stringify({
          status: newStatus,
          paymentStatus: isPaid ? "PAID" : undefined,
        }),
      })
      setActionSuccess(`Order #${orderId.slice(0, 8)} status updated to ${newStatus}`)
      setTimeout(() => setActionSuccess(null), 3500)
      setRefreshToken((v) => v + 1)
    } catch (err) {
      console.error("Failed to update status", err)
    }
  }

  async function handleCancelOrder(orderId: string, reason: string) {
    await cancelAdminOrder(orderId, reason)
    setActionSuccess(`Order #${orderId.slice(0, 8)} cancelled. Restocked products into inventory.`)
    setTimeout(() => setActionSuccess(null), 3500)
    setRefreshToken((v) => v + 1)
  }

  async function handleRecordPayment(orderId: string) {
    await recordAdminOrderPayment(orderId, "Authorized by admin via MoMo/Airtel")
    setActionSuccess(`Payment for Order #${orderId.slice(0, 8)} marked as PAID!`)
    setTimeout(() => setActionSuccess(null), 3500)
    setRefreshToken((v) => v + 1)
  }

  function handleDeleteOrder(orderId: string) {
    setConfirmDeleteOrder(orderId)
  }

  async function executeDeleteOrder(orderId: string) {
    try {
      await deleteAdminOrder(orderId)
      setActionSuccess(`Order #${orderId.slice(0, 8)} archived and retained for records.`)
      setTimeout(() => setActionSuccess(null), 3500)
      setRefreshToken((v) => v + 1)
    } catch (err) {
      console.error("Failed to delete order", err)
      toast.error(err instanceof Error ? err.message : "Failed to delete order", "Delete Failed")
    } finally {
      setConfirmDeleteOrder(null)
    }
  }

  function handleDeleteCompanyOrder(poId: string, poNumber: string) {
    setConfirmDeletePo({ id: poId, poNumber })
  }

  async function executeDeleteCompanyOrder(poId: string, poNumber: string) {
    try {
      await deleteCompanyOrder(poId)
      setActionSuccess(`Purchase Order #${poNumber} archived and retained for records.`)
      setTimeout(() => setActionSuccess(null), 3500)
      setRefreshToken((v) => v + 1)
    } catch (err) {
      console.error("Failed to delete company order", err)
      toast.error(err instanceof Error ? err.message : "Failed to delete company order", "Delete Failed")
    } finally {
      setConfirmDeletePo(null)
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    if (!settingsData) return
    try {
      setSettingsSaving(true)
      const updated = await updateWebsiteSettings(settingsData)
      setSettingsData(updated)
      setActionSuccess("Website settings & contact information saved and synced across store!")
      setTimeout(() => setActionSuccess(null), 3500)
    } catch (err) {
      console.error("Failed to save settings", err)
    } finally {
      setSettingsSaving(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    let isMounted = true

    async function loadDashboardData() {
      try {
        setIsLoading(true)
        setLoadError(null)
        const result = await fetchDashboardData(revenueRange)
        if (!isMounted) return
        setDashboardData(result.data)
        setIsUsingFallback(result.isFallback)
        setLoadError(result.error ?? null)
        setLastUpdated(new Date())
      } catch (error) {
        if (!isMounted) return
        setDashboardData(null)
        setIsUsingFallback(true)
        setLoadError(
          error instanceof Error
            ? error.message
            : "Dashboard data could not be loaded.",
        )
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, revenueRange, refreshToken])

  useEffect(() => {
    if (!isAuthenticated || !hasPermission("orders.view")) {
      setLiveUpdatesConnected(false)
      return
    }
    const controller = new AbortController()
    void streamAdminOrderEvents(controller.signal, () => {
      setOrdersPage(1)
      setRefreshToken((value) => value + 1)
    }, () => setLiveUpdatesConnected(true))
      .catch(() => {
        if (!controller.signal.aborted) setLiveUpdatesConnected(false)
      })

    return () => {
      controller.abort()
      setLiveUpdatesConnected(false)
    }
  }, [isAuthenticated, hasPermission])

  useEffect(() => {
    if (!isAuthenticated || section !== "orders") return

    let isMounted = true
    setOrdersLoading(true)
    setOrdersError(null)
    const timeout = setTimeout(() => {
      fetchAdminOrders({
        page: ordersPage,
        pageSize: ordersPageSize,
        search: orderSearch.trim(),
        status: orderFilter === "ALL" ? "" : orderFilter,
        paymentStatus: paymentFilter === "ALL" ? "" : paymentFilter,
        channel: channelFilter === "ALL" ? "" : channelFilter,
      })
        .then((result) => {
          if (isMounted) setOrdersData(result)
        })
        .catch((error) => {
          if (isMounted) {
            setOrdersData(null)
            setOrdersError(
              error instanceof Error
                ? error.message
                : "Customer orders could not be loaded.",
            )
          }
        })
        .finally(() => {
          if (isMounted) setOrdersLoading(false)
        })
    }, 200)

    return () => {
      isMounted = false
      clearTimeout(timeout)
    }
  }, [
    isAuthenticated,
    section,
    ordersPage,
    ordersPageSize,
    orderSearch,
    orderFilter,
    paymentFilter,
    channelFilter,
    refreshToken,
  ])

  useEffect(() => {
    if (!isAuthenticated || section !== "companyOrders") return
    let isMounted = true
    setCompanyOrdersLoading(true)
    fetchCompanyOrders(companyOrderSearch.trim(), companyOrderStatusFilter)
      .then((data) => {
        if (isMounted) setCompanyOrders(data)
      })
      .catch((err) => console.error("Error loading company orders", err))
      .finally(() => {
        if (isMounted) setCompanyOrdersLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [isAuthenticated, section, companyOrderSearch, companyOrderStatusFilter, refreshToken])

  useEffect(() => {
    setVisibleCompanyOrderCount(5)
  }, [companyOrderSearch, companyOrderStatusFilter])

  useEffect(() => {
    if (section === "companyOrders") setVisibleCompanyOrderCount(5)
  }, [section])

  useEffect(() => {
    if (!isAuthenticated || section !== "inventory") return
    let isMounted = true
    Promise.all([fetchStockSummary(), fetchStockMovements()])
      .then(([summary, movements]) => {
        if (isMounted) {
          setStockOverview(summary)
          setStockMovements(movements)
        }
      })
      .catch((err) => console.error("Error loading stock summary", err))
    return () => {
      isMounted = false
    }
  }, [isAuthenticated, section, refreshToken])

  useEffect(() => {
    if (!isAuthenticated || section !== "settings" || !isManager) return
    let isMounted = true
    fetchWebsiteSettings()
      .then((st) => {
        if (isMounted) setSettingsData(st)
      })
      .catch((err) => console.error("Error loading website settings", err))
    return () => {
      isMounted = false
    }
  }, [isAuthenticated, isManager, section, refreshToken])

  // Always keep products in sync with the backend store
  useEffect(() => {
    if (!isAuthenticated) return
    fetchProductsFromBackend()
  }, [isAuthenticated, refreshToken])

  const stats = dashboardData?.stats ?? []
  const recentOrders = dashboardData?.recentOrders ?? []
  const products = storeProducts
  const revenueTrend = dashboardData?.revenueTrend ?? []
  const orderPipeline = dashboardData?.orderPipeline ?? []
  const paymentBreakdown = dashboardData?.paymentBreakdown ?? []
  const categorySales = dashboardData?.categorySales ?? []
  const topProducts = dashboardData?.topProducts ?? []
  const inventoryHealth = dashboardData?.inventoryHealth ?? []
  const totalRangeRevenue = revenueTrend.reduce(
    (total, point) => total + point.amount,
    0,
  )
  const maxRevenue = Math.max(0, ...revenueTrend.map((point) => point.amount))
  function formatPrice(n: number) {
    return `RWF ${n.toLocaleString()}`
  }

  function formatChartDate(date: string) {
    const parsedDate = new Date(`${date}T00:00:00`)
    return new Intl.DateTimeFormat("en-RW", {
      month: revenueRange === "12m" ? "short" : undefined,
      day: revenueRange === "12m" ? undefined : "numeric",
    }).format(parsedDate)
  }

  function formatCurrentDate() {
    return new Intl.DateTimeFormat("en-RW", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date())
  }

  const navItems: { id: AdminSection; label: string; icon: string; permission?: string }[] = [
    { id: "overview", label: "Overview", icon: "📊", permission: "reports.view" },
    { id: "orders", label: "Customer Orders", icon: "📦", permission: "orders.view" },
    { id: "companyOrders", label: "Company Orders", icon: "🚢", permission: "procurement.view" },
    { id: "products", label: "Products", icon: "🏷️", permission: "products.view" },
    { id: "inventory", label: "Inventory & Stock", icon: "📋", permission: "inventory.view" },
    { id: "announcements", label: "Announcements", icon: "📣", permission: "announcements.view" },
  ]
  if (isManager) {
    navItems.push(
      { id: "settings", label: "Settings & Content", icon: "⚙️" },
      { id: "staff", label: "User Management", icon: "🧑‍💼" },
      { id: "audit", label: "Audit Log", icon: "🧾" },
    )
  }
  const visibleNavItems = navItems.filter((item) => !item.permission || hasPermission(item.permission))

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase()),
  )

  if (!isAuthenticated) {
    return (
      <AdminLoginView
        onLogin={login}
        onBack={() => navigate("home")}
      />
    )
  }

  return (
    <div
      className="min-h-screen flex text-[#111111]"
      style={{ background: "#FFFFFF" }}
    >
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-shrink-0 flex-col overflow-y-auto transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "#FFF7E8", borderRight: "1px solid #F1FFF0" }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-5"
          style={{ borderColor: "#F1FFF0" }}
        >
          <div className="flex items-center gap-3">
            <SiteLogo className="h-11 w-11" showName={false} />
            <div>
              <div className="text-sm font-bold tracking-wide text-[#111111]">
                DUBAZAAR<span style={{ color: "#FF6A00" }}>MART</span>
              </div>
              <div
                className="mt-0.5 text-[10px] uppercase tracking-[0.2em]"
                style={{ color: "#0B5B24" }}
              >
                Admin workspace
              </div>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-black/60 hover:bg-black/5 lg:hidden"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="px-4 pt-6">
          <div className="badge mb-3 px-2" style={{ color: "#0B5B24" }}>
            WORKSPACE
          </div>
          <nav className="space-y-1" aria-label="Admin navigation">
            {visibleNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSection(item.id)
                  setMobileMenuOpen(false)
                }}
                aria-current={section === item.id ? "page" : undefined}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all"
                style={
                  section === item.id
                    ? {
                        background: "rgba(255,106,0,0.12)",
                        color: "#FFB800",
                        border: "1px solid rgba(255,106,0,0.2)",
                      }
                    : { color: "#111111", border: "1px solid transparent" }
                }
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-base">
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 space-y-2.5">
          <div
            className="rounded-xl border p-3"
            style={{ borderColor: "#F1FFF0", background: "#FFF7E8" }}
          >
            <div className="flex items-center gap-2 text-xs font-medium text-[#111111]">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background:
                    isLoading || isUsingFallback ? "#FFB800" : "#17D719",
                }}
              />
              {isLoading
                ? "Connecting to database"
                : isUsingFallback
                  ? "Local Store (Active)"
                  : "Dashboard connected"}
            </div>
            <div className="mt-1 pl-4 text-[11px]" style={{ color: "#0B5B24" }}>
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString()}`
                : "Waiting for first sync"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("home")}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-white/5"
            style={{ color: "#111111" }}
          >
            <span aria-hidden="true">←</span> Back to Store
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:ml-64 lg:p-8 bg-slate-50/60">
        <header
          className="mb-8 flex items-center justify-between gap-4 border-b pb-5"
          style={{ borderColor: "#F1FFF0" }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border text-lg text-[#111111] lg:hidden"
              style={{ borderColor: "#FFB800", background: "#FFF7E8" }}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
            >
              ☰
            </button>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[#111111]">
                Store operations
              </div>
              <div
                className="mt-1 truncate text-xs"
                style={{ color: "#0B5B24" }}
              >
                {formatCurrentDate()}
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setRefreshToken((value) => value + 1)}
              disabled={isLoading}
              className="rounded-xl border px-3 py-2 text-xs font-medium transition-colors hover:border-[#FF6A00] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
              style={{
                borderColor: "#FFB800",
                background: "#FFF7E8",
                color: "#111111",
              }}
            >
              <span aria-hidden="true" className="mr-1.5">
                ↻
              </span>
              <span className="hidden sm:inline">
                {isLoading ? "Refreshing…" : "Refresh"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate("home")}
              className="btn-gold rounded-xl px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm"
            >
              Storefront
            </button>
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                aria-label={`Account menu for ${admin?.name || "user"}`}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="flex max-w-48 items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 pr-2.5 text-left shadow-sm transition hover:border-amber-300 hover:bg-amber-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 sm:max-w-56 sm:gap-3 sm:pr-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-extrabold text-white shadow-sm">
                  {profileInitials}
                </span>
                <span className="hidden min-w-0 flex-1 sm:block">
                  <span className="block truncate text-xs font-bold text-slate-900">
                    {admin?.name || "Account"}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {isManager ? "Manager" : "User"}
                  </span>
                </span>
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  className={`hidden h-4 w-4 shrink-0 text-slate-500 transition-transform sm:block ${profileMenuOpen ? "rotate-180" : ""}`}
                >
                  <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  aria-label="Account options"
                  className="absolute right-0 top-full z-[60] mt-3 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10"
                >
                  <div className="border-b border-slate-100 bg-gradient-to-br from-amber-50 to-white p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-extrabold text-white shadow-sm">
                        {profileInitials}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-slate-900">
                          {admin?.name || "Account"}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {admin?.email}
                        </span>
                      </span>
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {isManager ? "Manager account" : "User account"}
                    </span>
                  </div>
                  <div className="space-y-1 p-2">
                    {isManager && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setSection("settings")
                          setProfileMenuOpen(false)
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600" aria-hidden="true">
                          ⚙
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-800">Settings &amp; Content</span>
                          <span className="mt-0.5 block text-[11px] text-slate-500">Manage your store configuration</span>
                        </span>
                        <span className="text-slate-400" aria-hidden="true">›</span>
                      </button>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false)
                        logout()
                        navigate("/admin/login")
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600" aria-hidden="true">
                        ↪
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-rose-700">Log out</span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">End this admin session</span>
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {actionSuccess && (
          <div
            className="mb-6 flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm font-semibold transition-all"
            style={{
              background: "rgba(23,215,25,0.12)",
              borderColor: "#17D719",
              color: "#0B5B24",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>{actionSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccess(null)}
              className="text-xs text-black/50 hover:text-black font-bold px-2 py-1"
            >
              ×
            </button>
          </div>
        )}
        {/* Overview */}
        {section === "overview" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="badge mb-2" style={{ color: "#FF6A00" }}>
                  DASHBOARD OVERVIEW
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
                  Good to see you
                </h1>
                <p className="mt-2 text-sm" style={{ color: "#0B5B24" }}>
                  Here’s what’s happening across your store today.
                </p>
              </div>
              <span
                className="hidden rounded-full border px-3 py-1.5 text-xs font-medium sm:inline-flex"
                style={
                  isUsingFallback
                    ? {
                        borderColor: "#E94B00",
                        background: "rgba(255,184,0,0.08)",
                        color: "#FFB800",
                      }
                    : {
                        borderColor: "#064D1A",
                        background: "rgba(23,215,25,0.08)",
                        color: "#6BF06D",
                      }
                }
              >
                <span
                  className="mr-2 mt-1 h-1.5 w-1.5 rounded-full"
                  style={{
                    background: isUsingFallback ? "#FFB800" : "#17D719",
                  }}
                />
                {isLoading
                  ? "Syncing data"
                  : isUsingFallback
                    ? "Data offline"
                    : "Live overview"}
              </span>
            </div>

            {isLoading && !dashboardData && (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <div
                    key={index}
                    className="h-32 animate-pulse rounded-2xl border"
                    style={{ background: "#FFF7E8", borderColor: "#F1FFF0" }}
                  />
                ))}
              </div>
            )}

            {!isLoading && isUsingFallback && (
              <div
                className="mb-6 flex items-start gap-3 rounded-2xl border p-4"
                style={{
                  background: "rgba(255,184,0,0.08)",
                  borderColor: "rgba(255,184,0,0.24)",
                  color: "#FFB800",
                }}
              >
                <span className="mt-0.5 text-lg" aria-hidden="true">
                  !
                </span>
                <div>
                  <div className="text-sm font-semibold">
                    Live database data is unavailable
                  </div>
                  <div
                    className="mt-1 text-xs leading-5"
                    style={{ color: "#FFB800" }}
                  >
                    {loadError ??
                      "Connect the dashboard API to show current store activity. No sample figures are being displayed."}
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="group rounded-2xl border p-4 transition-colors hover:border-[#E94B00]"
                  style={{
                    background: "linear-gradient(145deg, #FFF7E8, #FFFFFF)",
                    borderColor: "#F1FFF0",
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{
                        background: "rgba(255,106,0,0.1)",
                        color: "#FFB800",
                      }}
                    >
                      <DashboardIcon name={s.icon} />
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        color: "#111111",
                      }}
                    >
                      {s.change}
                    </span>
                  </div>
                  <div className="text-xl font-bold tracking-tight text-[#111111]">
                    {s.value}
                  </div>
                  <div
                    className="mt-1.5 text-xs font-medium"
                    style={{ color: "#0B5B24" }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
              {!isLoading && !isUsingFallback && stats.length === 0 && (
                <div
                  className="rounded-2xl border p-6 text-sm sm:col-span-2 xl:col-span-3"
                  style={{
                    background: "#FFF7E8",
                    borderColor: "#F1FFF0",
                    color: "#111111",
                  }}
                >
                  There are no dashboard statistics to show yet.
                </div>
              )}
            </div>

            <div
              className="mb-8 rounded-2xl p-5 sm:p-6 bg-white shadow-md"
              style={{ border: "2px solid #CBD5E1" }}
            >
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-base font-bold text-slate-900">
                    Confirmed Sales Performance
                  </div>
                  <div className="mt-1 text-xs text-slate-600 font-medium">
                    Verified customer payments only (MTN MoMo & Airtel Money) ·{" "}
                    {revenueRange === "7d"
                      ? "Last 7 days"
                      : revenueRange === "30d"
                        ? "Last 30 days"
                        : "Last 12 months"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden text-right sm:block">
                    <div className="text-base font-black text-[#FF6A00]">
                      {formatPrice(totalRangeRevenue)}
                    </div>
                    <div
                      className="text-[10px] uppercase font-bold tracking-wider text-slate-500"
                    >
                      Period Verified Total
                    </div>
                  </div>
                  <select
                    value={revenueRange}
                    onChange={(event) =>
                      setRevenueRange(event.target.value as RevenueRange)
                    }
                    aria-label="Revenue chart date range"
                    className="rounded-xl px-3 py-2 text-xs font-bold border border-slate-300 bg-slate-50 text-slate-800"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="12m">Last 12 months</option>
                  </select>
                </div>
              </div>

              {/* 3 Summary KPI Chips to eliminate chart ambiguity */}
              <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Inflow</span>
                  <div className="text-lg font-black text-[#FF6A00] mt-0.5">{formatPrice(totalRangeRevenue)}</div>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Peak Single Day</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">{formatPrice(maxRevenue)}</div>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Daily Average</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {formatPrice(Math.round(totalRangeRevenue / Math.max(1, revenueTrend.length)))}
                  </div>
                </div>
              </div>

              {isLoading && dashboardData ? (
                <div
                  className="flex h-52 items-center justify-center text-sm text-slate-500"
                >
                  Updating sales data…
                </div>
              ) : revenueTrend.length > 0 ? (
                <div className="relative pt-2">
                  <div className="pointer-events-none absolute inset-x-0 top-2 flex h-40 flex-col justify-between">
                    {[0, 1, 2].map((line) => (
                      <div
                        key={line}
                        className="border-t border-dashed border-slate-200"
                      />
                    ))}
                  </div>
                  <div className="relative flex h-40 items-end gap-1.5 sm:gap-2">
                    {revenueTrend.map((point, index) => {
                      const hasRevenue = point.amount > 0
                      const barHeight =
                        maxRevenue > 0 && hasRevenue
                          ? Math.max(8, (point.amount / maxRevenue) * 100)
                          : 0

                      return (
                        <div
                          key={point.date}
                          className="flex h-full min-w-0 flex-1 items-end justify-center group"
                        >
                          {hasRevenue ? (
                            <div
                              title={`${formatPrice(point.amount)} · ${point.date}`}
                              className="w-full max-w-10 rounded-t-lg transition-all duration-300 group-hover:brightness-110 shadow-xs"
                              style={{
                                height: `${barHeight}%`,
                                minHeight: 6,
                                background:
                                  index === revenueTrend.length - 1
                                    ? "linear-gradient(180deg, #FF6A00 0%, #FF8533 100%)"
                                    : "linear-gradient(180deg, #FF9E00 0%, #FFA81A 100%)",
                              }}
                            />
                          ) : (
                            <div
                              title={`RWF 0 on ${point.date}`}
                              className="w-full max-w-10 h-1 rounded-full bg-slate-200/80 mb-0.5 transition-all group-hover:bg-slate-400"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-3 flex gap-1.5 sm:gap-2 border-t border-slate-200 pt-2">
                    {revenueTrend.map((point, index) => {
                      const showLabel =
                        revenueRange !== "30d" ||
                        index % 5 === 0 ||
                        index === revenueTrend.length - 1
                      return (
                        <div
                          key={point.date}
                          className="min-w-0 flex-1 text-center text-[10px] font-bold text-slate-600 truncate"
                        >
                          {showLabel ? formatChartDate(point.date) : ""}
                        </div>
                      )
                    })}
                  </div>
                  <div
                    className="mt-3 flex justify-between text-[11px] font-bold text-slate-500"
                  >
                    <span>Baseline: RWF 0</span>
                    <span>Peak Day: {formatPrice(maxRevenue)}</span>
                  </div>
                </div>
              ) : (
                <div
                  className="flex h-52 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-center text-slate-500"
                >
                  <span className="mb-2 text-2xl" aria-hidden="true">
                    📊
                  </span>
                  <div className="text-sm font-bold text-slate-800">
                    No confirmed sales in this period
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Once customer payments are received, daily sales bars will appear here.
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <div className="badge mb-1" style={{ color: "#FF6A00" }}>
                  OPERATION MAP
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  How the business is moving
                </h2>
                <p className="mt-1 text-xs text-slate-600 font-medium">
                  Live distribution across fulfillment, collections, and stock.
                </p>
              </div>
            </div>

            <div className="mb-8 grid gap-5 xl:grid-cols-3">
              <section
                className="rounded-2xl p-5 shadow-sm bg-white"
                style={{ border: "2px solid #CBD5E1" }}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6A00] bg-[#FF6A00]/10 px-2 py-0.5 rounded">
                      Fulfillment Stages
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                      Order pipeline
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Live sync</span>
                </div>
                <DonutBreakdown data={orderPipeline} centerLabel="orders" />
              </section>

              <section
                className="rounded-2xl p-5 shadow-sm bg-white"
                style={{ border: "2px solid #CBD5E1" }}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded">
                      Collection Status
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                      Payment health
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Verified MoMo</span>
                </div>
                <DonutBreakdown
                  data={paymentBreakdown}
                  centerLabel="payments"
                />
              </section>

              <section
                className="rounded-2xl p-5 shadow-sm bg-white"
                style={{ border: "2px solid #CBD5E1" }}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-bold">
                      Stock Alert
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                      Inventory health
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Catalog risk</span>
                </div>
                <DonutBreakdown data={inventoryHealth} centerLabel="products" />
              </section>
            </div>

            <div className="mb-8 grid gap-5 lg:grid-cols-2">
              <section
                className="rounded-2xl p-5 sm:p-6 shadow-sm bg-white"
                style={{ border: "2px solid #CBD5E1" }}
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6A00] bg-[#FF6A00]/10 px-2 py-0.5 rounded">
                      Market Segments
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                      Category performance
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Confirmed revenue generated by product category
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 border border-slate-300 px-2.5 py-1 text-[10px] uppercase font-bold text-[#FF6A00]">
                    Revenue
                  </span>
                </div>
                <HorizontalBreakdown
                  data={categorySales}
                  valueLabel={(item) => formatPrice(item.amount ?? 0)}
                />
              </section>

              <section
                className="rounded-2xl p-5 sm:p-6 shadow-sm bg-white"
                style={{ border: "2px solid #CBD5E1" }}
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      Velocity
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                      Top-selling products
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Units sold from successfully paid orders
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 border border-slate-300 px-2.5 py-1 text-[10px] uppercase font-bold text-slate-700">
                    Units
                  </span>
                </div>
                <HorizontalBreakdown
                  data={topProducts}
                  valueLabel={(item) => `${item.value.toLocaleString()} sold`}
                  color="#FF6A00"
                />
              </section>
            </div>

            <div
              className="rounded-2xl p-5 sm:p-6 shadow-sm"
              style={{ background: "#FFFFFF", border: "2px solid #FFB800", boxShadow: "0 6px 20px rgba(0,0,0,0.04)" }}
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6A00] bg-[#FF6A00]/10 px-2 py-0.5 rounded">
                    Order Activity
                  </span>
                  <h3 className="font-bold text-[#111111] mt-1 text-base">Recent orders</h3>
                  <p className="mt-0.5 text-xs" style={{ color: "#0B5B24" }}>
                    Latest activity from your customer orders
                  </p>
                </div>
                <button
                  onClick={() => setSection("orders")}
                  className="rounded-xl border px-3.5 py-2 text-xs font-bold transition-all hover:bg-[#FF6A00]/10"
                  style={{ borderColor: "#FFB800", color: "#FF6A00" }}
                >
                  View all orders <span aria-hidden="true">→</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead>
                    <tr style={{ borderBottom: "2px solid #FFB800" }}>
                      {["Order ID", "Customer", "Amount", "Status", "Date"].map(
                        (heading) => (
                          <th
                            key={heading}
                            className="pb-3 pr-4 text-left text-[11px] font-bold uppercase tracking-wide"
                            style={{ color: "#0B5B24" }}
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.slice(0, 5).map((order) => (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-[#FFF7E8]/40"
                        style={{ borderBottom: "1.5px solid rgba(255,184,0,0.25)" }}
                      >
                        <td
                          className="py-3.5 pr-4 font-mono text-xs font-bold"
                          style={{ color: "#FF6A00" }}
                        >
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="py-3.5 pr-4 text-[#111111] font-medium">
                          {order.customer}
                        </td>
                        <td className="py-3.5 pr-4 font-bold text-[#111111]">
                          {formatPrice(order.amount)}
                        </td>
                        <td className="py-3.5 pr-4">
                          <span
                            className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                            style={{
                              background: `${STATUS_COLORS[order.status] ?? "#0B5B24"}20`,
                              color: STATUS_COLORS[order.status] ?? "#0B5B24",
                            }}
                          >
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td
                          className="py-3.5 text-xs font-medium"
                          style={{ color: "#0B5B24" }}
                        >
                          {order.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {recentOrders.length === 0 && (
                  <div className="py-12 text-center">
                    <div className="mb-2 text-2xl" aria-hidden="true">
                      ▤
                    </div>
                    <div className="text-sm font-medium text-[#111111]">
                      No orders yet
                    </div>
                    <div className="mt-1 text-xs" style={{ color: "#0B5B24" }}>
                      New customer orders will appear here.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Orders */}
        {section === "orders" && (
          <div>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="badge mb-2" style={{ color: "#FF6A00" }}>
                  CUSTOMER MANAGEMENT
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
                  Customer orders
                </h1>
                <p className="mt-2 text-sm" style={{ color: "#0B5B24" }}>
                  Real-time order tracking, payment verification, and dispatch.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOrderOpen(true)}
                  className="btn-gold flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold sm:text-sm shadow-md"
                >
                  <span className="text-base leading-none font-bold">+</span> Create Order
                </button>
                <div
                  className="flex items-center gap-2 rounded-full border px-3 py-2 text-xs"
                  style={{
                    borderColor: liveUpdatesConnected ? "#064D1A" : "#E94B00",
                    background: liveUpdatesConnected
                      ? "rgba(23,215,25,0.07)"
                      : "rgba(255,255,255,0.03)",
                    color: liveUpdatesConnected ? "#6BF06D" : "#111111",
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: liveUpdatesConnected ? "#17D719" : "#0B5B24",
                    }}
                  />
                  {liveUpdatesConnected
                    ? "Live order updates on"
                    : "Reconnecting to live updates"}
                </div>
              </div>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(200px,1fr)_160px_160px_160px_110px]">
              <input
                value={orderSearch}
                onChange={(event) => {
                  setOrderSearch(event.target.value)
                  setOrdersPage(1)
                }}
                aria-label="Search customer orders"
                placeholder="Search ID, customer, phone, email, product…"
                className="min-w-0 rounded-xl px-4 py-3 text-sm"
              />
              <select
                value={orderFilter}
                onChange={(event) => {
                  setOrderFilter(event.target.value)
                  setOrdersPage(1)
                }}
                aria-label="Filter by order status"
                className="rounded-xl px-3 py-3 text-sm"
              >
                <option value="ALL">All order statuses</option>
                {Object.keys(STATUS_COLORS).map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <select
                value={paymentFilter}
                onChange={(event) => {
                  setPaymentFilter(event.target.value)
                  setOrdersPage(1)
                }}
                aria-label="Filter by payment status"
                className="rounded-xl px-3 py-3 text-sm"
              >
                <option value="ALL">All payment statuses</option>
                {[
                  "PENDING",
                  "PROCESSING",
                  "PAID",
                  "FAILED",
                  "CANCELLED",
                  "REFUNDED",
                ].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select
                value={channelFilter}
                onChange={(event) => {
                  setChannelFilter(event.target.value)
                  setOrdersPage(1)
                }}
                aria-label="Filter by channel"
                className="rounded-xl px-3 py-3 text-sm"
              >
                <option value="ALL">All Channels</option>
                <option value="web">Online Web Orders</option>
                <option value="whatsapp">WhatsApp Enquiries</option>
              </select>
              <select
                value={ordersPageSize}
                onChange={(event) => {
                  setOrdersPageSize(Number(event.target.value))
                  setOrdersPage(1)
                }}
                aria-label="Orders per page"
                className="rounded-xl px-3 py-3 text-sm"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            </div>

            {ordersError && (
              <div
                role="alert"
                className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm"
                style={{
                  borderColor: "rgba(255,106,0,0.35)",
                  background: "rgba(255,106,0,0.08)",
                  color: "#FFB800",
                }}
              >
                <span>Customer orders could not be loaded: {ordersError}</span>
                <button
                  type="button"
                  className="rounded-lg border px-3 py-1.5"
                  style={{ borderColor: "rgba(255,106,0,0.4)" }}
                  onClick={() => setRefreshToken((value) => value + 1)}
                >
                  Try again
                </button>
              </div>
            )}

            <div className="space-y-6">
              {ordersLoading &&
                !ordersData &&
                Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className="h-52 animate-pulse rounded-2xl border"
                    style={{ background: "#FFF7E8", borderColor: "#FFB800" }}
                  />
                ))}
              {ordersData?.orders.map((order, orderIndex) => {
                const paymentColor =
                  order.paymentStatus === "PAID"
                    ? "#10B981"
                    : order.paymentStatus === "FAILED"
                      ? "#DC2626"
                      : "#F59E0B"
                const statusColor = STATUS_COLORS[order.status] ?? "#2563EB"
                const totalOrdersCount = ordersData.orders.length

                return (
                  <div key={order.id} className="space-y-4">
                    <article
                      className="overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:shadow-2xl"
                      style={{
                        border: "2px solid #94A3B8",
                        borderLeft: `10px solid ${statusColor}`,
                        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                      }}
                    >
                      {/* Top Header Identity Strip */}
                      <div className="bg-slate-900 text-white px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold tracking-wider">
                        <div className="flex items-center gap-2.5">
                          <span className="bg-[#FFB800] text-slate-950 font-black px-2.5 py-0.5 rounded text-[11px] tracking-wide">
                            CUSTOMER ORDER #{orderIndex + 1} OF {totalOrdersCount}
                          </span>
                          <span className="font-mono text-slate-300">#{order.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-normal">Order Total:</span>
                          <span className="text-[#FFB800] font-black text-sm">{formatPrice(order.total)}</span>
                        </div>
                      </div>

                      {/* Top Header Banner */}
                      <div
                        className="flex flex-wrap items-start justify-between gap-4 border-b-2 p-5 sm:p-6"
                        style={{
                          background: "linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)",
                          borderColor: "#E2E8F0",
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          {/* Order tags row */}
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span
                              className="font-mono text-xs font-black px-3 py-1 rounded-lg bg-[#111111] text-[#FFB800] tracking-wider shadow-xs"
                            >
                              #{order.id}
                            </span>
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 border border-slate-300 text-slate-700">
                              Order #{orderIndex + 1} of {totalOrdersCount}
                            </span>
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="rounded-full px-3 py-1 text-xs font-bold border cursor-pointer focus:outline-none shadow-xs"
                              style={{
                                background: `${statusColor}15`,
                                color: statusColor,
                                borderColor: `${statusColor}60`,
                              }}
                              title="Click to change order status"
                            >
                              {Object.keys(STATUS_COLORS).map((statusKey) => (
                                <option key={statusKey} value={statusKey} style={{ background: "#FFFFFF", color: "#111111" }}>
                                  {statusKey.replace(/_/g, " ")}
                                </option>
                              ))}
                            </select>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#064D1A] bg-[#10B981]/15 px-2.5 py-1 rounded-md border border-[#10B981]/30">
                              CUSTOMER ORDER
                            </span>
                            {order.channel === "whatsapp" ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#064D1A] bg-[#25D366]/20 px-2.5 py-1 rounded-md border border-[#25D366]/40 flex items-center gap-1 shadow-xs">
                                <span>💬</span> WhatsApp Enquiry
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0874F9] bg-[#0874F9]/10 px-2.5 py-1 rounded-md border border-[#0874F9]/30 shadow-xs">
                                🌐 Web Checkout
                              </span>
                            )}
                          </div>

                          {/* Customer Details */}
                          <div className="font-bold text-lg text-slate-900 flex items-center gap-2">
                            <span>👤 {order.customerName}</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                            {order.phone && <span>📞 {order.phone}</span>}
                            {order.email && <span>✉️ {order.email}</span>}
                            <span>
                              🕒 Placed:{" "}
                              {new Intl.DateTimeFormat("en-RW", {
                                dateStyle: "medium",
                                timeStyle: "short",
                                timeZone: "Africa/Kigali",
                              }).format(new Date(order.createdAt))}
                            </span>
                          </div>

                          {/* Delivery Address & Instructions */}
                          {(order.deliveryAddress || order.customerInstructions) && (
                            <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                              <span className="font-bold text-slate-800">📍 Destination: </span>
                              {order.deliveryAddress ? (
                                <span>
                                  {[
                                    order.deliveryAddress.province,
                                    order.deliveryAddress.district,
                                    order.deliveryAddress.sector,
                                    order.deliveryAddress.cell,
                                    order.deliveryAddress.street,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              ) : (
                                <span>Standard Kigali Delivery</span>
                              )}
                              {(order.customerInstructions || order.deliveryAddress?.instructions) && (
                                <div className="mt-1 text-slate-700">
                                  <strong>Notes:</strong> "{order.customerInstructions || order.deliveryAddress?.instructions}"
                                </div>
                              )}
                            </div>
                          )}

                          {/* Live Delivery Arrival Countdown */}
                          <div className="mt-3 flex flex-wrap items-center gap-2.5 p-2.5 rounded-xl border border-amber-300/80 bg-amber-50/80">
                            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>⏰</span> Requested Arrival:
                            </span>
                            <span className="text-slate-700 font-semibold text-xs">
                              {order.requestedDeliveryTime
                                ? new Intl.DateTimeFormat("en-RW", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                    timeZone: "Africa/Kigali",
                                  }).format(new Date(order.requestedDeliveryTime))
                                : "Standard Dispatch (48h target)"}
                            </span>
                            <LiveCountdown
                              targetDate={
                                order.requestedDeliveryTime ||
                                new Date(new Date(order.createdAt).getTime() + 48 * 3600 * 1000).toISOString()
                              }
                              isCompleted={order.status === "DELIVERED"}
                              completedText="Delivered to Customer"
                              variant="customer"
                            />
                          </div>

                          {order.status === "CANCELLED" && order.cancelReason && (
                            <div className="mt-2 text-xs text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
                              <strong>Cancellation Reason:</strong> {order.cancelReason}
                            </div>
                          )}
                        </div>

                        {/* Order Total block */}
                        <div className="text-left sm:text-right min-w-[180px]">
                          <div className="text-xs uppercase font-bold tracking-wider text-slate-500">
                            Order Total
                          </div>
                          <div
                            className="mt-1 text-2xl font-black text-[#FF6A00]"
                          >
                            {formatPrice(order.total)}
                          </div>
                          <div className="mt-2.5 flex flex-wrap items-center gap-2 sm:justify-end">
                            <span
                              className="text-[10px] uppercase font-bold text-slate-500"
                            >
                              Payment:
                            </span>
                            <span
                              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
                              style={{
                                background: `${paymentColor}20`,
                                color: paymentColor,
                                border: `1px solid ${paymentColor}`,
                              }}
                            >
                              {order.paymentStatus}
                            </span>
                            <span
                              className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-slate-100 border border-slate-300 text-slate-800"
                            >
                              📱 {order.paymentMethod.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Framed Products Table */}
                      <div className="m-4 sm:m-6 overflow-x-auto rounded-xl border-2 border-slate-200 bg-white shadow-xs">
                        <table className="w-full min-w-[610px] text-sm">
                          <thead>
                            <tr
                              className="text-left text-[11px] font-bold uppercase tracking-wider bg-slate-100 border-b-2 border-slate-200 text-slate-800"
                            >
                              <th className="py-3 px-4 font-bold">Ordered Product</th>
                              <th className="py-3 px-4 font-bold">Category</th>
                              <th className="py-3 px-4 text-right font-bold">
                                Quantity
                              </th>
                              <th className="py-3 px-4 text-right font-bold">
                                Unit Price
                              </th>
                              <th className="py-3 px-4 text-right font-bold">
                                Line Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {order.items.map((item, index) => (
                              <tr
                                key={`${order.id}-${index}`}
                                className="transition-colors hover:bg-slate-50"
                              >
                                <td className="py-3 px-4 font-bold text-slate-900">
                                  {item.productName}
                                </td>
                                <td className="py-3 px-4 text-xs font-semibold">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-slate-700">
                                    {item.category}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-slate-900">
                                  {item.quantity}
                                </td>
                                <td className="py-3 px-4 text-right font-medium text-slate-700">
                                  {item.unitPrice === null
                                    ? "—"
                                    : formatPrice(item.unitPrice)}
                                </td>
                                <td className="py-3 px-4 text-right font-black text-[#FF6A00]">
                                  {item.lineTotal === null
                                    ? "—"
                                    : formatPrice(item.lineTotal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Order Footer with Summary & Actions */}
                      <div
                        className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-slate-200 bg-slate-50 px-5 py-4 sm:px-6 font-medium text-xs text-slate-700"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span>
                            Subtotal: <strong className="text-slate-900">{order.subtotal === null ? "—" : formatPrice(order.subtotal)}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Delivery: <strong className="text-slate-900">{order.deliveryFee === null ? "—" : formatPrice(order.deliveryFee)}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Total: <strong className="text-[#FF6A00] font-bold text-sm">{formatPrice(order.total)}</strong>
                          </span>
                          <span>•</span>
                          <span
                            className="font-bold uppercase tracking-wider"
                            style={{ color: paymentColor }}
                          >
                            Payment {order.paymentStatus.toLowerCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForDetails(order)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors shadow-xs"
                          >
                            👁️ View More
                          </button>
                          {order.paymentStatus !== "PAID" && order.status !== "CANCELLED" && (
                            <button
                              type="button"
                              onClick={() => handleRecordPayment(order.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#10B981]/15 border border-[#10B981] text-[#065F46] hover:bg-[#10B981]/25 transition-colors shadow-xs"
                              title="Record payment verified via MoMo or Airtel"
                            >
                              ✓ Record Paid
                            </button>
                          )}
                          {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                            <button
                              type="button"
                              onClick={() => setOrderIdToCancel(order.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors shadow-xs"
                            >
                              ✕ Cancel Order
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-800 hover:bg-red-200 border border-red-300 transition-colors shadow-xs flex items-center gap-1"
                            title="Permanently delete this order from database"
                          >
                            <span>🗑️</span> Delete
                          </button>
                        </div>
                      </div>

                      {/* Bottom Order Boundary Strip */}
                      <div className="px-5 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>DubazaarMart Order Receipt</span>
                        <span className="text-slate-500 font-extrabold tracking-widest">▲ END OF ORDER #{order.id} ▲</span>
                        <span>{order.items.length} Product(s) Total</span>
                      </div>
                    </article>

                    {/* Distinct Separator between consecutive orders */}
                    {orderIndex < totalOrdersCount - 1 && (
                      <div className="my-10 flex items-center justify-center gap-4">
                        <div className="h-0.5 bg-slate-300 flex-1"></div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-700 bg-white px-5 py-2 rounded-full border-2 border-slate-300 shadow-sm flex items-center gap-2">
                          <span>⬇️</span> NEXT ORDER BELOW ({orderIndex + 2} of {totalOrdersCount})
                        </span>
                        <div className="h-0.5 bg-slate-300 flex-1"></div>
                      </div>
                    )}
                  </div>
                )
              })}

              {!ordersLoading &&
                !ordersError &&
                ordersData?.orders.length === 0 && (
                  <div
                    className="rounded-2xl border border-dashed p-12 text-center"
                    style={{ borderColor: "#FFB800", color: "#0B5B24" }}
                  >
                    <div className="mb-3 text-3xl" aria-hidden="true">
                      ▤
                    </div>
                    <div className="font-semibold text-[#111111]">
                      No customer orders found
                    </div>
                    <div className="mt-1 text-sm">
                      Submitted checkout orders will appear here automatically.
                    </div>
                  </div>
                )}
            </div>

            {ordersData && (
              <div
                className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                style={{ borderColor: "#F1FFF0", background: "#FFF7E8" }}
              >
                <div className="text-xs" style={{ color: "#0B5B24" }}>
                  {ordersData.totalOrders === 0
                    ? "No orders"
                    : `Showing ${(ordersPage - 1) * ordersData.pageSize + 1}–${Math.min(ordersPage * ordersData.pageSize, ordersData.totalOrders)} of ${ordersData.totalOrders} orders`}
                </div>
                <div className="flex items-center gap-2">
                  <span className="mr-2 text-xs" style={{ color: "#0B5B24" }}>
                    Page {ordersData.page} of{" "}
                    {Math.max(1, ordersData.totalPages)}
                  </span>
                  <button
                    type="button"
                    disabled={!ordersData.hasPreviousPage || ordersLoading}
                    onClick={() =>
                      setOrdersPage((page) => Math.max(1, page - 1))
                    }
                    className="rounded-lg border px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ borderColor: "#FFB800", color: "#111111" }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={!ordersData.hasNextPage || ordersLoading}
                    onClick={() => setOrdersPage((page) => page + 1)}
                    className="rounded-lg border px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ borderColor: "#FFB800", color: "#111111" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Company Purchase Orders */}
        {section === "companyOrders" && (
          <div>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="badge mb-2" style={{ color: "#FF6A00" }}>
                  SUPPLY CHAIN & PURCHASING
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
                  Company Purchase Orders
                </h1>
                <p className="mt-2 text-sm" style={{ color: "#0B5B24" }}>
                  Manage supplier procurement, shipping carriers, arrival countdowns, and stock intake in USD ($).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateCompanyOrderOpen(true)}
                  className="btn-gold flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold sm:text-sm shadow-md"
                >
                  <span className="text-base leading-none font-bold">+</span> Create Purchase Order
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border" style={{ background: "#FFF7E8", borderColor: "#FFB800" }}>
                <div className="text-xs font-bold uppercase tracking-wide text-[#0B5B24]">Total POs</div>
                <div className="text-2xl font-black text-[#111111] mt-1">{companyOrders.length}</div>
              </div>
              <div className="p-4 rounded-2xl border" style={{ background: "#FFF7E8", borderColor: "#FFB800" }}>
                <div className="text-xs font-bold uppercase tracking-wide text-[#0B5B24]">Total USD Value</div>
                <div className="text-2xl font-black text-[#FF6A00] mt-1">
                  ${companyOrders.reduce((acc, po) => acc + (po.totalAmount || 0), 0).toLocaleString()}
                </div>
              </div>
              <div className="p-4 rounded-2xl border" style={{ background: "#FFF7E8", borderColor: "#FFB800" }}>
                <div className="text-xs font-bold uppercase tracking-wide text-[#0B5B24]">In Transit / Pending</div>
                <div className="text-2xl font-black text-[#0874F9] mt-1">
                  {companyOrders.filter(po => po.status === "ORDERED" || po.status === "SHIPPED").length}
                </div>
              </div>
              <div className="p-4 rounded-2xl border" style={{ background: "#FFF7E8", borderColor: "#FFB800" }}>
                <div className="text-xs font-bold uppercase tracking-wide text-[#0B5B24]">Received / Added to Stock</div>
                <div className="text-2xl font-black text-[#17D719] mt-1">
                  {companyOrders.filter(po => po.status === "RECEIVED" || po.status === "PARTIALLY_RECEIVED").length}
                </div>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_200px]">
              <input
                value={companyOrderSearch}
                onChange={(e) => setCompanyOrderSearch(e.target.value)}
                placeholder="Search PO#, supplier, shipping carrier, product…"
                className="rounded-xl px-4 py-3 text-sm"
              />
              <select
                value={companyOrderStatusFilter}
                onChange={(e) => setCompanyOrderStatusFilter(e.target.value)}
                className="rounded-xl px-3 py-3 text-sm"
              >
                <option value="ALL">All PO Statuses</option>
                <option value="ORDERED">ORDERED</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="PARTIALLY_RECEIVED">PARTIALLY RECEIVED</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="space-y-3">
              {companyOrdersLoading && (
                <div className="h-32 animate-pulse rounded-2xl border" style={{ background: "#FFF7E8", borderColor: "#FFB800" }} />
              )}
              {!companyOrdersLoading && companyOrders.length === 0 && (
                <div className="rounded-2xl border border-dashed p-12 text-center" style={{ borderColor: "#FFB800", color: "#0B5B24" }}>
                  <div className="text-3xl mb-2">🚢</div>
                  <div className="font-bold text-[#111111]">No company purchase orders found</div>
                  <div className="text-xs mt-1">Click "+ Create Purchase Order" to log a supplier order in USD.</div>
                </div>
              )}
              {!companyOrdersLoading && companyOrders.slice(0, visibleCompanyOrderCount).map((po) => {
                const isExpanded = expandedCompanyOrderIds.includes(po.id)
                const statusColor =
                  po.status === "RECEIVED" ? "#10B981" :
                  po.status === "SHIPPED" ? "#2563EB" :
                  po.status === "PARTIALLY_RECEIVED" ? "#F59E0B" :
                  po.status === "CANCELLED" ? "#DC2626" : "#EA580C"
                const placedDate = new Date(po.createdAt || po.orderDate)
                const formattedPlacedDate = Number.isNaN(placedDate.getTime())
                  ? "—"
                  : placedDate.toLocaleDateString("en-RW", { dateStyle: "medium" })

                return (
                  <article
                    key={po.id}
                    className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                    style={{ borderColor: "#E2E8F0", borderLeft: `5px solid ${statusColor}` }}
                  >
                    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:items-center lg:grid-cols-[1.1fr_1.5fr_1fr_1fr_1fr_auto]">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">PO number</div>
                        <div className="font-mono text-sm font-bold text-slate-900">#{po.poNumber}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Supplier</div>
                        <div className="truncate text-sm font-semibold text-slate-900">{po.supplierName}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Date</div>
                        <div className="text-sm text-slate-700">{formattedPlacedDate}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Total</div>
                        <div className="text-sm font-bold text-[#FF6A00]">${po.totalAmount.toLocaleString()} USD</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Status</div>
                        <span
                          className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold"
                          style={{ background: `${statusColor}15`, color: statusColor }}
                        >
                          {po.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-1 lg:justify-end">
                        <button
                          type="button"
                          onClick={() => setExpandedCompanyOrderIds((current) => (
                            isExpanded ? current.filter((id) => id !== po.id) : [...current, po.id]
                          ))}
                          aria-expanded={isExpanded}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          {isExpanded ? "Hide details" : "View details"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPoForEdit(po)}
                          className="rounded-lg border border-[#FFB800] bg-[#FFF7E8] px-3 py-2 text-xs font-bold text-slate-800 hover:bg-[#FFB800]/20"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCompanyOrder(po.id, po.poNumber)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="space-y-4 border-t bg-slate-50 p-4">
                        <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                          <div><span className="font-bold text-slate-500">Supplier contact</span><div className="mt-1 text-slate-900">{po.supplierContact || "—"}</div></div>
                          <div><span className="font-bold text-slate-500">Shipping company</span><div className="mt-1 text-slate-900">{po.shippingCompany || "—"}</div></div>
                          <div><span className="font-bold text-slate-500">Expected arrival</span><div className="mt-1 text-slate-900">{po.expectedArrival ? new Date(po.expectedArrival).toLocaleString("en-RW", { dateStyle: "medium", timeStyle: "short" }) : "—"}</div></div>
                          <div><span className="font-bold text-slate-500">Payment status</span><div className="mt-1 text-slate-900">{po.paymentStatus}</div></div>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                          <table className="w-full min-w-[620px] text-xs">
                            <thead className="bg-[#FFF7E8] text-left text-[10px] uppercase tracking-wide text-slate-600">
                              <tr>
                                <th className="px-3 py-2">Item</th>
                                <th className="px-3 py-2">Category</th>
                                <th className="px-3 py-2 text-right">Quantity</th>
                                <th className="px-3 py-2 text-right">Received</th>
                                <th className="px-3 py-2 text-right">Unit price</th>
                                <th className="px-3 py-2 text-right">Line total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {po.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="px-3 py-2 font-semibold text-slate-900">{item.productName}</td>
                                  <td className="px-3 py-2 text-slate-600">{item.category}</td>
                                  <td className="px-3 py-2 text-right font-semibold">{item.quantityOrdered}</td>
                                  <td className="px-3 py-2 text-right">{item.quantityReceived}</td>
                                  <td className="px-3 py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right font-bold">${item.totalPrice.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="text-slate-700">
                            Shipping: ${po.shippingCost.toFixed(2)} · Other charges: ${po.otherCharges.toFixed(2)}
                            <div className="mt-1 whitespace-pre-wrap"><strong>Notes:</strong> {po.notes || "—"}</div>
                          </div>
                          {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
                            <button
                              type="button"
                              onClick={() => setPoForReceive(po)}
                              className="rounded-lg border border-[#10B981] bg-[#10B981]/15 px-3 py-2 text-xs font-bold text-[#065F46] hover:bg-[#10B981]/25"
                            >
                              Add to Stock
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
            {!companyOrdersLoading && companyOrders.length > 5 && (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCompanyOrderCount((current) => (
                    current >= companyOrders.length ? 5 : Math.min(current + 5, companyOrders.length)
                  ))}
                  className="rounded-xl border border-[#FFB800] bg-white px-5 py-2.5 text-xs font-bold text-[#0B5B24] shadow-sm hover:bg-[#FFF7E8]"
                >
                  {visibleCompanyOrderCount >= companyOrders.length ? "Show less" : "View more"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Products */}
        {section === "products" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="badge mb-1" style={{ color: "#FF6A00" }}>
                  MANAGEMENT
                </div>
                <h1 className="text-3xl font-bold text-[#111111]">Products</h1>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(true)}
                className="btn-gold px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md"
              >
                + Add Product
              </button>
            </div>

            <div className="flex gap-3 mb-6">
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-3">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: "#FFF7E8", border: "1px solid #FFB800" }}
                >
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 product-img-wrap">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="56px"
                      unoptimized={p.image.includes("images.unsplash.com")}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#111111] text-sm truncate">
                      {p.name}
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: "#0B5B24" }}
                    >
                      {p.brand} · {p.sku}
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div
                      className="font-bold text-sm"
                      style={{ color: "#FF6A00" }}
                    >
                      {formatPrice(p.price)}
                    </div>
                    <div className="text-xs" style={{ color: "#0B5B24" }}>
                      Stock: {p.quantity}
                    </div>
                  </div>
                  <div>
                    <span
                      className="badge px-2 py-1 rounded-md text-xs"
                      style={{
                        background: p.active
                          ? "rgba(23,215,25,0.1)"
                          : "rgba(255,106,0,0.1)",
                        color: p.active ? "#17D719" : "#FF6A00",
                      }}
                    >
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setProductToEdit(p as any)}
                      className="px-3 py-1.5 rounded-lg text-xs btn-ghost border border-[#FFB800] hover:bg-[#FFB800]/20"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setConfirmDeleteProduct({ id: p.id, name: p.name })
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs transition-colors hover:brightness-125"
                      style={{
                        background: "rgba(255,106,0,0.1)",
                        color: "#FF6A00",
                        border: "1px solid rgba(255,106,0,0.2)",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div
                  className="rounded-2xl border border-dashed p-10 text-center text-sm"
                  style={{ borderColor: "#FFB800", color: "#0B5B24" }}
                >
                  {products.length === 0
                    ? "No products are available from the dashboard API."
                    : "No products match your search."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inventory */}
        {section === "inventory" && (
          <div>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="badge mb-2" style={{ color: "#FF6A00" }}>
                  VALUATION & STOCK CONTROL
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl">
                  Inventory & Stock Management
                </h1>
                <p className="mt-2 text-sm" style={{ color: "#0B5B24" }}>
                  Warehouse stock valuations, safety alert thresholds, expected full stock benchmarks, and movement logs.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPreselectedStockItem(null)
                    setIsRemoveStockOpen(true)
                  }}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold border border-[#FF6A00] text-[#FF6A00] hover:bg-[#FF6A00]/10 transition-colors shadow-sm"
                >
                  − Manual Stock Removal
                </button>
              </div>
            </div>

            {/* Valuation & Alerts Summary Cards */}
            <div className="mb-6 grid grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div className="p-4 rounded-2xl border" style={{ background: "#FFF7E8", borderColor: "#FFB800" }}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#0B5B24]">Warehouse Valuation</div>
                <div className="text-xl font-black text-[#FF6A00] mt-1">
                  {formatPrice(stockOverview?.totalInventoryValue ?? 0)}
                </div>
              </div>
              <div className="p-4 rounded-2xl border" style={{ background: "#FFF7E8", borderColor: "#FFB800" }}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#0B5B24]">Total Units In Stock</div>
                <div className="text-xl font-black text-[#111111] mt-1">
                  {(stockOverview?.totalStockUnits ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="p-4 rounded-2xl border" style={{ background: "rgba(255,106,0,0.06)", borderColor: "#FF6A00" }}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#FF6A00] flex items-center gap-1">
                  <span>🔴</span> Low Stock (≤ Min)
                </div>
                <div className="text-xl font-black text-[#FF6A00] mt-1">
                  {stockOverview?.lowStockCount ?? 0}
                </div>
              </div>
              <div className="p-4 rounded-2xl border" style={{ background: "rgba(255,184,0,0.08)", borderColor: "#FFB800" }}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#B45309] flex items-center gap-1">
                  <span>🟡</span> Average Stock
                </div>
                <div className="text-xl font-black text-[#B45309] mt-1">
                  {stockOverview?.averageStockCount ?? 0}
                </div>
              </div>
              <div className="p-4 rounded-2xl border" style={{ background: "rgba(23,215,25,0.08)", borderColor: "#17D719" }}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#064D1A] flex items-center gap-1">
                  <span>🟢</span> Full Stock (≥ Target)
                </div>
                <div className="text-xl font-black text-[#064D1A] mt-1">
                  {stockOverview?.fullStockCount ?? 0}
                </div>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-2 mb-5 border-b pb-3" style={{ borderColor: "#FFB800" }}>
              <button
                type="button"
                onClick={() => setStockTab("items")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  stockTab === "items"
                    ? "bg-[#FF6A00] text-black shadow-sm"
                    : "bg-[#FFF7E8] text-[#111111] border border-[#FFB800]/50 hover:bg-[#FFB800]/20"
                }`}
              >
                📦 Product Stock Levels ({stockOverview?.items.length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setStockTab("movements")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  stockTab === "movements"
                    ? "bg-[#FF6A00] text-black shadow-sm"
                    : "bg-[#FFF7E8] text-[#111111] border border-[#FFB800]/50 hover:bg-[#FFB800]/20"
                }`}
              >
                📜 Stock Movement History ({stockMovements.length})
              </button>
            </div>

            {stockTab === "items" ? (
              <div>
                <div className="mb-4">
                  <input
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    placeholder="Search stock by product name, SKU, category…"
                    className="w-full max-w-md rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "#FFB800", background: "#FFFFFF" }}>
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-[11px] font-bold uppercase tracking-wider" style={{ background: "#FFF7E8", borderColor: "#FFB800", color: "#0B5B24" }}>
                        <th className="py-3 px-4">Product / SKU</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Stock vs Target</th>
                        <th className="py-3 px-4 text-right">Unit Cost (RWF)</th>
                        <th className="py-3 px-4 text-right">Stock Valuation</th>
                        <th className="py-3 px-4 text-right">Selling Price</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockOverview?.items
                        .filter((item) =>
                          item.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
                          item.sku.toLowerCase().includes(stockSearch.toLowerCase()) ||
                          item.category.toLowerCase().includes(stockSearch.toLowerCase())
                        )
                        .map((item) => {
                          const pctOfTarget = item.targetStock > 0 ? Math.round((item.quantity / item.targetStock) * 100) : 0
                          const statusBadgeColor =
                            item.statusColor === "RED" ? { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", label: "Low Stock" } :
                            item.statusColor === "YELLOW" ? { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300", label: "Average Stock" } :
                            { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", label: "Full Stock" }

                          return (
                            <tr key={item.id} className="border-t transition-colors hover:bg-[#FFF7E8]/40" style={{ borderColor: "rgba(255,184,0,0.25)" }}>
                              <td className="py-3 px-4">
                                <div className="font-bold text-[#111111]">{item.name}</div>
                                <div className="text-xs text-[#0B5B24] font-mono mt-0.5">{item.sku} · {item.category}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusBadgeColor.bg} ${statusBadgeColor.text} ${statusBadgeColor.border}`}>
                                  {statusBadgeColor.label}
                                </span>
                              </td>
                              <td className="py-3 px-4 min-w-[170px]">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="font-bold text-[#111111]">{item.quantity} units</span>
                                  <span className="text-[11px] text-[#0B5B24]">Target: {item.targetStock} ({pctOfTarget}%)</span>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden bg-gray-200">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(100, pctOfTarget)}%`,
                                      background: item.statusColor === "RED" ? "#FF6A00" : item.statusColor === "YELLOW" ? "#FFB800" : "#17D719",
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-medium text-[#111111]">{formatPrice(item.unitCost)}</td>
                              <td className="py-3 px-4 text-right font-black text-[#FF6A00]">{formatPrice(item.totalValue)}</td>
                              <td className="py-3 px-4 text-right font-bold text-[#111111]">{formatPrice(item.sellingPrice)}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPreselectedStockItem(item)
                                      setIsRemoveStockOpen(true)
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#FF6A00] border border-[#FF6A00]/40 hover:bg-[#FF6A00]/10"
                                    title="Manually remove damaged, expired or adjusted stock"
                                  >
                                    − Deduct
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setStockItemToEdit(item)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#111111] border border-[#FFB800] hover:bg-[#FFF7E8]"
                                    title="Set expected full stock target & unit cost"
                                  >
                                    ⚙️ Target
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "#FFB800", background: "#FFFFFF" }}>
                  <table className="w-full min-w-[700px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-[11px] font-bold uppercase tracking-wider" style={{ background: "#FFF7E8", borderColor: "#FFB800", color: "#0B5B24" }}>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Product / SKU</th>
                        <th className="py-3 px-4">Movement Type</th>
                        <th className="py-3 px-4 text-right">Qty Change</th>
                        <th className="py-3 px-4">Reason / Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockMovements.map((m) => {
                        const isPositive = m.quantity > 0
                        const typeBadgeColor =
                          m.movementType === "PURCHASE_RECEIPT" ? "bg-green-100 text-green-800 border-green-300" :
                          m.movementType === "MANUAL_REMOVAL" ? "bg-red-100 text-red-800 border-red-300" :
                          m.movementType === "SALE" ? "bg-blue-100 text-blue-800 border-blue-300" :
                          "bg-amber-100 text-amber-800 border-amber-300"

                        return (
                          <tr key={m.id} className="border-t transition-colors hover:bg-[#FFF7E8]/40" style={{ borderColor: "rgba(255,184,0,0.25)" }}>
                            <td className="py-3 px-4 text-xs text-[#0B5B24]">
                              {new Date(m.createdAt).toLocaleString("en-RW", { dateStyle: "medium", timeStyle: "short" })}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-[#111111]">{m.productName}</div>
                              <div className="text-xs text-[#0B5B24] font-mono">{m.sku}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeBadgeColor}`}>
                                {m.movementType.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-black" style={{ color: isPositive ? "#17D719" : "#FF6A00" }}>
                              {isPositive ? `+${m.quantity}` : m.quantity}
                            </td>
                            <td className="py-3 px-4 text-xs text-[#111111] max-w-xs truncate">{m.reason}</td>
                          </tr>
                        )
                      })}
                      {stockMovements.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-[#0B5B24]">
                            No stock movement history recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings & Content */}
        {((section === "settings" && isManager) || section === "announcements") && (
          <div>
            {section === "settings" && (
              <>
                <div className="badge mb-2" style={{ color: "#FF6A00" }}>
                  STORE CONFIGURATION & CONTENT
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl mb-2">
                  Settings & Content
                </h1>
                <p className="text-sm text-[#0B5B24] mb-8">
                  Update store contact channels, Mobile Money accounts, delivery pricing, and promotional banners.
                </p>

                <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Store & Contacts */}
              <div className="p-6 rounded-2xl border" style={{ background: "#FFF7E8", borderColor: "#FFB800" }}>
                <h3 className="font-bold text-[#111111] mb-4 text-base">Store Identity & Contact Channels</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0B5B24] mb-1">Store Name</label>
                    <input
                      value={settingsData?.shopName ?? "DubazaarMart"}
                      onChange={(e) => setSettingsData(prev => prev ? { ...prev, shopName: e.target.value } : null)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0B5B24] mb-1">Contact Email</label>
                    <input
                      value={settingsData?.companyEmail ?? "IntoreTech@gmail.com"}
                      onChange={(e) => setSettingsData(prev => prev ? { ...prev, companyEmail: e.target.value } : null)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0B5B24] mb-1">Store Phone Number</label>
                    <input
                      value={settingsData?.phoneNumber ?? "+250 788 123 456"}
                      onChange={(e) => setSettingsData(prev => prev ? { ...prev, phoneNumber: e.target.value } : null)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0B5B24] mb-1">Official WhatsApp Number</label>
                    <input
                      value={settingsData?.whatsappNumber ?? "+250789545954"}
                      onChange={(e) => setSettingsData(prev => prev ? { ...prev, whatsappNumber: e.target.value } : null)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#0B5B24] mb-1">Physical Address</label>
                    <input
                      value={settingsData?.businessAddress ?? "KG 15 Ave, Kigali, Rwanda"}
                      onChange={(e) => setSettingsData(prev => prev ? { ...prev, businessAddress: e.target.value } : null)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="p-6 rounded-2xl border" style={{ background: "#FFF7E8", borderColor: "#FFB800" }}>
                <h3 className="font-bold text-[#111111] mb-4 text-base">Mobile Money Payment Settings</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0B5B24] mb-1">MTN MoMo Merchant / Receiver Number</label>
                    <input
                      value={settingsData?.momoNumber ?? "*182*8*1*..."}
                      onChange={(e) => setSettingsData(prev => prev ? { ...prev, momoNumber: e.target.value } : null)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0B5B24] mb-1">Airtel Money Merchant / Receiver Number</label>
                    <input
                      value={settingsData?.momoNumber ? settingsData.momoNumber : "*182*8*2*..."}
                      onChange={(e) => setSettingsData(prev => prev ? { ...prev, momoNumber: e.target.value } : null)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Settings */}
              <div className="p-6 rounded-2xl border" style={{ background: "#FFF7E8", borderColor: "#FFB800" }}>
                <h3 className="font-bold text-[#111111] mb-4 text-base">Delivery Fees (RWF)</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0B5B24] mb-1">Standard Delivery Fee (RWF)</label>
                    <input
                      type="number"
                      value={settingsData?.standardDeliveryFee ?? 10000}
                      onChange={(e) => setSettingsData(prev => prev ? { ...prev, standardDeliveryFee: Number(e.target.value) } : null)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0B5B24] mb-1">Express Delivery Fee (RWF)</label>
                    <input
                      type="number"
                      value={settingsData?.expressDeliveryFee ?? 25000}
                      onChange={(e) => setSettingsData(prev => prev ? { ...prev, expressDeliveryFee: Number(e.target.value) } : null)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0B5B24] mb-1">Free Delivery Threshold (RWF)</label>
                    <input
                      type="number"
                      value={settingsData?.freeDeliveryThreshold ?? 500000}
                      onChange={(e) => setSettingsData(prev => prev ? { ...prev, freeDeliveryThreshold: Number(e.target.value) } : null)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border" style={{ background: "#FFF7E8", borderColor: "#FFB800" }}>
                <h3 className="font-bold text-[#111111] mb-2 text-base">User registration</h3>
                <label className="flex items-start gap-3 text-sm text-[#111111]">
                  <input
                    type="checkbox"
                    checked={settingsData?.allowStaffRegistration ?? false}
                    onChange={(event) => setSettingsData((previous) => previous
                      ? { ...previous, allowStaffRegistration: event.target.checked }
                      : null)}
                    className="mt-1"
                  />
                  <span>
                    Allow public user registration. New accounts remain pending and receive no permissions until a manager activates and configures them.
                  </span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="btn-gold px-6 py-2.5 rounded-xl font-bold text-sm shadow-md disabled:opacity-50"
                >
                  {settingsSaving ? "Saving Settings…" : "Save Store Settings"}
                </button>
              </div>
                </form>
              </>
            )}

            {section === "announcements" && (
              <div className="mb-8">
                <div className="badge mb-2" style={{ color: "#FF6A00" }}>
                  STORE COMMUNICATIONS
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl mb-2">
                  Announcements
                </h1>
                <p className="text-sm text-[#0B5B24]">
                  Create store-wide messages and control when they appear at the top of the customer store.
                </p>
              </div>
            )}

            <div
              className={section === "settings" ? "mt-10 p-6 rounded-2xl border" : ""}
              style={section === "settings" ? { background: "#FFFFFF", borderColor: "#FFB800" } : undefined}
            >
              <AnnouncementsPanel embedded={section === "settings"} />
            </div>
          </div>
        )}
        {section === "staff" && isManager && <StaffManagementPanel />}
        {section === "audit" && isManager && <AuditLogPanel />}
      </main>

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onProductAdded={(newProd) => {
          setActionSuccess(`Product "${newProd.name}" added successfully!`)
          setTimeout(() => setActionSuccess(null), 3500)
          // Re-fetch products from backend so the list updates immediately
          fetchProductsFromBackend()
          setRefreshToken((v) => v + 1)
        }}
      />

      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        products={products as any}
        onClose={() => setIsCreateOrderOpen(false)}
        onOrderCreated={() => {
          setActionSuccess("New order placed and recorded successfully!")
          setTimeout(() => setActionSuccess(null), 3500)
          setRefreshToken((v) => v + 1)
        }}
      />

      <CustomerOrderDetailsModal
        order={selectedOrderForDetails}
        onClose={() => setSelectedOrderForDetails(null)}
        onRecordPayment={(orderId) => {
          handleRecordPayment(orderId)
          setSelectedOrderForDetails(null)
        }}
        onCancelOrder={(orderId) => {
          setSelectedOrderForDetails(null)
          setOrderIdToCancel(orderId)
        }}
        onDeleteOrder={(orderId) => {
          setSelectedOrderForDetails(null)
          handleDeleteOrder(orderId)
        }}
      />

      <CancelOrderModal
        isOpen={orderIdToCancel !== null}
        orderId={orderIdToCancel ?? ""}
        onClose={() => setOrderIdToCancel(null)}
        onConfirmed={handleCancelOrder}
      />

      <CreateCompanyOrderModal
        isOpen={isCreateCompanyOrderOpen}
        onClose={() => setIsCreateCompanyOrderOpen(false)}
        onOrderCreated={(newPo) => {
          setActionSuccess(`Company Purchase Order #${newPo.poNumber} created successfully!`)
          setTimeout(() => setActionSuccess(null), 3500)
          setRefreshToken((v) => v + 1)
        }}
      />

      <EditCompanyOrderModal
        po={poForEdit}
        onClose={() => setPoForEdit(null)}
        onOrderSaved={(saved) => {
          setCompanyOrders((current) => current.map((po) => po.id === saved.id ? saved : po))
          setActionSuccess(`Purchase Order #${saved.poNumber} updated successfully.`)
          setTimeout(() => setActionSuccess(null), 3500)
        }}
      />

      <ReceiveCompanyOrderModal
        isOpen={poForReceive !== null}
        po={poForReceive}
        onClose={() => setPoForReceive(null)}
        onStockAdded={(_updatedPo, msg) => {
          setActionSuccess(msg)
          setTimeout(() => setActionSuccess(null), 3500)
          setRefreshToken((v) => v + 1)
        }}
      />

      <RemoveStockModal
        isOpen={isRemoveStockOpen}
        stockItems={stockOverview?.items ?? []}
        preselectedProduct={preselectedStockItem}
        onClose={() => {
          setIsRemoveStockOpen(false)
          setPreselectedStockItem(null)
        }}
        onStockRemoved={(msg) => {
          setActionSuccess(msg)
          setTimeout(() => setActionSuccess(null), 3500)
          setRefreshToken((v) => v + 1)
        }}
      />

      <EditStockItemModal
        isOpen={stockItemToEdit !== null}
        item={stockItemToEdit}
        onClose={() => setStockItemToEdit(null)}
        onUpdated={(msg) => {
          setActionSuccess(msg)
          setTimeout(() => setActionSuccess(null), 3500)
          setRefreshToken((v) => v + 1)
        }}
      />

      <EditProductModal
        isOpen={productToEdit !== null}
        product={productToEdit}
        onClose={() => setProductToEdit(null)}
        onProductUpdated={(saved) => {
          setActionSuccess(`Product "${saved.name}" updated successfully!`)
          setTimeout(() => setActionSuccess(null), 3500)
          fetchProductsFromBackend()
          setRefreshToken((v) => v + 1)
        }}
      />

      {/* Delete Order Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDeleteOrder !== null}
        title="Archive Order"
        message={`Archive Order #${confirmDeleteOrder}? It will leave the active list but remain in the database for your records.`}
        confirmLabel="Archive Order"
        danger
        onConfirm={() => {
          if (confirmDeleteOrder) {
            executeDeleteOrder(confirmDeleteOrder)
          }
        }}
        onClose={() => setConfirmDeleteOrder(null)}
      />

      {/* Delete Purchase Order Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDeletePo !== null}
        title="Archive Purchase Order"
        message={`Archive Purchase Order #${confirmDeletePo?.poNumber}? It will leave the active list but remain in the database for your records.`}
        confirmLabel="Archive PO"
        danger
        onConfirm={() => {
          if (confirmDeletePo) {
            executeDeleteCompanyOrder(confirmDeletePo.id, confirmDeletePo.poNumber)
          }
        }}
        onClose={() => setConfirmDeletePo(null)}
      />

      {/* Delete Product Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDeleteProduct !== null}
        title="Archive Product"
        message={`Archive "${confirmDeleteProduct?.name}"? It will be removed from the store catalog while its order history is preserved.`}
        confirmLabel="Archive Product"
        danger
        onConfirm={async () => {
          if (confirmDeleteProduct) {
            const { id, name } = confirmDeleteProduct
            setConfirmDeleteProduct(null)
            try {
              await deleteProduct(id)
              setActionSuccess(`Product "${name}" archived.`)
              setTimeout(() => setActionSuccess(null), 3000)
              fetchProductsFromBackend()
              setRefreshToken((v) => v + 1)
            } catch (err) {
              console.error("Failed to delete product", err)
            }
          }
        }}
        onClose={() => setConfirmDeleteProduct(null)}
      />
    </div>
  )
}
