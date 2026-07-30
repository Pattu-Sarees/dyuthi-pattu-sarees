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
  // Tree-shake the icon barrel so only the icons actually used ship to the client.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
