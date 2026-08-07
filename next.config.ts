import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Dev-only Next.js badge — move it to the bottom-right so it doesn't
  // overlap the WhatsApp button (this indicator never shows in production).
  devIndicators: {
    position: 'bottom-right',
  },
  // Allow testing the dev server from other devices on the LAN (e.g. a phone
  // at http://192.168.x.x:3000). Without this, Next dev blocks the cross-origin
  // requests, breaking hydration so buttons/forms don't work. Dev-only.
  allowedDevOrigins: ['192.168.1.42', '192.168.1.41', '192.168.1.*'],
  turbopack: {
    root: '.',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
    // Serve modern formats (AVIF first, WebP fallback). Big LCP/transfer win
    // for the product photography, which dominates page weight.
    formats: ['image/avif', 'image/webp'],
    // Cache optimized images at the edge for 31 days (product images rarely
    // change; a changed image gets a new Supabase URL so this is safe).
    minimumCacheTTL: 60 * 60 * 24 * 31,
    // Tighten the generated srcset to sizes we actually render (grid cards are
    // narrow) so we don't ship oversized variants.
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [80, 128, 256, 384],
  },
  // Native/wasm image libs used only on the server (upload route). Keeps them
  // out of the client bundle and lets Next load their binaries correctly.
  serverExternalPackages: ['sharp', 'heic-convert'],
  // Tree-shake the icon barrel so only the icons actually used ship to the client.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Production security headers applied to every response. These are safe and
  // don't affect Razorpay / Google Maps / Supabase.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // ── Content-Security-Policy (recommended) ────────────────────────
          // Left OUT by default because a wrong CSP can block the Razorpay
          // checkout or Google Maps. Test in Preview first, then uncomment:
          // { key: 'Content-Security-Policy', value: [
          //   "default-src 'self'",
          //   "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://maps.googleapis.com",
          //   "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          //   "img-src 'self' data: blob: https:",
          //   "font-src 'self' https://fonts.gstatic.com data:",
          //   "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://maps.googleapis.com https://photon.komoot.io",
          //   "frame-src https://api.razorpay.com https://checkout.razorpay.com",
          //   "frame-ancestors 'self'", "base-uri 'self'", "form-action 'self'", "object-src 'none'",
          // ].join('; ') },
        ],
      },
    ]
  },
}

export default nextConfig
