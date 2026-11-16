import type { CollectionConfig } from 'payload'
import { isAdmin } from './access'

export const ShipmentItems: CollectionConfig = {
  slug: 'shipment-items',
  admin: {
    group: 'Supplier Logistics',
    useAsTitle: 'productName',
    defaultColumns: ['productName', 'shipment', 'quantity', 'receivedQuantity'],
  },
  access: { create: isAdmin, delete: isAdmin, read: isAdmin, update: isAdmin },
  fields: [
    {
      name: 'shipment',
      type: 'relationship',
      relationTo: 'shipments',
      required: true,
      index: true,
    },
    {
      name: 'purchaseOrderItem',
      type: 'relationship',
      relationTo: 'supplier-purchase-order-items',
      required: true,
      index: true,
    },
    { name: 'product', type: 'relationship', relationTo: 'products', index: true },
    { name: 'productName', type: 'text', required: true, index: true },
    { name: 'category', type: 'text', required: true },
    { name: 'brand', type: 'text', required: true },
    { name: 'quantity', type: 'number', required: true, min: 1 },
    { name: 'receivedQuantity', type: 'number', required: true, defaultValue: 0, min: 0 },
    { name: 'unitPurchasePrice', type: 'number', required: true, min: 0 },
  ],
}
