import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { isAdmin } from './access'

const prepareOrder: CollectionBeforeChangeHook = ({ data, operation }) => {
  if (operation === 'create') {
    const stamp = Date.now().toString(36).toUpperCase()
    data.orderId = `DBZ-${stamp}`
    data.orderStatus = 'pending'
    data.paymentStatus = 'paid'
    data.placedAt = new Date().toISOString()
    data.isNew = true
  }
  return data
}

export const CustomerOrders: CollectionConfig = {
  slug: 'customer-orders',
  admin: {
    group: 'Customer Orders',
    useAsTitle: 'orderId',
    defaultColumns: ['orderId', 'customerName', 'total', 'orderStatus', 'placedAt'],
  },
  access: {
    create: () => true,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  hooks: { beforeChange: [prepareOrder] },
  fields: [
    {
      name: 'orderId',
      type: 'text',
      unique: true,
      index: true,
      access: { create: () => false, update: () => false },
    },
    { name: 'customerName', type: 'text', required: true, index: true },
    { name: 'phone', type: 'text', required: true, index: true },
    { name: 'email', type: 'email', required: true, index: true },
    { name: 'customerKey', type: 'text', index: true },
    {
      name: 'deliveryAddress',
      type: 'group',
      fields: [
        { name: 'province', type: 'text', required: true },
        { name: 'district', type: 'text', required: true },
        { name: 'sector', type: 'text', required: true },
        { name: 'cell', type: 'text', required: true },
        { name: 'street', type: 'text' },
        { name: 'instructions', type: 'textarea' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', index: true },
        { name: 'productName', type: 'text', required: true, index: true },
        { name: 'category', type: 'text', required: true, index: true },
        { name: 'sku', type: 'text', required: true },
        { name: 'quantity', type: 'number', required: true, min: 1 },
        { name: 'unitPrice', type: 'number', required: true, min: 0 },
      ],
    },
    { name: 'subtotal', type: 'number', required: true, min: 0 },
    { name: 'deliveryFee', type: 'number', required: true, min: 0 },
    { name: 'total', type: 'number', required: true, min: 0 },
    { name: 'paymentMethod', type: 'select', required: true, options: ['mtn', 'airtel'] },
    {
      name: 'paymentStatus',
      type: 'select',
      index: true,
      defaultValue: 'pending',
      options: ['pending', 'paid', 'failed', 'refunded'],
      access: { create: () => false },
    },
    {
      name: 'orderStatus',
      type: 'select',
      index: true,
      defaultValue: 'pending',
      options: ['pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'],
      access: { create: () => false },
    },
    {
      name: 'placedAt',
      type: 'date',
      index: true,
      access: { create: () => false, update: () => false },
    },
    {
      name: 'isNew',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      access: { create: () => false },
    },
  ],
}
