import type { CollectionConfig } from 'payload'
import { isAdmin } from './access'

export const Suppliers: CollectionConfig = {
  slug: 'suppliers',
  admin: { group: 'Supplier Logistics', useAsTitle: 'name' },
  access: { create: isAdmin, delete: isAdmin, read: isAdmin, update: isAdmin },
  fields: [
    { name: 'name', type: 'text', required: true, index: true },
    {
      name: 'country',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'China', value: 'china' },
        { label: 'Dubai / UAE', value: 'uae' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'contactPerson', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'address', type: 'textarea' },
  ],
}
