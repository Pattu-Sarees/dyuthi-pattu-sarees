import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_STORE_SETTINGS, type StoreSettings } from '@/types'

// Read the single store-settings row (used globally: storefront, dashboard,
// invoices, low-stock threshold). Falls back to defaults if the table/row is
// missing so nothing breaks before the migration is run.
export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const db = createAdminClient()
    const { data, error } = await db.from('store_settings').select('*').eq('id', true).single()
    if (error || !data) return { ...DEFAULT_STORE_SETTINGS }
    return {
      store_name: data.store_name ?? '',
      support_mobile: data.support_mobile ?? '',
      whatsapp_number: data.whatsapp_number ?? '',
      business_email: data.business_email ?? '',
      store_address: data.store_address ?? '',
      low_stock_threshold: Number(data.low_stock_threshold ?? 3),
      announcement_text: data.announcement_text ?? '',
      hero_banner_image: data.hero_banner_image ?? '',
      show_best_sellers: data.show_best_sellers ?? true,
      show_new_arrivals: data.show_new_arrivals ?? true,
      updated_at: data.updated_at,
    }
  } catch {
    return { ...DEFAULT_STORE_SETTINGS }
  }
}

export async function getLowStockThreshold(): Promise<number> {
  const s = await getStoreSettings()
  return Number.isFinite(s.low_stock_threshold) && s.low_stock_threshold > 0 ? s.low_stock_threshold : 3
}
