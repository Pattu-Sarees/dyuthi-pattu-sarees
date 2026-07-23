import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Public: increment a product's view count (fire-and-forget from the detail page)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()
  await admin.rpc('increment_view_count', { pid: id })
  return NextResponse.json({ success: true })
}
