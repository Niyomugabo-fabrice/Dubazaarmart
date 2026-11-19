export interface Product {
  id: string
  slug?: string
  name: string
  category: string
  brand: string
  description: string
  price: number
  originalPrice: number
  discount: number
  image: string
  images: string[]
  quantity: number
  sku: string
  condition: 'New' | 'Refurbished'
  specs: Record<string, string>
  warranty: string
  featured: boolean
  active: boolean
  rating: number
  reviews: number
  badge?: string
  createdAt?: string
  updatedAt?: string
}

export interface ProductCategory {
  id: string
  name: string
}

export const categoryImageIds = [
  'smartphones',
  'laptops',
  'tablets',
  'smartwatches',
  'headphones',
  'earbuds',
  'tvs',
  'cameras',
  'gaming',
  'accessories',
  'phone-accessories',
  'chargers',
  'power-banks',
  'speakers',
] as const

export const categories: ProductCategory[] = [
  { id: 'smartphones', name: 'Smartphones' },
  { id: 'laptops', name: 'Laptops' },
  { id: 'tablets', name: 'Tablets'},
  { id: 'smartwatches', name: 'Smart Watches'},
  { id: 'headphones', name: 'Headphones' },
  { id: 'earbuds', name: 'Earbuds'},
  { id: 'tvs', name: 'TVs' },
  { id: 'cameras', name: 'Cameras'},
  { id: 'gaming', name: 'Gaming'},
  { id: 'accessories', name: 'Computer Accessories'},
  { id: 'phone-accessories', name: 'Phone Accessories'},
  { id: 'chargers', name: 'Chargers'},
  { id: 'power-banks', name: 'Power Banks'  },
  { id: 'speakers', name: 'Speakers'},
]

