import type { SupabaseClient } from '@supabase/supabase-js'

export type NotificationType = 'new_order' | 'new_lead' | 'low_stock' | 'order_cancelled' | 'inventory_adjustment'

// Best-effort: never throws so it can't break the calling request.
export async function notify(
  admin: SupabaseClient,
  n: { type: NotificationType; title: string; body?: string | null; link?: string | null },
): Promise<void> {
  try {
    await admin.from('notifications').insert({
      type: n.type,
      title: n.title,
      body: n.body ?? null,
      link: n.link ?? null,
    })
  } catch { /* ignore */ }
}

export type ActivityAction =
  | 'product_created' | 'product_updated' | 'inventory_adjusted'
  | 'order_created' | 'order_status_changed' | 'lead_converted' | 'category_created'
  | 'vendor_created' | 'vendor_updated' | 'vendor_deleted'

export async function logActivity(
  admin: SupabaseClient,
  a: { adminEmail?: string | null; action: ActivityAction; entity?: string; entityId?: string; detail?: string },
): Promise<void> {
  try {
    await admin.from('activity_logs').insert({
      admin_email: a.adminEmail ?? null,
      action: a.action,
      entity: a.entity ?? null,
      entity_id: a.entityId ?? null,
      detail: a.detail ?? null,
    })
  } catch { /* ignore */ }
}
