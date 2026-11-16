import type { CollectionConfig } from 'payload'
import { isAdmin } from './access'

export const ShipmentStatusHistory: CollectionConfig = {
  slug: 'shipment-status-history',
  admin: {
    group: 'Supplier Logistics',
    useAsTitle: 'newStatus',
    defaultColumns: ['shipment', 'previousStatus', 'newStatus', 'changedAt', 'changedBy'],
  },
  access: { create: isAdmin, delete: () => false, read: isAdmin, update: () => false },
  fields: [
    {
      name: 'shipment',
      type: 'relationship',
      relationTo: 'shipments',
      required: true,
      index: true,
    },
    { name: 'previousStatus', type: 'text', required: true },
    { name: 'newStatus', type: 'text', required: true, index: true },
    { name: 'changedAt', type: 'date', required: true, index: true },
    { name: 'changedBy', type: 'relationship', relationTo: 'admins', required: true, index: true },
    { name: 'note', type: 'textarea' },
  ],
}
