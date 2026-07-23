import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

// BACKUP of the original single-image hero. To roll back, render <HeroClassic />
// in src/app/page.tsx instead of <HeroCarousel />.
export default function HeroClassic() {
  return (
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
            <Link href="/about">
              <span className="inline-flex items-center gap-2 bg-transparent border border-[#B8860B] text-[#F8E7C5] hover:bg-[#B8860B]/10 font-semibold px-5 py-2.5 rounded-md transition-colors uppercase text-xs tracking-wide">
                Explore Heritage
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
