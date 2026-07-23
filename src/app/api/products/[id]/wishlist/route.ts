import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Public: adjust a product's wishlist count (+1 on add, -1 on remove)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const delta = body.delta === -1 ? -1 : 1
  const admin = createAdminClient()
  await admin.rpc('increment_wishlist', { pid: id, delta })
  return NextResponse.json({ success: true })
}
