import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const BYPASS_COOKIE = 'maint_bypass'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  // ---------- Maintenance mode ----------
  const maintenance = process.env.MAINTENANCE_MODE === 'true'
  if (maintenance) {
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)

    const isAdmin = !!user?.email && adminEmails.includes(user.email.toLowerCase())

    const secret = process.env.MAINTENANCE_BYPASS_SECRET
    const hasBypassCookie = !!secret && request.cookies.get(BYPASS_COOKIE)?.value === secret

    // Always allow: the maintenance page itself, the unlock route, the login
    // page + auth APIs (so admins can sign in), and Next internals.
    const alwaysAllowed =
      pathname === '/maintenance' ||
      pathname.startsWith('/api/maintenance') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/auth')

    if (!isAdmin && !hasBypassCookie && !alwaysAllowed) {
      const rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = '/maintenance'
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-maintenance', '1')
      const res = NextResponse.rewrite(rewriteUrl, {
        request: { headers: requestHeaders },
      })
      res.headers.set('x-robots-tag', 'noindex')
      return res
    }
  }

  // ---------- Protected routes ----------
  const protectedPaths = ['/account', '/orders', '/checkout', '/admin']
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))
  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
