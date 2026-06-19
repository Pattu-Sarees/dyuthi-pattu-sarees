// One inventory row: a photo and how many pieces of it are in stock.
// (Stored in the products.color_variants jsonb column.)
export interface InventoryItem {
  image: string
  quantity: number
}

export interface Product {
  id: string
  name: string
  description: string
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

export interface Address {
  id: string
  user_id: string
  name: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  is_default: boolean
}

export interface Order {
  id: string
  user_id: string
  status: OrderStatus
  items: OrderItem[]
  total_amount: number
  shipping_amount: number
  discount_amount: number
  address: Address
  payment_method: string
  payment_status: PaymentStatus
  payment_id?: string
  tracking_number?: string
  tracking_url?: string
  created_at: string
  updated_at: string
  estimated_delivery?: string
}

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
  | 'confirmed'
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
