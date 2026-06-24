import { NextRequest, NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/admin'

// Checks whether an email is an admin (from ADMIN_EMAILS) before sending an OTP.
export async function POST(req: NextRequest) {
  const { email } = await req.json()
  return NextResponse.json({ isAdmin: isAdminEmail(email) })
}
