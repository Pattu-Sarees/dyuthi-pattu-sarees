import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { getCustomerOrders } from '@/lib/customers'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user && isAdminEmail(user.email)
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ phone: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { phone } = await params
  const orders = await getCustomerOrders(decodeURIComponent(phone))
  return NextResponse.json({ orders })
}
