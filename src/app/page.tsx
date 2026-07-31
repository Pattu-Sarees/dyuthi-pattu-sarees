import { getFeaturedProducts, getCategoriesCached, getTestimonialsCached, getCollectionProducts } from '@/lib/storefront-data'
import CollectionsGrid from '@/components/products/CollectionsGrid'
import FeaturedCollections from '@/components/products/FeaturedCollections'
import Testimonials from '@/components/Testimonials'
import { toDisplayItems } from '@/components/products/displayItems'
import CategoryCarousel from '@/components/CategoryCarousel'
import HeroCarousel from '@/components/HeroCarousel'
import { getHomepageConfig } from '@/lib/homepage'
import { resolveHeroSlides } from '@/lib/hero'
// Rollback: import HeroClassic from '@/components/HeroClassic' and render <HeroClassic /> below.

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

// Public storefront reads are cached in @/lib/storefront-data (60s revalidate)
// so navigating back to home doesn't re-query Supabase every time.

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category: selectedCategory } = await searchParams
  // Fire all storefront reads in parallel instead of awaiting them one-by-one
  // (was a 5-deep request waterfall). getHomepageConfig() is React.cached, so
  // this call and the one in the root layout share a single DB round-trip.
  const [{ newArrivals, bestSellers, onSale }, categoriesData, collectionProducts, testimonials, homeConfig] = await Promise.all([
    getFeaturedProducts(),
    getCategoriesCached(),
    getCollectionProducts(selectedCategory),
    getTestimonialsCached(),
    getHomepageConfig(),
  ])
  const categories = categoriesData && categoriesData.length ? categoriesData : DEFAULT_CATEGORIES
  const heroSlides = resolveHeroSlides(homeConfig.hero?.data)

  const selectedName = categories.find((c) => c.slug === selectedCategory)?.name

  return (
    <div className="bg-[#FFFDF7]">
      {/* Hero — auto-playing carousel. Rollback: replace with <HeroClassic /> */}
      <HeroCarousel slides={heroSlides} />

      {/* Category cards with heading */}
      <section className="container mx-auto px-4 pt-8">
        <div className="md:w-fit max-w-full mx-auto md:px-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>Explore Heritage Collection</h2>
          <CategoryCarousel categories={categories} selectedSlug={selectedCategory} />
        </div>
      </section>

      {/* Our Collections — all sarees, or filtered by selected category */}
      {(collectionProducts.length > 0 || selectedCategory) && (
        <section id="our-collections" className="container mx-auto px-4 pt-8 scroll-mt-[168px] md:scroll-mt-28">
          <div className="flex items-center justify-center gap-3 mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-[#4E1E24]" style={{ fontFamily: 'var(--font-cormorant-upright), serif' }}>
              {selectedName ? `${selectedName}` : 'Our Collection'}
            </h2>
          </div>
          {collectionProducts.length > 0 ? (
            <CollectionsGrid
              items={toDisplayItems(collectionProducts)}
              viewAllHref={selectedCategory ? `/products?category=${selectedCategory}` : '/products'}
            />
          ) : (
            <p className="text-center text-gray-500 py-10">No products in this category yet.</p>
          )}
        </section>
      )}

      {/* New Arrivals / Best Sellers / On Sale — switchable via dropdown */}
      {(newArrivals.length > 0 || bestSellers.length > 0 || onSale.length > 0) && (
        <section className="container mx-auto px-4 pt-8 pb-10">
          <FeaturedCollections
            newArrivals={toDisplayItems(newArrivals).filter((it) => it.isNewArrival)}
            bestSellers={toDisplayItems(bestSellers).filter((it) => it.isBestSeller)}
            onSale={toDisplayItems(onSale.filter((p) => p.original_price != null && p.original_price > p.price))}
          />
        </section>
      )}

      {/* Loved by Our Customers — testimonials */}
      {testimonials.length > 0 && <Testimonials items={testimonials} />}
    </div>
  )
}
