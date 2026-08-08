import type { Metadata } from 'next'
import { Geist, Cormorant_Upright, Cormorant_Garamond, Kurale } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import SiteChrome from '@/components/layout/SiteChrome'
import { getHomepageConfig } from '@/lib/homepage'
import { resolveFooterData } from '@/lib/footer'
import { Toaster } from 'sonner'

const geist = Geist({ subsets: ['latin'] })
const cormorantUpright = Cormorant_Upright({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-cormorant-upright' })
const kurale = Kurale({ subsets: ['latin'], weight: '400', variable: '--font-kurale' })
const cormorantGaramond = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-cormorant-garamond' })

export const metadata: Metadata = {
  title: 'Dyuthi Pattu Sarees | Authentic Indian Sarees',
  description: 'Shop authentic handloom sarees — silk, cotton, Banarasi, Kanjivaram, and more. Free shipping above ₹999.',
  // Browser-tab icon uses the brand logo (versioned filename busts cached favicons)
  icons: {
    icon: '/logo-v3.jpeg',
    shortcut: '/logo-v3.jpeg',
    apple: '/logo-v3.jpeg',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers()
  const isMaintenance = headerList.get('x-maintenance') === '1'

  const config = isMaintenance ? {} : await getHomepageConfig()
  const footer = resolveFooterData(config.footer?.data)
  // Versioned filename forces browsers/CDN to fetch the updated logo (old file stays cached)
  const logo = '/logo-v3.jpeg'
  const announcement = {
    enabled: config.announcement?.enabled ?? true,
    text: ((config.announcement?.data?.message as string) || '').trim() || 'Enjoy Free Shipping All Over India',
  }
  const promo = {
    enabled: config.promo?.enabled ?? false,
    text: ((config.promo?.data?.message as string) || '').trim()
      || '🧵 Direct From Weavers · 🚚 Free Shipping · ✨ Exclusive Sravanam Offers · 🎁 Save Up to ₹300',
  }

  return (
    <html lang="en">
      <body className={`${geist.className} ${cormorantUpright.variable} ${kurale.variable} ${cormorantGaramond.variable} min-h-screen flex flex-col bg-gray-50`}>
        {isMaintenance ? (
          children
        ) : (
          <>
            <SiteChrome footer={footer} logo={logo} announcement={announcement} promo={promo}>{children}</SiteChrome>
            <Toaster richColors position="top-right" duration={1500} />
          </>
        )}
      </body>
    </html>
  )
}
