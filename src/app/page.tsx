import Link from 'next/link'
import { ArrowRight, Star, Shield, Truck, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const categories = [
  { name: 'Silk Sarees', slug: 'silk', emoji: '✨', desc: 'Pure & blended silk' },
  { name: 'Cotton Sarees', slug: 'cotton', emoji: '🌿', desc: 'Breathable & comfortable' },
  { name: 'Banarasi', slug: 'banarasi', emoji: '👑', desc: 'Rich Varanasi weaves' },
  { name: 'Kanjivaram', slug: 'kanjivaram', emoji: '💎', desc: 'South Indian heritage' },
  { name: 'Chanderi', slug: 'chanderi', emoji: '🌸', desc: 'Sheer & elegant' },
  { name: 'Patola', slug: 'patola', emoji: '🎨', desc: 'Gujarat double ikat' },
]

const features = [
  { icon: Shield, title: 'Handloom Certified', desc: 'All products certified authentic by the Handloom Board' },
  { icon: Truck, title: 'Free Shipping', desc: 'Free shipping on all orders above ₹999 across India' },
  { icon: RefreshCw, title: 'Easy Returns', desc: '7-day hassle-free returns and exchanges' },
  { icon: Star, title: 'Master Weavers', desc: 'Sourced directly from skilled artisan families' },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#FBF3E4]">
        <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(120,53,15,.6) 40px, rgba(120,53,15,.6) 80px)'}}>
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-amber-400 text-amber-900 border-0">New Collection 2024</Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-5 leading-tight text-rose-950">
              Drape Yourself in
              <span className="block text-amber-600">India&apos;s Heritage</span>
            </h1>
            <p className="text-lg md:text-xl text-rose-900/70 mb-8 leading-relaxed">
              Handpicked handloom sarees direct from master weavers across India. Every thread tells a story of centuries-old craftsmanship.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products">
                <Button size="lg" className="bg-rose-700 hover:bg-rose-800 text-white font-semibold">
                  Shop Collection <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/products?is_new_arrival=true">
                <Button size="lg" variant="outline" className="border-rose-300 text-rose-800 hover:bg-rose-50 bg-transparent">
                  New Arrivals
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-rose-900/70">
              <div className="flex items-center gap-1"><Star className="h-4 w-4 text-amber-500 fill-amber-500" /> <span>4.9/5 from 2,400+ reviews</span></div>
              <div className="hidden sm:block">•</div>
              <div>500+ unique designs</div>
              <div className="hidden sm:block">•</div>
              <div>Free shipping ₹999+</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
          <p className="text-gray-500 mt-2">Explore our curated collection of handloom sarees</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/products?category=${cat.slug}`}>
              <div className="group bg-white rounded-2xl p-5 text-center border border-gray-100 shadow-sm hover:shadow-md hover:border-rose-200 transition-all duration-200 cursor-pointer">
                <div className="text-4xl mb-3">{cat.emoji}</div>
                <h3 className="font-semibold text-gray-900 text-sm group-hover:text-rose-700 transition-colors">{cat.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-rose-50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm">
                <div className="p-2 bg-rose-100 rounded-lg flex-shrink-0">
                  <f.icon className="h-5 w-5 text-rose-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{f.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-gray-900 to-rose-950 rounded-2xl p-10 text-white text-center">
          <h2 className="text-3xl font-bold mb-3">Support Indian Artisans</h2>
          <p className="text-gray-300 mb-6 max-w-lg mx-auto">
            Every purchase directly supports weaver families and helps preserve India's textile heritage for future generations.
          </p>
          <Link href="/products">
            <Button className="bg-amber-400 hover:bg-amber-300 text-amber-900 font-semibold" size="lg">
              Browse All Sarees <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
