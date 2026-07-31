import * as React from 'react';

/**
 * Lightweight stand-in for the real ProductCard so component tests can focus on
 * the InfiniteProductsGrid paging logic without pulling in next/image, zustand
 * stores or sonner. Renders one identifiable node per card.
 */
export default function ProductCard({ product }: { product: { id: string; name?: string } }) {
  // Give each card real height so the grid is tall enough that infinite scroll
  // actually stages (20 → +20 …) instead of revealing everything at once.
  return (
    <div
      data-testid="pcard"
      data-pid={product.id}
      style={{ minHeight: 280, border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {product.name ?? product.id}
    </div>
  );
}
