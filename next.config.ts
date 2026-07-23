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
  },
}

export default nextConfig
