import type { CollectionConfig } from 'payload'
import { isAdmin } from './access'

export const InventoryMovements: CollectionConfig = {
  slug: 'inventory-movements',
  admin: {
    group: 'Commerce',
    useAsTitle: 'receiptKey',
    defaultColumns: ['product', 'quantity', 'shipment', 'receivedBy', 'createdAt'],
  },
  access: { create: isAdmin, delete: () => false, read: isAdmin, update: () => false },
  fields: [
    { name: 'receiptKey', type: 'text', required: true, unique: true, index: true },
    { name: 'product', type: 'relationship', relationTo: 'products', required: true, index: true },
    {
      name: 'shipment',
      type: 'relationship',
      relationTo: 'shipments',
      required: true,
      index: true,
    },
    {
      name: 'shipmentItem',
      type: 'relationship',
      relationTo: 'shipment-items',
      required: true,
      index: true,
    },
    { name: 'quantity', type: 'number', required: true, min: 1 },
    { name: 'previousQuantity', type: 'number', required: true, min: 0 },
    { name: 'newQuantity', type: 'number', required: true, min: 0 },
    { name: 'receivedBy', type: 'relationship', relationTo: 'admins', required: true, index: true },
    { name: 'note', type: 'textarea' },
  ],
}
