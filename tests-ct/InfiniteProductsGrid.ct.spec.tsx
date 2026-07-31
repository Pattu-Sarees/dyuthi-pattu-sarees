import { test, expect } from '@playwright/experimental-ct-react';
import InfiniteProductsGrid from '@/components/products/InfiniteProductsGrid';
import { mockItems } from './mockItems';

/**
 * PLP-008 (component) — Infinite scroll verified in isolation with 60 items.
 * The grid shows BATCH (20) initially, then reveals +20 each time its sentinel
 * scrolls into view (IntersectionObserver, rootMargin 400px), up to items.length.
 * We assert: initial count, growth on scroll, final count, and NO duplicates.
 */
test.describe('InfiniteProductsGrid — infinite scroll paging', () => {
  test('reveals 20 → 40 → 60 with no duplicate cards', async ({ mount, page }) => {
    const items = mockItems(60);
    const component = await mount(<InfiniteProductsGrid items={items} />);

    // Header reflects the full count.
    await expect(component.getByText('60 sarees found')).toBeVisible();

    const cards = page.locator('[data-testid="pcard"]');

    // Initial batch = 20 (BATCH).
    await expect(cards).toHaveCount(20);

    // Scroll down in steps so each reveal (20 → 40 → 60) is visible, until all show.
    let last = 20;
    for (let i = 0; i < 20; i++) {
      const now = await cards.count();
      if (now >= 60) break;
      // count should only grow, never duplicate/shrink
      expect(now, 'card count never decreases').toBeGreaterThanOrEqual(last);
      last = now;
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(350);
    }

    // Everything revealed; sentinel spinner gone.
    await expect(cards).toHaveCount(60);
    await expect(page.locator('.animate-spin')).toHaveCount(0);

    // No duplicate products across all revealed batches.
    const ids = await cards.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.pid));
    const unique = new Set(ids);
    expect(unique.size, 'all 60 cards are unique').toBe(60);
  });

  test('small catalog (8 items) shows no sentinel and all cards', async ({ mount, page }) => {
    const component = await mount(<InfiniteProductsGrid items={mockItems(8)} />);
    await expect(component.getByText('8 sarees found')).toBeVisible();
    await expect(page.locator('[data-testid="pcard"]')).toHaveCount(8);
    // hasMore is false → no infinite-scroll spinner.
    await expect(page.locator('.animate-spin')).toHaveCount(0);
  });
});
