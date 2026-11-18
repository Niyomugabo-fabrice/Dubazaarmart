import { useEffect, useState } from 'react'
import { fetchWebsiteSettings, type WebsiteSettings } from '../lib/dashboardApi'

const DEFAULT_SETTINGS: WebsiteSettings = {
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
  allowStaffRegistration: false,
}

let cachedSettings = DEFAULT_SETTINGS
const listeners = new Set<(s: WebsiteSettings) => void>()

export function useWebsiteSettings() {
  const [settings, setSettings] = useState<WebsiteSettings>(cachedSettings)

  useEffect(() => {
    listeners.add(setSettings)

    fetchWebsiteSettings()
      .then(s => {
        cachedSettings = s
        listeners.forEach(l => l(s))
      })
      .catch(() => {})

    return () => {
      listeners.delete(setSettings)
    }
  }, [])

  return settings
}

export function updateCachedSettings(s: WebsiteSettings) {
  cachedSettings = s
  listeners.forEach(l => l(s))
}
