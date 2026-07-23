import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { REVIEW_SOURCES } from '@/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && isAdminEmail(user.email) ? user : null
}

function cleanSource(s: unknown): string {
  return (REVIEW_SOURCES as readonly string[]).includes(s as string) ? (s as string) : 'Manual Entry'
}

function fields(body: Record<string, unknown>) {
  const rating = Math.min(5, Math.max(1, Number(body.rating) || 5))
  return {
    customer_name: String(body.customer_name || '').trim(),
    review_title: body.review_title ? String(body.review_title).trim().slice(0, 120) : null,
    review_text: String(body.review_text || '').trim(),
    rating,
    location: body.location ? String(body.location).trim().slice(0, 120) : null,
    purchased_product: body.purchased_product ? String(body.purchased_product).trim() : null,
    review_source: cleanSource(body.review_source),
    avatar_initial: body.avatar_initial ? String(body.avatar_initial).trim().slice(0, 2) : null,
    proof_image: body.proof_image ? String(body.proof_image).trim() : null,
    review_images: (Array.isArray(body.review_images) ? body.review_images : [])
      .filter((u: unknown): u is string => typeof u === 'string')
      .slice(0, 3),
    is_verified_buyer: !!body.is_verified_buyer,
    is_featured: !!body.is_featured,
    // Manual admin entries are approved (and public) by default.
    status: 'approved',
    is_active: body.is_active === undefined ? true : !!body.is_active,
    display_order: Number(body.display_order) || 0,
  }
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('testimonials').select('*').order('display_order', { ascending: true })
  if (error) return NextResponse.json({ testimonials: [], error: error.message })
  return NextResponse.json({ testimonials: data })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const payload = fields(body)
  if (!payload.customer_name || !payload.review_text) {
    return NextResponse.json({ error: 'Customer name and review text are required' }, { status: 400 })
  }
  const admin = createAdminClient()
  const { data, error } = await admin.from('testimonials').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ testimonial: data })
}

// Bulk reorder: { reorder: [{ id, display_order }, ...] }
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!Array.isArray(body.reorder)) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  const admin = createAdminClient()
  for (const r of body.reorder) {
    await admin.from('testimonials').update({ display_order: Number(r.display_order) || 0 }).eq('id', r.id)
  }
  const { data } = await admin.from('testimonials').select('*').order('display_order', { ascending: true })
  return NextResponse.json({ testimonials: data })
}
