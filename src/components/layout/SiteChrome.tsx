'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import Footer from './Footer'
import WhatsAppButton from './WhatsAppButton'
import ScrollToTop from './ScrollToTop'
import type { FooterData } from '@/lib/footer'

export type AnnouncementConfig = { enabled: boolean; text: string }

export default function SiteChrome({
  children,
  footer,
  logo,
  announcement,
}: {
  children: React.ReactNode
  footer: FooterData
  logo: string
  announcement: AnnouncementConfig
}) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  if (isAdmin) {
    // Admin has its own top bar + sidebar — no storefront chrome
    return <main className="flex-1">{children}</main>
  }

  return (
    <>
      <Navbar logo={logo} announcement={announcement} />
      <main className="flex-1">{children}</main>
      <Footer data={footer} logo={logo} />
      <WhatsAppButton />
      <ScrollToTop />
    </>
  )
}
