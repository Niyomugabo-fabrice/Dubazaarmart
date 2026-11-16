import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { isAdmin } from './access'

const assignShipmentID: CollectionBeforeChangeHook = ({ data, operation }) => {
  if (operation === 'create' && !data.shipmentId)
    data.shipmentId = `SHP-${Date.now().toString(36).toUpperCase()}`
  return data
}

export const shipmentStatusOptions = [
  { label: 'Order Placed with Supplier', value: 'order-placed' },
  { label: 'Supplier Processing Order', value: 'supplier-processing' },
  { label: 'Products Ready for Dispatch', value: 'ready-for-dispatch' },
  { label: 'Shipped from China/Dubai', value: 'shipped' },
  { label: 'In Transit', value: 'in-transit' },
  { label: 'Arrived in Transit Country or Hub', value: 'at-transit-hub' },
  { label: 'Customs Clearance', value: 'customs-clearance' },
  { label: 'Departed for Rwanda', value: 'departed-for-rwanda' },
  { label: 'Arrived in Kigali', value: 'arrived-kigali' },
  { label: 'Received at DubazaarMart Warehouse', value: 'received-warehouse' },
  { label: 'Completed', value: 'completed' },
]

export const Shipments: CollectionConfig = {
  slug: 'shipments',
  admin: {
    group: 'Supplier Logistics',
    useAsTitle: 'shipmentId',
    defaultColumns: ['shipmentId', 'purchaseOrder', 'origin', 'estimatedArrival', 'status'],
  },
  access: { create: isAdmin, delete: isAdmin, read: isAdmin, update: isAdmin },
  hooks: { beforeChange: [assignShipmentID] },
  fields: [
    {
      name: 'shipmentId',
      type: 'text',
      unique: true,
      index: true,
      access: { create: () => false, update: () => false },
    },
    {
      name: 'purchaseOrder',
      type: 'relationship',
      relationTo: 'supplier-purchase-orders',
      required: true,
      index: true,
    },
    {
      name: 'supplier',
      type: 'relationship',
      relationTo: 'suppliers',
      required: true,
      index: true,
    },
    {
      name: 'origin',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'China', value: 'china' },
        { label: 'Dubai / UAE', value: 'uae' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'shippingCompany', type: 'text', required: true },
    {
      name: 'shippingMethod',
      type: 'select',
      required: true,
      options: ['air-freight', 'sea-freight', 'other'],
    },
    { name: 'trackingNumber', type: 'text', index: true },
    { name: 'dispatchDate', type: 'date' },
    { name: 'estimatedArrival', type: 'date', index: true },
    { name: 'actualArrival', type: 'date' },
    { name: 'receivedAt', type: 'date' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'order-placed',
      index: true,
      options: shipmentStatusOptions,
    },
    {
      name: 'customsStatus',
      type: 'select',
      index: true,
      options: ['not-applicable', 'pending', 'in-clearance', 'cleared', 'held'],
    },
    { name: 'shippingCost', type: 'number', required: true, min: 0 },
    { name: 'notes', type: 'textarea' },
  ],
}
