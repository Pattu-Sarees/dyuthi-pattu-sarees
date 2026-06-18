import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS. NEVER import this into client components.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
