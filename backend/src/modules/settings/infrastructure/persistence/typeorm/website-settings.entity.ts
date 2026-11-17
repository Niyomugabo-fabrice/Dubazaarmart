import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'website_settings' })
export class WebsiteSettingsEntity {
  @PrimaryColumn({ type: 'text', default: 'primary' })
  id!: string

  @Column({ name: 'shop_name', type: 'text', default: 'DubazaarMart' })
  shopName!: string

  @Column({ name: 'company_email', type: 'text', default: 'info@dubazaarmart.rw' })
  companyEmail!: string

  @Column({ name: 'support_email', type: 'text', default: 'support@dubazaarmart.rw' })
  supportEmail!: string

  @Column({ name: 'phone_number', type: 'text', default: '+250789545954' })
  phoneNumber!: string

  @Column({ name: 'whatsapp_number', type: 'text', default: '+250789545954' })
  whatsappNumber!: string

  @Column({ name: 'momo_number', type: 'text', default: '+250789545954' })
  momoNumber!: string

  @Column({ name: 'business_address', type: 'text', default: 'Kigali, Rwanda (Dubai Wholesale Hub)' })
  businessAddress!: string

  @Column({ type: 'text', default: 'RWF' })
  currency!: string

  @Column({ name: 'standard_delivery_fee', type: 'numeric', precision: 14, scale: 2, default: 10000 })
  standardDeliveryFee!: string

  @Column({ name: 'express_delivery_fee', type: 'numeric', precision: 14, scale: 2, default: 25000 })
  expressDeliveryFee!: string

  @Column({ name: 'free_delivery_threshold', type: 'numeric', precision: 14, scale: 2, default: 500000 })
  freeDeliveryThreshold!: string

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date
}
