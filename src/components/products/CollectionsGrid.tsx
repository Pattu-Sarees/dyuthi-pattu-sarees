import Link from 'next/link'
import { Star, Sparkles, Flame } from 'lucide-react'
import ProductCard from './ProductCard'
import { DisplayItem } from './displayItems'

const LIMIT = 10

export default function CollectionsGrid({ items, viewAllHref = '/products', onlyBadge }: { items: DisplayItem[]; viewAllHref?: string; onlyBadge?: 'best' | 'new' | 'sale' }) {
  const shown = items.slice(0, LIMIT)

  return (
    <div>
      {/* Badge legend — mobile only, shown for mixed listings where cards carry
          icon-only badges. */}
      {!onlyBadge && (
        <div className="flex lg:hidden flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-[11px] text-gray-600">
          <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-[#B8860B] fill-current" /> Best Seller</span>
          <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-[#2E8B57] fill-current" /> New</span>
          <span className="inline-flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-[#C73B75] fill-current" /> On Sale</span>
        </div>
      )}
      {/* flex-wrap + justify-center so a partial last row (e.g. 3 of 5) centers
          instead of hugging the left. Widths match the old 2/3/5-column grid. */}
      <div className="flex flex-wrap justify-center gap-4">
        {shown.map((item) => (
          <div
            key={item.key}
            className="w-[calc((100%-1rem)/2)] sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/5)]"
          >
            <ProductCard
              product={item.product}
              image={item.image}
              imageIndex={item.imageIndex}
              isNewArrival={item.isNewArrival}
              isBestSeller={item.isBestSeller}
              onlyBadge={onlyBadge}
            />
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <div className="flex justify-center mt-3">
          <Link
            href={viewAllHref}
            className="inline-flex items-center justify-center bg-[#AD1457] hover:bg-[#880E4F] text-white font-semibold px-8 py-3 rounded-full shadow transition-colors"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  )
}
