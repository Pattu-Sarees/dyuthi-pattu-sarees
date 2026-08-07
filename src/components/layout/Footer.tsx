import Link from 'next/link'
import { Mail, Phone, MapPin, Truck, ShieldCheck, Award, Gem } from 'lucide-react'
import FooterAccordion from './FooterAccordion'
import BrandLogo from './BrandLogo'
import InstagramPicker from './InstagramPicker'
import { FOOTER_DEFAULTS, type FooterData } from '@/lib/footer'

const cards = ['UPI', 'Visa', 'Mastercard', 'RuPay', 'Amex', 'Net Banking', 'Wallets']

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.87h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
  </svg>
)
const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.64 7.86 6.36 9.32-.09-.79-.17-2 .03-2.86.19-.82 1.2-5.19 1.2-5.19s-.31-.61-.31-1.52c0-1.42.83-2.48 1.86-2.48.88 0 1.3.66 1.3 1.45 0 .88-.56 2.2-.85 3.42-.24 1.02.51 1.86 1.52 1.86 1.83 0 3.23-1.93 3.23-4.71 0-2.46-1.77-4.18-4.29-4.18-2.93 0-4.65 2.19-4.65 4.46 0 .88.34 1.83.76 2.34.08.1.1.19.07.29-.08.32-.25 1.02-.29 1.16-.05.19-.15.23-.35.14-1.3-.61-2.11-2.5-2.11-4.03 0-3.28 2.38-6.29 6.87-6.29 3.61 0 6.41 2.57 6.41 6.01 0 3.58-2.26 6.47-5.4 6.47-1.05 0-2.04-.55-2.38-1.2l-.65 2.47c-.23.9-.87 2.02-1.29 2.71.97.3 2 .46 3.07.46 5.52 0 10-4.48 10-10S17.52 2 12 2Z" />
  </svg>
)

const trust = [
  { icon: Truck, label: 'Free Shipping' },
  { icon: ShieldCheck, label: 'Secure Payments' },
  { icon: Award, label: 'Trusted Quality' },
  { icon: Gem, label: 'Premium Collections' },
]

