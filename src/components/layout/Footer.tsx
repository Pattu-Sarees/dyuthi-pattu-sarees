import Link from 'next/link'
import { Mail, Phone, MapPin, Truck, ShieldCheck, Award, Gem } from 'lucide-react'

const trust = [
  { icon: Truck, label: 'Free Shipping' },
  { icon: ShieldCheck, label: 'Secure Payments' },
  { icon: Award, label: 'Trusted Quality' },
  { icon: Gem, label: 'Premium Collections' },
]

export default function Footer() {
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
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <span className="text-2xl font-bold text-white">Dyuthi Pattu Sarees</span>
                <p className="text-xs text-[#F4C430] tracking-widest uppercase mt-1">Direct From Weavers</p>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-md">
                We are a handloom sarees &amp; dresses seller located in Telangana State, India.
                Every saree is sourced directly from master weavers — celebrating India&apos;s rich
                textile heritage, one thread at a time.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-lg">🇮🇳</span>
                <span className="text-sm font-medium text-white">Proudly Made in India</span>
              </div>
              <div className="flex gap-3 mt-5">
                <a href="#" className="px-3 py-2 bg-white/10 rounded-full hover:bg-[#C2185B] transition-colors text-xs font-bold">IG</a>
                <a href="#" className="px-3 py-2 bg-white/10 rounded-full hover:bg-[#C2185B] transition-colors text-xs font-bold">FB</a>
                <a href="#" className="px-3 py-2 bg-white/10 rounded-full hover:bg-[#C2185B] transition-colors text-xs font-bold">WA</a>
              </div>
            </div>

            {/* Help */}
            <div>
              <h3 className="text-white font-semibold mb-4">Help</h3>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-[#F4C430] transition-colors">Customer Service</a></li>
                <li><a href="#" className="hover:text-[#F4C430] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#F4C430] transition-colors">Refund Policy</a></li>
                <li><a href="#" className="hover:text-[#F4C430] transition-colors">Shipping Policy</a></li>
                <li><a href="#" className="hover:text-[#F4C430] transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            {/* Discover */}
            <div>
              <h3 className="text-white font-semibold mb-4">Discover</h3>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/account" className="hover:text-[#F4C430] transition-colors">My Account</Link></li>
                <li><Link href="/products" className="hover:text-[#F4C430] transition-colors">Shop</Link></li>
                <li><Link href="/orders" className="hover:text-[#F4C430] transition-colors">Track Order</Link></li>
                <li><Link href="/products?is_new_arrival=true" className="hover:text-[#F4C430] transition-colors">New Arrivals</Link></li>
                <li><Link href="/products?sort=popular" className="hover:text-[#F4C430] transition-colors">Best Sellers</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 text-[#F4C430] flex-shrink-0" />
                  <span>support@dyuthipattusarees.com</span>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 text-[#F4C430] flex-shrink-0" />
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-[#F4C430] flex-shrink-0" />
                  <span>Telangana State, India</span>
                </li>
              </ul>
              <div className="mt-4">
                <p className="text-xs text-gray-500">We accept</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-white/10 rounded px-2 py-1 text-xs">UPI</span>
                  <span className="bg-white/10 rounded px-2 py-1 text-xs">Card</span>
                  <span className="bg-white/10 rounded px-2 py-1 text-xs">NetBanking</span>
                  <span className="bg-white/10 rounded px-2 py-1 text-xs">COD</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-400">
            <p>© {new Date().getFullYear()} Dyuthi Pattu Sarees. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-[#F4C430]">Privacy Policy</a>
              <a href="#" className="hover:text-[#F4C430]">Terms of Service</a>
              <a href="#" className="hover:text-[#F4C430]">Refund Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
