import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import ProductCard from '@/components/products/ProductCard'
import CategoryCarousel from '@/components/CategoryCarousel'

export const metadata = {
  title: 'Dyuthi Pattu Sarees | Handloom Sarees Direct From Weavers',
  description: 'Shop authentic handloom sarees direct from weavers — Kanjivaram, Banarasi, Patola, Chanderi & more. Free shipping all over India.',
}

const DEFAULT_CATEGORIES = [
  { name: 'Kanjivaram Sarees', slug: 'kanjivaram', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500' },
  { name: 'Banarasi Sarees', slug: 'banarasi', img: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500' },
  { name: 'Patola Sarees', slug: 'patola', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=500' },
  { name: 'Chanderi Sarees', slug: 'chanderi', img: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500' },
  { name: 'Silk Sarees', slug: 'silk', img: 'https://images.unsplash.com/photo-1600298882525-05bfbaa4ff45?w=500' },
  { name: 'Cotton Sarees', slug: 'cotton', img: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=500' },
]

async function getCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true })
  if (error || !data || data.length === 0) return DEFAULT_CATEGORIES
  return data.map((c) => ({ name: c.name, slug: c.slug, img: c.image }))
}

const priceRanges = [
  { label: 'Under ₹999', href: '/products?price_max=999' },
  { label: '₹1000 - ₹2999', href: '/products?price_min=1000&price_max=2999' },
  { label: '₹3000 - ₹5999', href: '/products?price_min=3000&price_max=5999' },
  { label: 'Above ₹6000', href: '/products?price_min=6000' },
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
  const categories = await getCategories()

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-[#4A1F1F] overflow-hidden">
        {/* Image — full-bleed right half on desktop, top on mobile */}
        <div className="relative h-52 sm:h-64 md:absolute md:inset-y-0 md:right-0 md:h-full md:w-1/2">
          <Image
            src="/hero.png"
            alt="Artisan weaving a handloom saree"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Text */}
        <div className="container mx-auto px-4 relative">
          <div className="md:w-1/2 md:pr-10 py-10 md:py-14 max-w-lg flex flex-col justify-center">
            <p className="font-medium tracking-widest uppercase text-xs mb-2 text-[#D9B36C]">A Legacy Woven in Silk</p>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 leading-snug text-[#F8E7C5]">Treasures from Timeless Traditions</h1>
            <p className="text-sm md:text-[15px] mb-6 leading-relaxed text-[#E8DCC7]">
              Discover authentic handloom sarees born from generations of artistry and dedication, where every weave reflects India&apos;s rich cultural heritage. Crafted by skilled artisans, each piece embodies timeless tradition, exceptional craftsmanship, and the enduring legacy of handloom weaving.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products">
                <span className="inline-flex items-center gap-2 bg-[#B8860B] hover:bg-[#9c7209] text-white font-semibold px-5 py-2.5 rounded-md transition-colors uppercase text-xs tracking-wide">
                  Shop Premium Sarees <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <Link href="/products?is_new_arrival=true">
                <span className="inline-flex items-center gap-2 bg-transparent border border-[#B8860B] text-[#F8E7C5] hover:bg-[#B8860B]/10 font-semibold px-5 py-2.5 rounded-md transition-colors uppercase text-xs tracking-wide">
                  Explore Heritage
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category cards with lotus arch frame */}
      <section className="container mx-auto px-4 py-14">
        <CategoryCarousel categories={categories} />
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