export const products: Product[] = [
  {
    id: 'p1',
    name: 'Samsung Galaxy S24 Ultra',
    category: 'smartphones',
    brand: 'Samsung',
    description: 'The ultimate Samsung flagship with a built-in S Pen, 200MP camera system, and Snapdragon 8 Gen 3 processor. Experience AI-powered photography and productivity like never before.',
    price: 1_450_000,
    originalPrice: 1_800_000,
    discount: 19,
    image: 'https://images.unsplash.com/photo-1675315936697-1bd8e939948e?w=600&h=600&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1675315936697-1bd8e939948e?w=600&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1511140973288-19bf21d7e771?w=600&h=600&fit=crop&auto=format',
    ],
    quantity: 12,
    sku: 'SAM-S24U-BLK',
    condition: 'New',
    specs: {
      Display: '6.8" Dynamic AMOLED 2X, 120Hz',
      Processor: 'Snapdragon 8 Gen 3',
      RAM: '12GB',
      Storage: '256GB / 512GB / 1TB',
      Camera: '200MP + 50MP + 12MP + 10MP',
      Battery: '5000 mAh, 45W charging',
      OS: 'Android 14, One UI 6.1',
    },
    warranty: '1 year official warranty',
    featured: true,
    active: true,
    rating: 4.8,
    reviews: 247,
    badge: 'Best Seller',
  },
  {
    id: 'p2',
    name: 'Apple MacBook Pro 14" M3 Pro',
    category: 'laptops',
    brand: 'Apple',
    description: 'The most advanced MacBook Pro ever, featuring the M3 Pro chip with breakthrough performance and battery life in a stunning Liquid Retina XDR display.',
    price: 2_850_000,
    originalPrice: 3_200_000,
    discount: 11,
    image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=600&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&h=600&fit=crop&auto=format',
    ],
    quantity: 7,
    sku: 'APL-MBP14-M3P',
    condition: 'New',
    specs: {
      Chip: 'Apple M3 Pro (11-core CPU, 14-core GPU)',
      Display: '14.2" Liquid Retina XDR, 120Hz ProMotion',
      RAM: '18GB Unified Memory',
      Storage: '512GB SSD',
      Battery: 'Up to 18 hours',
      Ports: '3x Thunderbolt 4, HDMI, SD card, MagSafe 3',
    },
    warranty: '1 year Apple warranty',
    featured: true,
    active: true,
    rating: 4.9,
    reviews: 183,
    badge: 'Featured',
  },
  {
    id: 'p3',
    name: 'Sony WH-1000XM5 Headphones',
    category: 'headphones',
    brand: 'Sony',
    description: 'Industry-leading noise cancellation with eight microphones and two processors. Exceptional call quality and up to 30 hours battery life.',
    price: 380_000,
    originalPrice: 480_000,
    discount: 21,
    image: 'https://images.unsplash.com/photo-1605170876472-db58e15c430e?w=600&h=600&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1605170876472-db58e15c430e?w=600&h=600&fit=crop&auto=format',
    ],
    quantity: 28,
    sku: 'SNY-WH1000XM5-BLK',
    condition: 'New',
    specs: {
      'Noise Cancellation': 'Industry-leading ANC',
      Battery: '30 hours with ANC, 40 hours without',
      Charging: 'USB-C, 3 min = 3 hours',
      Connectivity: 'Bluetooth 5.2, multipoint',
      Weight: '250g',
    },
    warranty: '1 year Sony warranty',
    featured: true,
    active: true,
    rating: 4.7,
    reviews: 392,
    badge: 'Hot Deal',
  },
  {
    id: 'p4',
    name: 'Apple AirPods Pro (2nd Gen)',
    category: 'earbuds',
    brand: 'Apple',
    description: 'AirPods Pro feature the Apple H2 chip with up to 2x more active noise cancellation, Adaptive Transparency, and Personalized Spatial Audio.',
    price: 320_000,
    originalPrice: 380_000,
    discount: 16,
    image: 'https://images.unsplash.com/photo-1623593476737-0fc80f6be51d?w=600&h=600&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1623593476737-0fc80f6be51d?w=600&h=600&fit=crop&auto=format',
    ],
    quantity: 45,
    sku: 'APL-APP2-WHT',
    condition: 'New',
    specs: {
      Chip: 'Apple H2',
      ANC: '2x Active Noise Cancellation',
      Battery: '6 hours (30 hours with case)',
      Connectivity: 'Bluetooth 5.3',
      'Water Resistance': 'IPX4',
    },
    warranty: '1 year Apple warranty',
    featured: false,
    active: true,
    rating: 4.8,
    reviews: 521,
  },
  {
    id: 'p5',
    name: 'Samsung Galaxy Tab S9 Ultra',
    category: 'tablets',
    brand: 'Samsung',
    description: 'The most powerful Galaxy Tab ever. A massive 14.6" Dynamic AMOLED 2X display, Snapdragon 8 Gen 2, and seamless multitasking with DeX mode.',
    price: 1_150_000,
    originalPrice: 1_400_000,
    discount: 18,
    image: 'https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=600&h=600&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=600&h=600&fit=crop&auto=format',
    ],
    quantity: 9,
    sku: 'SAM-GTS9U-GRA',
    condition: 'New',
    specs: {
      Display: '14.6" Dynamic AMOLED 2X, 120Hz',
      Processor: 'Snapdragon 8 Gen 2',
      RAM: '12GB',
      Storage: '256GB',
      Battery: '11200 mAh, 45W',
      Pen: 'S Pen included',
    },
    warranty: '1 year Samsung warranty',
    featured: true,
    active: true,
    rating: 4.7,
    reviews: 98,
    badge: 'New Arrival',
  },
  {
    id: 'p6',
    name: 'Apple Watch Ultra 2',
    category: 'smartwatches',
    brand: 'Apple',
    description: 'The most rugged and capable Apple Watch ever built for elite athletes and adventurers. Ultra-precise GPS, 36-hour battery, and a titanium case.',
    price: 980_000,
    originalPrice: 1_120_000,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1768561327952-119a4c9c76f7?w=600&h=600&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1768561327952-119a4c9c76f7?w=600&h=600&fit=crop&auto=format',
    ],
    quantity: 6,
    sku: 'APL-AWU2-TIT',
    condition: 'New',
    specs: {
      Case: '49mm Titanium',
      Display: 'Always-on Retina LTPO OLED',
      Battery: '36 hours, 60 hours in Low Power Mode',
      GPS: 'Precision dual-frequency GPS',
      Water: '100m water resistance',
      Chip: 'Apple S9 SiP',
    },
    warranty: '1 year Apple warranty',
    featured: true,
    active: true,
    rating: 4.9,
    reviews: 67,
    badge: 'Premium',
  },
  {
    id: 'p7',
    name: 'iPhone 15 Pro Max',
    category: 'smartphones',
    brand: 'Apple',
    description: 'Forged in titanium and featuring the A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever.',
    price: 1_680_000,
    originalPrice: 1_900_000,
    discount: 12,
    image: 'https://images.unsplash.com/photo-1608223483290-fb6031e8b5da?w=600&h=600&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1608223483290-fb6031e8b5da?w=600&h=600&fit=crop&auto=format',
    ],
    quantity: 14,
    sku: 'APL-IP15PM-BLK',
    condition: 'New',
    specs: {
      Display: '6.7" Super Retina XDR, 120Hz ProMotion',
      Chip: 'A17 Pro (3nm)',
      Camera: '48MP main + 12MP ultrawide + 12MP 5x telephoto',
      Battery: '4422 mAh, USB-C charging',
      Storage: '256GB / 512GB / 1TB',
    },
    warranty: '1 year Apple warranty',
    featured: true,
    active: true,
    rating: 4.8,
    reviews: 309,
    badge: 'Top Pick',
  },
  {
    id: 'p8',
    name: 'Anker 737 Power Bank 24000mAh',
    category: 'power-banks',
    brand: 'Anker',
    description: '24000mAh capacity with 140W total output, smart display, and bi-directional fast charging. Power everything from phones to laptops.',
    price: 125_000,
    originalPrice: 155_000,
    discount: 19,
    image: 'https://images.unsplash.com/photo-1530893609608-32a9af3aa95c?w=600&h=600&fit=crop&auto=format',
    images: [
      'https://images.unsplash.com/photo-1530893609608-32a9af3aa95c?w=600&h=600&fit=crop&auto=format',
    ],
    quantity: 55,
    sku: 'ANK-737-BLK',
    condition: 'New',
    specs: {
      Capacity: '24000mAh',
      Output: '140W maximum',
      Ports: '2x USB-C + 1x USB-A',
      Display: 'Smart digital display',
      Weight: '706g',
    },
    warranty: '18 months Anker warranty',
    featured: false,
    active: true,
    rating: 4.6,
    reviews: 178,
  },
]