export default function Footer({ data = FOOTER_DEFAULTS, logo = '/logo-v3.jpeg' }: { data?: FooterData; logo?: string }) {
  // Multiple Instagram profiles behind a single icon. Edit the URLs here.
  const instaAccounts = [
    { label: 'Dyuthi Pattu Sarees', url: 'https://www.instagram.com/dyuthipattusarees_collections' },
    { label: 'Dyuthi Handlooms', url: 'https://www.instagram.com/sitarahandlooms' },
  ]
  const SocialLinks = () => (
    <>
      <a
        href="https://www.facebook.com/share/1C63fCvD9i/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook"
        className="p-2 bg-white/10 rounded-md hover:bg-[#C2185B] transition-colors"
      >
        <FacebookIcon />
      </a>
      <InstagramPicker accounts={instaAccounts} />
      <a
        href="https://pin.it/2rNe7YzBY"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Pinterest"
        className="p-2 bg-white/10 rounded-md hover:bg-[#C2185B] transition-colors"
      >
        <PinterestIcon />
      </a>
    </>
  )

  return (
    <footer className="mt-auto">
      {/* Trust strip */}
      <div className="bg-[#FBF3E4] border-y border-amber-100">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trust.map((t) => (
              <div key={t.label} className="flex items-center justify-center gap-2.5 text-center">
                <t.icon className="h-5 w-5 text-[#C2185B] flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="bg-[#3a0d22] text-gray-300">
        <div className="container mx-auto px-4 py-12 max-lg:pt-5">
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <BrandLogo logo={logo} light />
              </Link>
              <p className="text-sm text-gray-400 leading-relaxed max-w-md">
                {data.description}
              </p>
              <div className="mt-4">
                <span className="text-sm font-medium text-white">{data.tagline}</span>
              </div>
            </div>

            {/* Help */}
            <div>
              <h3 className="text-white font-semibold mb-4">Help</h3>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/contact" className="hover:text-[#F4C430] transition-colors">Customer Service</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-[#F4C430] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/refund-policy" className="hover:text-[#F4C430] transition-colors">Refund Policy</Link></li>
                <li><Link href="/shipping-policy" className="hover:text-[#F4C430] transition-colors">Shipping Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-[#F4C430] transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Discover */}
            <div>
              <h3 className="text-white font-semibold mb-4">Discover</h3>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/account" className="hover:text-[#F4C430] transition-colors">My Account</Link></li>
                <li><Link href="/products" className="hover:text-[#F4C430] transition-colors">Shop</Link></li>
                <li><Link href="/about" className="hover:text-[#F4C430] transition-colors">About Us</Link></li>
              </ul>
            </div>

            {/* Keep In Touch */}
            <div>
              <h3 className="text-white font-semibold mb-4">Keep In Touch</h3>
              <div className="flex gap-3">
                <SocialLinks />
              </div>

              <h3 className="text-white font-semibold mt-8 mb-4">We Accept</h3>
              <div className="flex flex-wrap gap-2">
                {cards.map((c) => (
                  <span key={c} className="bg-white text-gray-800 rounded px-2 py-1.5 text-[10px] font-bold tracking-wide">{c}</span>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 text-[#F4C430] flex-shrink-0" />
                  <span>{data.email}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 text-[#F4C430] flex-shrink-0" />
                  <span>{data.phone}</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-[#F4C430] flex-shrink-0" />
                  <span>{data.address}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Mobile footer — accordions */}
          <div className="md:hidden">
            {/* Brand */}
            <div className="mb-5">
              <Link href="/" className="inline-block mb-1 -ml-2">
                <BrandLogo logo={logo} light />
              </Link>
              <p className="text-sm text-gray-400 leading-relaxed mt-1">
                {data.description}
              </p>
              <div className="mt-4">
                <span className="text-sm font-medium text-white">{data.tagline}</span>
              </div>
            </div>

            <FooterAccordion title="Help">
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/contact" className="hover:text-[#F4C430] transition-colors">Customer Service</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-[#F4C430] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/refund-policy" className="hover:text-[#F4C430] transition-colors">Refund Policy</Link></li>
                <li><Link href="/shipping-policy" className="hover:text-[#F4C430] transition-colors">Shipping Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-[#F4C430] transition-colors">Terms of Service</Link></li>
              </ul>
            </FooterAccordion>

            <FooterAccordion title="Discover">
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/account" className="hover:text-[#F4C430] transition-colors">My Account</Link></li>
                <li><Link href="/products" className="hover:text-[#F4C430] transition-colors">Shop</Link></li>
                <li><Link href="/about" className="hover:text-[#F4C430] transition-colors">About Us</Link></li>
              </ul>
            </FooterAccordion>

            {/* Keep In Touch — always shown */}
            <div className="border-b border-white/10 py-4">
              <h3 className="text-white font-semibold text-lg mb-3">Keep In Touch</h3>
              <div className="flex gap-3">
                <SocialLinks />
              </div>
            </div>

            {/* We Accept — always shown */}
            <div className="border-b border-white/10 py-4">
              <h3 className="text-white font-semibold text-lg mb-3">We Accept</h3>
              <div className="flex flex-wrap gap-2">
                {cards.map((c) => (
                  <span key={c} className="bg-white text-gray-800 rounded px-2 py-1.5 text-[10px] font-bold tracking-wide">{c}</span>
                ))}
              </div>
            </div>

            {/* Contact — always shown */}
            <div className="border-b border-white/10 py-4">
              <h3 className="text-white font-semibold text-lg mb-3">Contact</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 text-[#F4C430] flex-shrink-0" />
                  <span>{data.email}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 text-[#F4C430] flex-shrink-0" />
                  <span>{data.phone}</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-[#F4C430] flex-shrink-0" />
                  <span>{data.address}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-400">
            <p>© {new Date().getFullYear()} Dyuthi Pattu Sarees. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy-policy" className="hover:text-[#F4C430]">Privacy Policy</Link>
              <Link href="/terms-of-service" className="hover:text-[#F4C430]">Terms of Service</Link>
              <Link href="/refund-policy" className="hover:text-[#F4C430]">Refund Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
