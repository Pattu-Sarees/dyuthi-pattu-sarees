import type { ProcurementEntry } from '@/types'

/**
 * Validate & normalise the per-vendor procurement records coming from the
 * admin product form before they're written to the `procurements` jsonb column.
 * Drops rows without a vendor and coerces cost to a number (or null).
 */
export function sanitizeProcurements(input: unknown): ProcurementEntry[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    .map((r) => ({
      vendor_id: typeof r.vendor_id === 'string' ? r.vendor_id : '',
      purchase_cost:
        r.purchase_cost != null && r.purchase_cost !== '' && Number.isFinite(Number(r.purchase_cost))
          ? Number(r.purchase_cost)
          : null,
      purchase_date: typeof r.purchase_date === 'string' && r.purchase_date ? r.purchase_date : null,
      invoice_number: typeof r.invoice_number === 'string' && r.invoice_number.trim() ? r.invoice_number.trim() : null,
      notes: typeof r.notes === 'string' && r.notes.trim() ? r.notes.trim() : null,
    }))
    .filter((r) => r.vendor_id)
}
