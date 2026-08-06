import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { REVIEW_SOURCES } from '@/types'
import { recomputeProductRating } from '@/lib/reviews-aggregate'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && isAdminEmail(user.email) ? user : null
}

function cleanSource(s: unknown): string {
  return (REVIEW_SOURCES as readonly string[]).includes(s as string) ? (s as string) : 'Manual Entry'
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const admin = createAdminClient()

  // Partial update — only touch provided fields (lets the toggle send just is_active).
  const patch: Record<string, unknown> = {}
  if (body.customer_name !== undefined) patch.customer_name = String(body.customer_name).trim()
  if (body.review_title !== undefined) patch.review_title = body.review_title ? String(body.review_title).trim().slice(0, 120) : null
  if (body.review_text !== undefined) patch.review_text = String(body.review_text).trim()
  if (body.rating !== undefined) patch.rating = Math.min(5, Math.max(1, Number(body.rating) || 5))
  if (body.location !== undefined) patch.location = body.location ? String(body.location).trim().slice(0, 120) : null
  if (body.purchased_product !== undefined) patch.purchased_product = body.purchased_product ? String(body.purchased_product).trim() : null
  if (body.review_source !== undefined) patch.review_source = cleanSource(body.review_source)
  if (body.avatar_initial !== undefined) patch.avatar_initial = body.avatar_initial ? String(body.avatar_initial).trim().slice(0, 2) : null
  if (body.proof_image !== undefined) patch.proof_image = body.proof_image ? String(body.proof_image).trim() : null
  if (body.review_images !== undefined) {
    patch.review_images = (Array.isArray(body.review_images) ? body.review_images : [])
      .filter((u: unknown): u is string => typeof u === 'string')
      .slice(0, 3)
  }
  if (body.is_verified_buyer !== undefined) patch.is_verified_buyer = !!body.is_verified_buyer
  if (body.is_featured !== undefined) patch.is_featured = !!body.is_featured
  if (body.is_active !== undefined) patch.is_active = !!body.is_active
  if (body.display_order !== undefined) patch.display_order = Number(body.display_order) || 0
  // Approval workflow: status drives public visibility (RLS filters on is_active).
  if (body.status !== undefined && ['pending', 'approved', 'rejected'].includes(body.status as string)) {
    patch.status = body.status
    patch.is_active = body.status === 'approved'
  }

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const { data, error } = await admin.from('testimonials').update(patch).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Keep the product's stored rating/review_count in sync with its approved reviews.
  await recomputeProductRating(admin, (data as { product_id?: string | null })?.product_id)
  revalidateTag('testimonials', 'max') // approve/toggle/edit → refresh homepage reviews
  revalidateTag('products', 'max')     // rating/review_count may have changed
  return NextResponse.json({ testimonial: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  // Capture the product before deleting so we can recompute its rating after.
  const { data: row } = await admin.from('testimonials').select('product_id').eq('id', id).single()
  const { error } = await admin.from('testimonials').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await recomputeProductRating(admin, (row as { product_id?: string | null })?.product_id)
  revalidateTag('testimonials', 'max')
  revalidateTag('products', 'max')
  return NextResponse.json({ success: true })
}
