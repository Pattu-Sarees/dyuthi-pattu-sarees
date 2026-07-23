'use client'

import { useEffect, useRef, useState } from 'react'
import ProductCard from './ProductCard'
import { DisplayItem } from './displayItems'

const BATCH = 20

export default function InfiniteProductsGrid({ items, onlyBadge }: { items: DisplayItem[]; onlyBadge?: 'best' | 'new' | 'sale' }) {
  const [visible, setVisible] = useState(Math.min(BATCH, items.length))
  const sentinelRef = useRef<HTMLDivElement>(null)

  const hasMore = visible < items.length

  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible((v) => Math.min(v + BATCH, items.length))
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, items.length])

  return (
    <div>
      <p className="text-sm text-gray-500 mb-2 md:mb-4">{items.length} sarees found</p>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.slice(0, visible).map((item) => (
          <ProductCard
            key={item.key}
            product={item.product}
            image={item.image}
            imageIndex={item.imageIndex}
            isNewArrival={item.isNewArrival}
            isBestSeller={item.isBestSeller}
            onlyBadge={onlyBadge}
          />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <div className="h-6 w-6 rounded-full border-2 border-rose-200 border-t-rose-600 animate-spin" />
        </div>
      )}
    </div>
  )
}
