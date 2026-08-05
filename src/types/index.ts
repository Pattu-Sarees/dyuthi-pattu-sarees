// One inventory row: a photo and how many pieces of it are in stock.
// (Stored in the products.color_variants jsonb column.)
export interface InventoryItem {
  image: string
  quantity: number
  // Colour/shade name for this specific photo/variant (main row only).
  color?: string
  // Per-item merchandising flags. A product's product-level is_new_arrival /
  // is_best_seller is a rollup (= true if any of its items has the flag).
  is_new_arrival?: boolean
  is_best_seller?: boolean
  // Extra angle shots of this item (not shown as separate listing items)
  additional_images?: string[]
}

export interface Product {
  id: string
  name: string
  description: string
  code?: string | null
  price: number
  original_price?: number
  images: string[]
  category: string
  fabric: string
  color: string[]
  color_variants: InventoryItem[]
  occasion: string[]
  region: string
  in_stock: boolean
  stock_quantity: number
  rating: number
  review_count: number
  is_featured: boolean
  is_new_arrival: boolean
  is_best_seller: boolean
  priority?: number | null
  status?: 'active' | 'inactive'
  sold_count?: number
  view_count?: number
  wishlist_count?: number
  slug?: string | null
  // Opening video (R2 / YouTube URL); shown on the product page
  video_url?: string | null
  video_urls?: string[] | null // one or more videos (video_url = the first)
  // On-site watermark text overlaid on the video (defaults to the website URL)
  video_watermark?: string | null
  // Procurement (vendor master lives in the vendors table)
  vendor_id?: string | null
  vendor_ids?: string[] | null
  procurements?: ProcurementEntry[] | null // per-vendor procurement records
  purchase_cost?: number | null
  purchase_date?: string | null
  invoice_number?: string | null
  procurement_notes?: string | null
  created_at: string
  updated_at: string
}

// One procurement record — a product can be sourced from several vendors, each
// with its own cost, date, invoice and notes.
export interface ProcurementEntry {
  vendor_id: string
  purchase_cost?: number | null
  purchase_date?: string | null
  invoice_number?: string | null
  notes?: string | null
}

export interface Vendor {
  id: string
  vendor_name: string
  notes: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface CartItem {
  key: string // unique per product + selected image
  product_id: string
  image: string
  quantity: number
  maxQty: number
  product: Product
}

export interface Cart {
  id: string
  user_id: string
  items: CartItem[]
}

export const LEAD_SOURCES = ['website', 'instagram', 'whatsapp', 'phone', 'other'] as const
export const LEAD_STATUSES = ['new', 'contacted', 'interested', 'converted', 'closed'] as const
export type LeadSource = (typeof LEAD_SOURCES)[number]
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  message: string | null
  source: LeadSource
  status: LeadStatus
  notes: string | null
  follow_up_date: string | null
  created_at: string
  updated_at: string
}

// ==================== INVENTORY ====================
export const STOCK_REASONS = ['restock', 'adjustment', 'damage', 'return', 'correction', 'sale'] as const
export type StockReason = (typeof STOCK_REASONS)[number]

export interface StockMovement {
  id: string
  product_id: string
  change: number
  resulting_quantity: number
  reason: StockReason
  note: string | null
  variant_image: string | null
  created_by: string | null
  created_at: string
}

// A product row as shown in the inventory table
export interface InventoryRow {
  id: string
  name: string
  image: string | null
  category: string
  status: 'active' | 'inactive'
  stock_quantity: number
  in_stock: boolean
  sold_count: number
  variants: InventoryItem[]   // per-colour breakdown (image + quantity)
  // Extra fields for fuller search
  fabric: string
  description: string
}

export const LOW_STOCK_THRESHOLD = 3 // fallback default; live value comes from store_settings

// ==================== STORE SETTINGS (single row) ====================
export interface StoreSettings {
  store_name: string
  support_mobile: string
  whatsapp_number: string
  business_email: string
  store_address: string
  low_stock_threshold: number
  announcement_text: string
  hero_banner_image: string
  show_best_sellers: boolean
  show_new_arrivals: boolean
  updated_at?: string
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  store_name: '',
  support_mobile: '',
  whatsapp_number: '',
  business_email: '',
  store_address: '',
  low_stock_threshold: 3,
  announcement_text: '',
  hero_banner_image: '',
  show_best_sellers: true,
  show_new_arrivals: true,
}

// ==================== REVIEWS (testimonials table) ====================
// Customer-facing submission sources + admin manual-entry sources.
export const REVIEW_SOURCES = [
  'Website Order',
  'Product Page',
  'Delivery Follow-up',
  'WhatsApp',
  'Instagram',
  'Phone',
  'Offline Customer',
  'Manual Entry',
  'Website', // legacy value kept for old rows
] as const
export type ReviewSource = (typeof REVIEW_SOURCES)[number]

