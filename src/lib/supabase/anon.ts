import { createClient } from '@supabase/supabase-js'

/**
 * Cookie-free Supabase client for PUBLIC storefront reads (products, categories,
 * testimonials). Because it doesn't touch cookies/headers, its calls can be
 * wrapped in `unstable_cache` — unlike the cookie-based server client.
 * Uses the anon key, so it only sees data that anonymous visitors can read.
 */
export function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
