import { Mail, Phone, MapPin, Clock, Truck } from 'lucide-react'
import PageBanner from '@/components/layout/PageBanner'

export const metadata = { title: 'Contact Us | Dyuthi Pattu Sarees' }

const details = [
  { icon: Mail, label: 'Email', value: 'support@dyuthipattusarees.com', href: 'mailto:support@dyuthipattusarees.com' },
  { icon: Phone, label: 'Phone / WhatsApp', value: '+91 98765 43210', href: 'tel:+919876543210' },
  { icon: MapPin, label: 'Location', value: 'Telangana State, India' },
  { icon: Clock, label: 'Hours', value: 'Mon – Sat, 10 AM – 7 PM IST' },
]

export default function ContactPage() {
  return (
    <div className="bg-white">
      <PageBanner
        title="Contact Us"
        subtitle="We're here to help! Have a question about our collections or need assistance? We'd love to hear from you. ✨"
      />

      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Details */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Get in touch</h2>
            <div className="space-y-4">
              {details.map((d) => (
                <div key={d.label} className="flex items-start gap-4 bg-[#FBF3E4] rounded-xl p-4">
                  <div className="p-2.5 bg-white rounded-full flex-shrink-0">
                    <d.icon className="h-5 w-5 text-[#C2185B]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{d.label}</p>
                    {d.href ? (
                      <a href={d.href} className="text-gray-900 font-medium hover:text-[#C2185B] transition-colors">{d.value}</a>
                    ) : (
                      <p className="text-gray-900 font-medium">{d.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-gray-600 bg-green-50 rounded-xl p-4">
              <Truck className="h-5 w-5 text-green-600 flex-shrink-0" />
              Free shipping all over India on every order.
            </div>
          </div>

          {/* Form */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Send us a message</h2>
            <form className="space-y-4" action="mailto:support@dyuthipattusarees.com" method="post" encType="text/plain">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                  <input name="name" required className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input name="phone" className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]" placeholder="Mobile number" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" name="email" required className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea name="message" required rows={5} className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B]" placeholder="How can we help?" />
              </div>
              <button type="submit" className="w-full bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold py-3 rounded-md transition-colors uppercase tracking-wide text-sm">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
