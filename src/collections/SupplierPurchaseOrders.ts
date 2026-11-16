import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { isAdmin } from './access'

const assignPO: CollectionBeforeChangeHook = ({ data, operation }) => {
  if (operation === 'create' && !data.purchaseOrderId) {
    data.purchaseOrderId = `PO-${Date.now().toString(36).toUpperCase()}`
  }
  return data
}

export const SupplierPurchaseOrders: CollectionConfig = {
  slug: 'supplier-purchase-orders',
  admin: {
    group: 'Supplier Logistics',
    useAsTitle: 'purchaseOrderId',
    defaultColumns: [
      'purchaseOrderId',
      'supplier',
      'purchaseOrderDate',
      'paymentStatus',
      'totalPurchaseAmount',
    ],
  },
  access: { create: isAdmin, delete: isAdmin, read: isAdmin, update: isAdmin },
  hooks: { beforeChange: [assignPO] },
  fields: [
    {
      name: 'purchaseOrderId',
      type: 'text',
      unique: true,
      index: true,
      access: { create: () => false, update: () => false },
    },
    {
      name: 'supplier',
      type: 'relationship',
      relationTo: 'suppliers',
      required: true,
      index: true,
    },
    { name: 'purchaseOrderDate', type: 'date', required: true, index: true },
    {
      name: 'currency',
      type: 'select',
      required: true,
      options: ['USD', 'AED', 'CNY', 'RWF', 'OTHER'],
    },
    {
      name: 'paymentStatus',
      type: 'select',
      required: true,
      index: true,
      options: ['unpaid', 'partially-paid', 'paid', 'refunded'],
    },
    { name: 'totalPurchaseAmount', type: 'number', required: true, min: 0 },
    { name: 'notes', type: 'textarea' },
    { name: 'invoice', type: 'upload', relationTo: 'media' },
  ],
}
