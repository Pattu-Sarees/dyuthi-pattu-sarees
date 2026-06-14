import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <span className="text-2xl font-bold text-white">Vibha</span>
              <p className="text-xs text-gray-400 tracking-widest uppercase mt-0.5">Handloom Sarees</p>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Celebrating India's rich textile heritage. Every saree tells a story of craftsmanship, tradition, and artistry.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-rose-700 transition-colors text-xs font-bold">IG</a>
              <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-rose-700 transition-colors text-xs font-bold">FB</a>
              <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-rose-700 transition-colors text-xs font-bold">TW</a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-rose-400 transition-colors">All Sarees</Link></li>
              <li><Link href="/products?category=silk" className="hover:text-rose-400 transition-colors">Silk Sarees</Link></li>
              <li><Link href="/products?category=cotton" className="hover:text-rose-400 transition-colors">Cotton Sarees</Link></li>
              <li><Link href="/products?category=banarasi" className="hover:text-rose-400 transition-colors">Banarasi Sarees</Link></li>
              <li><Link href="/products?is_new_arrival=true" className="hover:text-rose-400 transition-colors">New Arrivals</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Customer Care</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/orders" className="hover:text-rose-400 transition-colors">Track Order</Link></li>
              <li><Link href="/account" className="hover:text-rose-400 transition-colors">My Account</Link></li>
              <li><a href="#" className="hover:text-rose-400 transition-colors">Returns & Exchanges</a></li>
              <li><a href="#" className="hover:text-rose-400 transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-rose-400 transition-colors">Size Guide</a></li>
              <li><a href="#" className="hover:text-rose-400 transition-colors">FAQs</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-rose-400 flex-shrink-0" />
                <span>support@vibhasarees.com</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-rose-400 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-rose-400 flex-shrink-0" />
                <span>Varanasi, Uttar Pradesh, India</span>
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-xs text-gray-500">We accept</p>
              <div className="flex gap-2 mt-2">
                <span className="bg-gray-800 rounded px-2 py-1 text-xs">UPI</span>
                <span className="bg-gray-800 rounded px-2 py-1 text-xs">Card</span>
                <span className="bg-gray-800 rounded px-2 py-1 text-xs">NetBanking</span>
                <span className="bg-gray-800 rounded px-2 py-1 text-xs">COD</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© 2024 Vibha Handloom Sarees. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-rose-400">Privacy Policy</a>
            <a href="#" className="hover:text-rose-400">Terms of Service</a>
            <a href="#" className="hover:text-rose-400">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
