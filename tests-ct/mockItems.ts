import { DisplayItem } from '@/components/products/displayItems';

/** Build N unique DisplayItems (one image each) with distinct product ids. */
export function mockItems(n: number): DisplayItem[] {
  return Array.from({ length: n }, (_, i) => ({
    key: `mock-${i + 1}-0`,
    // Only id/name are read by the stub; cast keeps us free of the full Product type.
    product: { id: `mock-${i + 1}`, name: `Mock Saree #${i + 1}`, price: 1000 + i } as any,
    image: '',
    imageIndex: 0,
    isNewArrival: false,
    isBestSeller: false,
  }));
}
