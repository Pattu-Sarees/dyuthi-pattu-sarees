'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import Footer from './Footer'
import WhatsAppButton from './WhatsAppButton'
import ScrollToTop from './ScrollToTop'
import CheckoutHeader from '@/components/checkout/CheckoutHeader'
import PromoBanner from './PromoBanner'
import type { FooterData } from '@/lib/footer'

export type AnnouncementConfig = { enabled: boolean; text: string }

export default function SiteChrome({
  children,
  footer,
  logo,
  announcement,
  promo,
}: {
  children: React.ReactNode
  footer: FooterData
  logo: string
  announcement: AnnouncementConfig
  promo: { enabled: boolean; text: string }
}) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')
  const isCheckout = pathname === '/checkout'

  if (isAdmin) {
    // Admin has its own top bar + sidebar — no storefront chrome
    return <main className="flex-1">{children}</main>
  }

  if (isCheckout) {
    // Checkout has a minimal header (brand + cart) and no navbar/footer.
    return (
      <>
        <CheckoutHeader logo={logo} />
        <main className="flex-1">{children}</main>
      </>
    )
  }

  return (
    <>
      <Navbar logo={logo} announcement={announcement} />
      {promo.enabled && promo.text && <PromoBanner text={promo.text} />}
      <main className="flex-1">{children}</main>
      <Footer data={footer} logo={logo} />
      <WhatsAppButton />
      <ScrollToTop />
    </>
  )
}
