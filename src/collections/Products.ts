import type { CollectionConfig } from 'payload'
import { isAdmin, publicRead } from './access'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    group: 'Commerce',
    useAsTitle: 'name',
    defaultColumns: ['name', 'sku', 'category', 'inventoryQuantity'],
  },
  access: { create: isAdmin, delete: isAdmin, read: publicRead, update: isAdmin },
  fields: [
    { name: 'name', type: 'text', required: true, index: true },
    { name: 'sku', type: 'text', required: true, unique: true, index: true },
    { name: 'category', type: 'text', required: true, index: true },
    { name: 'brand', type: 'text', required: true },
    { name: 'priceRwf', type: 'number', required: true, min: 0 },
    { name: 'inventoryQuantity', type: 'number', required: true, defaultValue: 0, min: 0 },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