// Sources a customer submission is allowed to claim (server-enforced)
export const CUSTOMER_REVIEW_SOURCES = ['Website Order', 'Product Page', 'Delivery Follow-up'] as const
// Sources offered in the admin manual-entry form
export const MANUAL_REVIEW_SOURCES = ['WhatsApp', 'Instagram', 'Phone', 'Offline Customer', 'Website Order', 'Product Page', 'Delivery Follow-up'] as const

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

export interface Testimonial {
  id: string
  customer_name: string
  customer_email: string | null
  customer_mobile: string | null
  location: string | null
  order_id: string | null
  product_id: string | null
  review_title: string | null
  review_text: string
  rating: number
  purchased_product: string | null
  review_source: ReviewSource
  avatar_initial: string | null
  proof_image: string | null
  review_images: string[]
  is_verified_buyer: boolean
  is_featured: boolean
  is_active: boolean
  status: ReviewStatus
  display_order: number
  created_at?: string
}

// ==================== HOMEPAGE CMS ====================
export const HOMEPAGE_SECTION_KEYS = ['announcement', 'hero', 'new_arrivals', 'best_sellers', 'on_sale', 'collection', 'footer'] as const
export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number]

export const HOMEPAGE_SECTION_LABELS: Record<HomepageSectionKey, string> = {
  announcement: 'Announcement Bar',
  hero: 'Hero Banner',
  new_arrivals: 'New Arrivals',
  best_sellers: 'Best Sellers',
  on_sale: 'On Sale',
  collection: 'Collection Section',
  footer: 'Footer',
}

export interface HomepageSection {
  key: HomepageSectionKey
  enabled: boolean
  title: string | null
  subtitle: string | null
  images: string[]
  sort_order: number
  data: Record<string, unknown>
  updated_at: string
}

// ==================== COUPONS ====================
export const DISCOUNT_TYPES = ['percent', 'flat'] as const
export type DiscountType = (typeof DISCOUNT_TYPES)[number]

export interface Coupon {
  id: string
  code: string
  discount_type: DiscountType
  discount_value: number
  min_order_value: number
  expiry_date: string | null
  usage_limit: number | null
  used_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ==================== CUSTOMERS ====================
// Derived (not a table) — aggregated from orders, keyed by phone.
export interface Customer {
  phone: string
  name: string
  email: string | null
  total_orders: number
  total_spending: number   // delivered orders only
  last_order_at: string | null
  first_order_at: string | null
}

export interface Address {
  id: string
  user_id: string
  // `name` is the combined full name — kept so existing order records / admin
  // views (which only ever read `.name`) keep working unchanged. Checkout
  // collects first_name/last_name separately and combines them into `name`.
  name: string
  first_name?: string
  last_name?: string
  country?: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  is_default: boolean
  // Present only when the customer chose a different billing address.
  billing?: {
    first_name?: string
    last_name?: string
    country?: string
    phone?: string
    line1?: string
    line2?: string
    city?: string
    state?: string
    pincode?: string
  }
}

export interface Order {
  id: string
  user_id: string | null
  order_number?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  customer_email?: string | null
  customer_country_code?: string | null
  status: OrderStatus
  source?: OrderSource | string
  items: OrderItem[]
  total_amount: number
  shipping_amount: number
  discount_amount: number
  address: Address | null
  payment_method: string | null
  payment_status: PaymentStatus
  payment_id?: string
  tracking_number?: string
  tracking_url?: string
  created_at: string
  updated_at: string
  estimated_delivery?: string
}

// Statuses an admin uses to manage manual orders
export const ADMIN_ORDER_STATUSES = ['pending', 'pre-booking', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'] as const
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const

// Order source / channel. 'website' = online; the rest are manual/offline.
export const ORDER_SOURCES = ['website', 'whatsapp', 'instagram', 'facebook', 'phone', 'walk-in'] as const
export type OrderSource = (typeof ORDER_SOURCES)[number]
export const ORDER_SOURCE_LABELS: Record<OrderSource, string> = {
  website: 'Online',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  phone: 'Phone',
  'walk-in': 'Walk-in',
}
// Manual/offline channels the admin can pick when creating an order.
export const MANUAL_ORDER_SOURCES = ['whatsapp', 'instagram', 'facebook', 'phone', 'walk-in'] as const
export const isOnlineSource = (s?: string | null) => (s || 'website') === 'website'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_image: string
  quantity: number
  price: number
}

export type OrderStatus =
  | 'pending'
  | 'pre-booking'
  | 'confirmed'
  | 'packed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface User {
  id: string
  email: string
  full_name?: string
  phone?: string
  avatar_url?: string
  created_at: string
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  user_name: string
  rating: number
  comment: string
  created_at: string
}

export interface ProductFilters {
  category?: string[]
  fabric?: string[]
  color?: string[]
  occasion?: string[]
  region?: string[]
  price_min?: number
  price_max?: number
  in_stock?: boolean
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'popular'
  search?: string
}
