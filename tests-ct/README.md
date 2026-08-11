# Component Test — Infinite Scroll (no DB, no app changes)

Your Products page is server-rendered and `InfiniteProductsGrid` does infinite
scroll by client-side slicing of an already-loaded array (20 at a time via an
IntersectionObserver). That can't be exercised by network mocking, and it needs
>20 products to trigger. This component test feeds the grid **60 mock items** in
isolation and verifies the paging behaviour directly — no database, no seeding.

`ProductCard` is swapped for a light stub (see `playwright-ct.config.ts` alias)
so we don't drag in next/image, zustand stores or sonner.

## One-time install
```
npm i -D @playwright/experimental-ct-react @vitejs/plugin-react vite
npx playwright install chromium
```

## Run
```
npx playwright test -c playwright-ct.config.ts
```

## What it checks
- Header shows "60 sarees found".
- Exactly 20 cards render initially (BATCH).
- Scrolling the sentinel reveals 20 → 40 → 60.
- Spinner disappears when all items are shown.
- All 60 cards are unique (no duplicates across batches).
- Small-catalog case (8 items): no sentinel, all 8 shown, no infinite scroll.

## Notesnpm run devstubbed —
  confirm the alias in `playwright-ct.config.ts` matches your file path.

