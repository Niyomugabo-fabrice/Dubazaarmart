import type { CollectionConfig } from 'payload'
import { isAdmin } from './access'

export const ShipmentNotifications: CollectionConfig = {
  slug: 'shipment-notifications',
  admin: {
    group: 'Supplier Logistics',
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'shipment', 'read', 'createdAt'],
  },
  access: { create: isAdmin, delete: isAdmin, read: isAdmin, update: isAdmin },
  fields: [
    { name: 'shipment', type: 'relationship', relationTo: 'shipments', index: true },
    {
      name: 'purchaseOrder',
      type: 'relationship',
      relationTo: 'supplier-purchase-orders',
      index: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      index: true,
      options: [
        'supplier-order-created',
        'dispatched',
        'status-changed',
        'arriving-7-days',
        'arriving-24-hours',
        'delayed',
        'arrived-kigali',
        'received-warehouse',
      ],
    },
    { name: 'dedupeKey', type: 'text', required: true, unique: true, index: true },
    { name: 'title', type: 'text', required: true },
    { name: 'message', type: 'textarea', required: true },
    { name: 'read', type: 'checkbox', defaultValue: false, index: true },
  ],
}
