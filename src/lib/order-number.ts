import type { SupabaseClient } from '@supabase/supabase-js'

// Generate a human-friendly order number like DPS26-00001:
//   DPS + 2-digit year + 5-digit sequence (resets each calendar year).
// Uses the service-role client so the count is global (not RLS-limited).
export async function generateOrderNumber(admin: SupabaseClient): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString()
  const { count } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfYear)
  const seq = (count || 0) + 1
  return `DPS${yy}-${String(seq).padStart(5, '0')}`
}
