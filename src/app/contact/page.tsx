import { Home, Phone, Clock } from 'lucide-react'
import PageBanner from '@/components/layout/PageBanner'
import ContactForm from '@/components/ContactForm'

export const metadata = { title: 'Contact Us | Dyuthi Pattu Sarees' }

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent('Gandhi Rd, Gadiyaram Vari Veedhi, Bandla Metla, Ongole, Andhra Pradesh 523001')

export default function ContactPage() {
  return (
    <div className="bg-[#FFFDF7]">
      <PageBanner
        title={
          <span className="inline-flex items-center gap-2">
            <Phone className="h-6 w-6 md:h-7 md:w-7" /> Contact
          </span>
        }
        subtitle="Need assistance with your order? We're happy to help"
      />

      <div className="container mx-auto px-4 py-14">
        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Address */}
          <InfoCard icon={Home} title="Address">
            <p className="text-gray-500 text-sm leading-relaxed">
              Gandhi Rd, Gadiyaram Vari Veedhi,<br />
              Bandla Metla, Ongole,<br />
              Andhra Pradesh — 523001
            </p>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-sm font-semibold text-[#C2185B] hover:text-[#a01049] transition-colors"
            >
              View on Map →
            </a>
          </InfoCard>

          {/* Information */}
          <InfoCard icon={Phone} title="Information">
            <p className="text-gray-500 text-sm leading-relaxed">
              Reach out for queries, orders, or to know about our latest collections.
            </p>
            <div className="mt-4 space-y-1">
              <p>
                <a href="tel:+917075799039" className="text-sm font-semibold text-[#C2185B] hover:text-[#a01049] transition-colors">
                  +91 70757 99039
                </a>
                <span className="text-[#C2185B] font-semibold text-sm">, </span>
                <a href="tel:+917075792599" className="text-sm font-semibold text-[#C2185B] hover:text-[#a01049] transition-colors">
                  +91 70757 92599
                </a>
              </p>
              <a href="mailto:dyuthipattusarees@gmail.com" className="block text-sm font-semibold text-[#C2185B] hover:text-[#a01049] transition-colors">
                dyuthipattusarees@gmail.com
              </a>
            </div>
          </InfoCard>

          {/* Hours */}
          <InfoCard icon={Clock} title="We're Open">
            <p className="text-gray-500 text-sm leading-relaxed">
              Visit our store or shop online anytime. We&apos;re here to help you find the perfect saree.
            </p>
            <p className="mt-4 text-sm font-semibold text-[#C2185B]">Mon – Sat · 10 AM — 7 PM</p>
          </InfoCard>
        </div>

        {/* Form */}
        <div className="max-w-3xl mx-auto mt-12">
          <ContactForm />
        </div>
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-8 text-center flex flex-col items-center">
      <Icon className="h-9 w-9 text-[#C2185B] mb-4" />
      <h3 className="text-sm font-bold tracking-widest uppercase text-gray-700">{title}</h3>
      <div className="h-0.5 w-8 bg-[#C2185B] rounded-full my-3" />
      {children}
    </div>
  )
}
