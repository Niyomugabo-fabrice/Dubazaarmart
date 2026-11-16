import type { CollectionConfig } from 'payload'
import { isAdmin } from './access'

export const ShipmentDocuments: CollectionConfig = {
  slug: 'shipment-documents',
  admin: { group: 'Supplier Logistics', useAsTitle: 'title' },
  access: { create: isAdmin, delete: isAdmin, read: isAdmin, update: isAdmin },
  fields: [
    {
      name: 'shipment',
      type: 'relationship',
      relationTo: 'shipments',
      required: true,
      index: true,
    },
    { name: 'title', type: 'text', required: true },
    {
      name: 'documentType',
      type: 'select',
      required: true,
      options: ['invoice', 'packing-list', 'airway-bill', 'customs', 'receipt', 'other'],
    },
    { name: 'file', type: 'upload', relationTo: 'media', required: true },
  ],
}
