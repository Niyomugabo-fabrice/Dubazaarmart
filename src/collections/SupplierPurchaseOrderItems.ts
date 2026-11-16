import type { CollectionConfig } from 'payload'
import { isAdmin } from './access'

export const SupplierPurchaseOrderItems: CollectionConfig = {
  slug: 'supplier-purchase-order-items',
  admin: { group: 'Supplier Logistics', useAsTitle: 'productName' },
  access: { create: isAdmin, delete: isAdmin, read: isAdmin, update: isAdmin },
  fields: [
    {
      name: 'purchaseOrder',
      type: 'relationship',
      relationTo: 'supplier-purchase-orders',
      required: true,
      index: true,
    },
    { name: 'product', type: 'relationship', relationTo: 'products', index: true },
    { name: 'productName', type: 'text', required: true, index: true },
    { name: 'category', type: 'text', required: true, index: true },
    { name: 'brand', type: 'text', required: true },
    { name: 'quantity', type: 'number', required: true, min: 1 },
    { name: 'unitPurchasePrice', type: 'number', required: true, min: 0 },
    { name: 'totalPurchasePrice', type: 'number', required: true, min: 0 },
  ],
}
