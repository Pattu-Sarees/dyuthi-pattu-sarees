import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
export function getStockStatus(quantity: number): { level: StockLevel; label: string } {
  const qty = Number(quantity) || 0
  if (qty <= 0) return { level: 'out', label: 'Sold Out' }
  if (qty <= 2) return { level: 'low', label: 'Low Stock' }
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
