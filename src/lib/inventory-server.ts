import type { SupabaseClient } from '@supabase/supabase-js'
import { deriveVariants } from '@/lib/inventory'

interface OrderItemRow {
  product_id: string | null
  product_image: string | null
  quantity: number
}

interface MovementRow {
  product_id: string
  change: number
  resulting_quantity: number
  reason: string
  note: string | null
  variant_image: string | null
  created_by: string | null
}

// On delivery, decrement the exact colour the customer bought (matched by the
// order line's product_image) and log a 'sale' movement. Best-effort: never
// throws, so a stock hiccup can't block the order status update.
export async function applyDeliveryStockDecrement(
  admin: SupabaseClient,
  orderId: string,
  orderLabel: string,
  byEmail: string | null,
): Promise<void> {
  try {
    const { data: items } = await admin
      .from('order_items')
      .select('product_id, product_image, quantity')
      .eq('order_id', orderId)

    const rows = (items || []) as OrderItemRow[]
    // Group order lines by product so we apply all of a product's lines together.
    const byProduct = new Map<string, OrderItemRow[]>()
    for (const it of rows) {
      if (!it.product_id) continue
      const arr = byProduct.get(it.product_id) || []
      arr.push(it)
      byProduct.set(it.product_id, arr)
    }

    for (const [productId, lines] of byProduct) {
      const { data: product } = await admin
        .from('products')
        .select('color_variants, images, stock_quantity')
        .eq('id', productId)
        .single()
      if (!product) continue

      const variants = deriveVariants(product.color_variants, product.images, product.stock_quantity ?? 0)
      const movements: MovementRow[] = []

      for (const line of lines) {
        const qty = Math.max(0, Number(line.quantity) || 0)
        if (qty === 0) continue

        let reduced = 0
        let matchedImage: string | null = null
        const idx = line.product_image ? variants.findIndex((v) => v.image === line.product_image) : -1

        if (idx !== -1) {
          // Exact colour the customer bought
          const before = variants[idx].quantity
          const after = Math.max(0, before - qty)
          reduced = before - after
          variants[idx] = { ...variants[idx], quantity: after }
          matchedImage = variants[idx].image
        } else {
          // No colour match — reduce greedily from available colours
          let remaining = qty
          for (let i = 0; i < variants.length && remaining > 0; i++) {
            const take = Math.min(variants[i].quantity, remaining)
            if (take > 0) {
              variants[i] = { ...variants[i], quantity: variants[i].quantity - take }
              remaining -= take
              reduced += take
            }
          }
        }

        if (reduced > 0) {
          const runningTotal = variants.reduce((s, v) => s + v.quantity, 0)
          movements.push({
            product_id: productId,
            change: -reduced,
            resulting_quantity: runningTotal,
            reason: 'sale',
            note: `Order ${orderLabel} delivered`,
            variant_image: matchedImage,
            created_by: byEmail,
          })
        }
      }

      const newTotal = variants.reduce((s, v) => s + v.quantity, 0)
      await admin
        .from('products')
        .update({ color_variants: variants, stock_quantity: newTotal, in_stock: newTotal > 0, updated_at: new Date().toISOString() })
        .eq('id', productId)

      if (movements.length) {
        await admin.from('stock_movements').insert(movements).then(undefined, () => {})
      }
    }
  } catch {
    // best-effort — swallow so the delivery status update still succeeds
  }
}
