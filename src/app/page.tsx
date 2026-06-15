import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Truck, ShieldCheck, Award, Gem, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import ProductCard from '@/components/products/ProductCard'

export const metadata = {
  title: 'Dyuthi Pattu Sarees | Handloom Sarees Direct From Weavers',
  description: 'Shop authentic handloom sarees direct from weavers — Kanjivaram, Banarasi, Patola, Chanderi & more. Free shipping all over India.',
}

const categories = [
  { name: 'Kanjivaram Sarees', slug: 'kanjivaram', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500' },
  { name: 'Banarasi Sarees', slug: 'banarasi', img: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500' },
  { name: 'Patola Sarees', slug: 'patola', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=500' },
  { name: 'Chanderi Sarees', slug: 'chanderi', img: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500' },
  { name: 'Silk Sarees', slug: 'silk', img: 'https://images.unsplash.com/photo-1600298882525-05bfbaa4ff45?w=500' },
  { name: 'Cotton Sarees', slug: 'cotton', img: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=500' },
]

const priceRanges = [
  { label: 'Under ₹999', href: '/products?price_max=999' },
  { label: '₹1000 - ₹2999', href: '/products?price_min=1000&price_max=2999' },
  { label: '₹3000 - ₹5999', href: '/products?price_min=3000&price_max=5999' },
  { label: 'Above ₹6000', href: '/products?price_min=6000' },
]

const testimonials = [
  { name: 'Priya S.', location: 'Hyderabad', rating: 5, text: 'The Kanjivaram I ordered is breathtaking. The zari work is exactly as shown. Felt like buying directly from the weaver!' },
  { name: 'Lakshmi R.', location: 'Bengaluru', rating: 5, text: 'Authentic handloom quality at honest prices. Fast delivery and beautiful packaging. Will order again.' },
  { name: 'Anjali M.', location: 'Chennai', rating: 5, text: 'Bought a Banarasi for my sisters wedding. Everyone asked where I got it. Truly premium and elegant.' },
  { name: 'Deepa K.', location: 'Vijayawada', rating: 5, text: 'Love that they source directly from weavers. The cotton sarees are so comfortable and the colors are vivid.' },
]

const trustBadges = [
  { icon: Truck, title: 'Free Shipping', desc: 'All over India' },
  { icon: ShieldCheck, title: 'Secure Payments', desc: 'UPI, Cards & COD' },
  { icon: Award, title: 'Trusted Quality', desc: 'Handloom certified' },
  { icon: Gem, title: 'Premium Collections', desc: 'Direct from weavers' },
]

async function getProducts() {
  const supabase = await createClient()
  const [newArrivals, bestSellers] = await Promise.all([
    supabase.from('products').select('*').eq('is_new_arrival', true).order('created_at', { ascending: false }).limit(8),
    supabase.from('products').select('*').order('review_count', { ascending: false }).limit(8),
  ])
  return {
    newArrivals: (newArrivals.data || []) as Product[],
    bestSellers: (bestSellers.data || []) as Product[],
  }
}

export default async function HomePage() {
  const { newArrivals, bestSellers } = await getProducts()

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative h-[420px] md:h-[560px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600"
          alt="Handloom sarees"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-xl text-white">
              <p className="text-[#F4C430] font-medium tracking-widest uppercase text-sm mb-3">Direct From Weavers</p>
              <h1 className="text-4xl md:text-6xl font-bold mb-5 leading-tight">Timeless Indian Elegance</h1>
              <p className="text-lg text-gray-100 mb-8 leading-relaxed">
                Discover exquisite handloom silk sarees, woven with centuries-old craftsmanship and sourced directly from master weavers across India.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/products">
                  <span className="inline-flex items-center gap-2 bg-[#C2185B] hover:bg-[#a01049] text-white font-semibold px-7 py-3.5 rounded-md transition-colors uppercase text-sm tracking-wide">
                    Shop Premium Sarees <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
                <Link href="/products?is_new_arrival=true">
                  <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/40 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-md transition-colors uppercase text-sm tracking-wide">
                    Explore Heritage
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category tiles */}
      <section className="container mx-auto px-4 py-14">
        <SectionHeading title="Shop by Category" subtitle="Explore our curated handloom collections" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="group">
              <div className="relative aspect-square rounded-xl overflow-hidden shadow-sm">
                <Image src={cat.img} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:768px) 50vw, 16vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                  <span className="text-white text-sm font-semibold leading-tight">{cat.name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <SectionHeading title="New Arrivals" subtitle="Fresh from the loom" viewAllHref="/products?is_new_arrival=true" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Shop by Price */}
      <section className="bg-[#FBF3E4] py-14 mt-6">
        <div className="container mx-auto px-4">
          <SectionHeading title="Shop by Price" subtitle="Find the perfect saree for your budget" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {priceRanges.map((r) => (
              <Link key={r.href} href={r.href}>
                <div className="bg-white rounded-xl border border-amber-100 p-8 text-center hover:shadow-md hover:border-[#C2185B] transition-all group">
                  <p className="text-xl font-bold text-gray-900 group-hover:text-[#C2185B] transition-colors">{r.label}</p>
                  <p className="text-sm text-gray-500 mt-2 inline-flex items-center gap-1">Shop now <ArrowRight className="h-3.5 w-3.5" /></p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="container mx-auto px-4 py-14">
          <SectionHeading title="Best Sellers" subtitle="Loved by thousands of customers" viewAllHref="/products?sort=popular" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="bg-gray-50 py-14">
        <div className="container mx-auto px-4">
          <SectionHeading title="Loved by Our Customers" subtitle="Real reviews from happy saree lovers" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map((s) => <Star key={s} className={`h-4 w-4 ${s <= t.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />)}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {trustBadges.map((b) => (
            <div key={b.title} className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="p-3 bg-[#FBF3E4] rounded-full flex-shrink-0">
                <b.icon className="h-6 w-6 text-[#C2185B]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{b.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function SectionHeading({ title, subtitle, viewAllHref }: { title: string; subtitle?: string; viewAllHref?: string }) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-gray-500 mt-1.5 text-sm">{subtitle}</p>}
        <div className="h-1 w-16 bg-[#C2185B] rounded-full mt-3" />
      </div>
      {viewAllHref && (
        <Link href={viewAllHref} className="text-sm font-medium text-[#C2185B] hover:text-[#a01049] inline-flex items-center gap-1 whitespace-nowrap">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}
