import path from 'path'
import { buildFigmaConfig } from '@payloadcms/figma'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { en as adminLanguage } from '@payloadcms/translations/languages/en'
import { fileURLToPath } from 'url'
import { Admins } from './collections/Admins'
import { Media } from './collections/Media'
import { Folders } from './collections/Folders'
import { Tags } from './collections/Tags'
import { CustomerOrders } from './collections/CustomerOrders'
import { InventoryMovements } from './collections/InventoryMovements'
import { Products } from './collections/Products'
import { ShipmentDocuments } from './collections/ShipmentDocuments'
import { ShipmentItems } from './collections/ShipmentItems'
import { ShipmentNotifications } from './collections/ShipmentNotifications'
import { Shipments } from './collections/Shipments'
import { ShipmentStatusHistory } from './collections/ShipmentStatusHistory'
import { SupplierPurchaseOrderItems } from './collections/SupplierPurchaseOrderItems'
import { SupplierPurchaseOrders } from './collections/SupplierPurchaseOrders'
import { Suppliers } from './collections/Suppliers'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildFigmaConfig({
  admin: {
    user: Admins.slug,
    constrainWidth: true,
    dashboard: {
      widgets: [],
      defaultLayout: [
        { widgetSlug: 'activity', width: 'full' },
        { widgetSlug: 'collections', width: 'full' },
      ],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  i18n: {
    fallbackLanguage: 'en',
    supportedLanguages: { en: adminLanguage },
  },
  collections: [
    Admins,
    Media,
    Folders,
    Tags,
    Products,
    CustomerOrders,
    Suppliers,
    SupplierPurchaseOrders,
    SupplierPurchaseOrderItems,
    Shipments,
    ShipmentItems,
    ShipmentStatusHistory,
    ShipmentDocuments,
    ShipmentNotifications,
    InventoryMovements,
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  localization: {
    locales: [{ code: 'en', label: 'English' }],
    fallback: true,
    defaultLocale: 'en',
  },
  plugins: [mcpPlugin({})],
  figma: {},
})
