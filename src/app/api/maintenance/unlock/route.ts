import { NextRequest, NextResponse } from 'next/server'

// Visit /api/maintenance/unlock?key=YOUR_SECRET to set the bypass cookie.
// Visit /api/maintenance/unlock?lock=1 to remove it again.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const secret = process.env.MAINTENANCE_BYPASS_SECRET

  // Lock back: clear the cookie
  if (searchParams.get('lock') === '1') {
    const res = NextResponse.redirect(`${origin}/maintenance`)
    res.cookies.delete('maint_bypass')
    return res
  }

  const key = searchParams.get('key')
  if (!secret || key !== secret) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
  }

  const res = NextResponse.redirect(origin)
  res.cookies.set('maint_bypass', secret, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return res
}
