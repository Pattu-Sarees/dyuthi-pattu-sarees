import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Title-case a product/display name regardless of how it was entered in admin
// (lowercase, UPPERCASE, miXed). "gadwal pattu" / "GADWAL PATTU" -> "Gadwal Pattu".
export function toTitleCase(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function getDiscountPercent(original: number, current: number): number {
  return Math.round(((original - current) / original) * 100)
}

export type StockLevel = 'out' | 'low' | 'in'

// Inventory automation: 0 → Sold Out, 1-2 → Low Stock, 3+ → In Stock
export function getStockStatus(quantity: number, threshold = 3): { level: StockLevel; label: string } {
  const qty = Number(quantity) || 0
  if (qty <= 0) return { level: 'out', label: 'Sold Out' }
  if (qty <= threshold) return { level: 'low', label: 'Low Stock' }
  return { level: 'in', label: 'In Stock' }
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Order Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50',
  confirmed: 'text-blue-600 bg-blue-50',
  processing: 'text-purple-600 bg-purple-50',
  shipped: 'text-indigo-600 bg-indigo-50',
  out_for_delivery: 'text-orange-600 bg-orange-50',
  delivered: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
  returned: 'text-gray-600 bg-gray-50',
}

// ---- Email validation (shared by checkout, admin forms and API routes) ----
// Standard shape check PLUS a known-TLD check, so typo/fake endings like
// "gmail.com.in.ilk" are rejected (a plain regex would accept them).
const EMAIL_TLDS = new Set([
  'com', 'in', 'org', 'net', 'co', 'io', 'info', 'biz', 'edu', 'gov', 'mil',
  'me', 'ai', 'app', 'dev', 'online', 'store', 'shop', 'uk', 'us', 'ca', 'au',
  'ae', 'sg', 'nz', 'de', 'fr', 'it', 'es', 'jp', 'lk', 'bd', 'np', 'my', 'qa',
  'om', 'kw', 'sa', 'bh',
])

export function isValidEmail(email: string): boolean {
  const e = email.trim()
  if (e.length > 120) return false
  // local@domain.tld — letters/digits/._%+- locally; letter/digit/hyphen labels in domain
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(e)) return false
  const tld = e.slice(e.lastIndexOf('.') + 1).toLowerCase()
  return EMAIL_TLDS.has(tld)
}
