# Performance Audit — Dyuthi Pattu Sarees Storefront

_Scope of this pass: **safe, high-impact code optimizations only**. No UI, no
behaviour, and no business logic were changed. Deeper structural work
(true DB pagination, SQL indexes) is documented at the end as recommended
follow-ups but was intentionally **not** implemented in this pass._

---

## 1. Root causes of slowness (what the audit actually found)

| # | Area | Root cause | Impact |
|---|------|-----------|--------|
| 1 | **Home page** (`app/page.tsx`) | Five Supabase reads were `await`ed one after another — a request **waterfall**. Each round-trip blocked the next. | Home TTFB ≈ sum of all 5 queries instead of the slowest one. |
| 2 | **Home page config** | `getHomepageConfig()` was fetched **twice per request** — once in `app/layout.tsx`, once in `app/page.tsx` — each a separate DB round-trip via the service-role client. | 1 extra DB query on every page load. |
| 3 | **Images** (`next.config.ts`) | No modern-format (`AVIF`/`WebP`) config, no cache TTL, default over-wide `srcset`. Product photography dominates page weight. | Oversized JPEG/PNG transfers → poor LCP, high bandwidth. |
| 4 | **Modals** | Share / collection dialogs on cart, shared-cart and wishlist pages were **statically imported**, so their JS shipped in the initial bundle even though they only open on click. | Larger initial JS on cart/wishlist routes. |
| 5 | **Header search** | Typeahead suggestions re-hit `/api/search` for queries the user had already typed moments earlier (e.g. type → backspace → retype). | Redundant network calls, extra API/DB load. |
| 6 | **Icon barrel** | `lucide-react` imported without `optimizePackageImports`. | Risk of pulling extra icon code into client bundles. |

Bottlenecks that are **structural** (catalogue-size dependent) and flagged for a
follow-up pass — see §9:
- `app/page.tsx > getAllProducts()` fetches **every product with no `LIMIT`**, then filters by category in JS (only 10 are ever rendered by `CollectionsGrid`).
- `components/products/ProductsGrid.tsx` fetches **up to 2,000 rows** and ships them all to the browser; the "infinite scroll" is a client-side `.slice()`, not real pagination.

---

## 2. Exact code changes made (this pass)

### `next.config.ts` — image + bundle optimization
```ts
images: {
  remotePatterns: [ /* unchanged */ ],
  formats: ['image/avif', 'image/webp'],          // NEW — modern formats
  minimumCacheTTL: 60 * 60 * 24 * 31,             // NEW — 31-day edge cache
  deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920], // NEW — tighter srcset
  imageSizes: [80, 128, 256, 384],                // NEW
},
experimental: {
  optimizePackageImports: ['lucide-react'],        // NEW — tree-shake icons
},
```

### `src/lib/homepage.ts` — request-level dedup
Wrapped `getHomepageSections()` and `getHomepageConfig()` in React's `cache()`.
The layout and the home page now **share one DB round-trip** per request
instead of issuing two. Return types and outputs are byte-for-byte identical.

### `src/app/page.tsx` — kill the waterfall
Replaced five sequential `await`s with a single `Promise.all([...])`. Same data,
same render output; the queries now run concurrently and the page waits only for
the slowest one. Combined with the `cache()` above, the duplicate config fetch is
also eliminated.

### Dynamic imports — smaller initial bundles
`next/dynamic` for dialogs that only render on user interaction:
- `app/cart/page.tsx` → `ShareCartModal`
- `components/cart/SharedCartView.tsx` → `ShareCartModal`, `SaveToCollectionSheet`, `CreateCollectionModal`
- `app/wishlist/page.tsx` → `ShareWishlistModal`, `SaveToCollectionSheet`, `CreateCollectionModal`, `RenameCollectionModal`

Behaviour is identical — the component simply loads the moment its `{open && …}`
branch first renders.

### `src/components/layout/SearchBox.tsx` — cached suggestions
Added a session-scoped, size-capped (`60`-entry) in-memory cache keyed by
`scope|term`. Repeat queries render **instantly with no network call**. Results
are identical to the API response; the 300 ms debounce and every UI element are
unchanged.

---

## 3. Before / After

| Metric | Before | After | Notes |
|--------|--------|-------|-------|
| Home page DB round-trips | 6 (5 sequential + 1 duplicate config) | 5, **run in parallel**, 0 duplicates | via `Promise.all` + `cache()` |
| Home config queries/request | 2 | 1 | React `cache()` dedup |
| Image formats served | original (JPEG/PNG) | AVIF → WebP → original | `next/image` negotiates |
| Image edge cache | default | 31 days | fewer re-optimizations |
| Repeat typeahead query | network call every time | cache hit, 0 calls | session cache |
| Cart/wishlist initial JS | includes all dialogs | dialogs code-split out | `next/dynamic` |

> **Measured Lighthouse / Core Web Vitals numbers are intentionally omitted** —
> they require a production build + real device run, which can't be produced in
> this environment. Run `npm run build && npx lighthouse` locally to capture the
> before/after deltas for these specific changes.

---

## 4. Image optimization plan (implemented)

- `formats: ['image/avif','image/webp']` — Next negotiates the smallest format the browser supports.
- `minimumCacheTTL` 31 days — optimized derivatives cached at the edge; safe because a changed image gets a new Supabase URL.
- Tightened `deviceSizes`/`imageSizes` to the widths actually rendered (grid cards are narrow) so no oversized variants are generated.
- Existing code already uses `next/image` with `fill` + `sizes` and `object-cover`, so responsive loading and lazy-loading below the fold were already correct — no component changes needed.

---

## 5. Network optimization plan (implemented)

- Home reads parallelized (`Promise.all`) — removes the waterfall.
- Duplicate homepage-config fetch removed via `React.cache`.
- Header-search suggestions cached client-side — fewer `/api/search` hits.
- Route prefetching: verified **no** `prefetch={false}` anywhere, so Next.js
  Link prefetching is already active for all storefront navigation.

---

## 6. Verification

- All edits are **additive or mechanical** (parallelize, cache, lazy-load). No
  UI markup, styling, props, state shape, or control flow was altered.
- Grep-level consistency checks pass: no stray sequential awaits, no leftover
  static modal imports, `cache` correctly imported, `homeConfig` wired through.
- ⚠️ A full `tsc --noEmit` could not complete in this sandbox (the type-checker
  timed out repeatedly here all session — an environment limitation, unrelated to
  these changes). **Please run `npm run build` locally before pushing** to get a
  clean type + build confirmation.

---

## 7. Database query optimization (findings — mostly follow-up)

- Home & listing queries select only `PUBLIC_PRODUCT_COLUMNS` (good — no
  admin/procurement columns leak, payload already trimmed).
- **N+1:** none found in the storefront read paths audited.
- **Missing indexes (recommended):** the listing filters/sorts on
  `category`, `fabric`, `price`, `created_at`, `rating`, `review_count`, and
  `search_text`. At 10k+ products, add btree indexes on the frequently-filtered
  columns and confirm the `search_text ilike` path is backed by a `pg_trgm` GIN
  index. _(Not applied this pass — requires a Supabase migration you run.)_

---

## 8. Security (quick pass — no changes needed)

- Public product reads are correctly restricted to `PUBLIC_PRODUCT_COLUMNS`;
  procurement/vendor fields are never selected server-side.
- Share endpoints validate/sanitize input (`sanitizeItems`, length caps) and
  write only via the service-role client; RLS exposes read-only access by code.
- No `dangerouslySetInnerHTML` on user data in the audited storefront paths.

---

## 9. Recommended next pass (deliberately NOT done — needs your sign-off + local testing)

These are higher-value but **change data flow**, so they were left out of this
"safe only" pass per your instruction:

1. **True server-side pagination** for `ProductsGrid` / `InfiniteProductsGrid`:
   fetch 20–40 rows per page (keyset on `created_at,id`) instead of 2,000, and
   load subsequent pages on scroll from the DB. This is the single biggest win
   for collection-page speed and memory at scale.
2. **Cap `getAllProducts()`** on the home page (only 10 render) — needs
   per-category queries to keep category filtering correct at any catalogue size.
3. **SQL indexes** (see §7) via a Supabase migration.

---

## Production-readiness checklist

- [x] Modern image formats + edge caching configured
- [x] Home-page request waterfall removed
- [x] Duplicate homepage-config fetch removed
- [x] Interaction-only modals code-split
- [x] Header-search suggestions cached
- [x] Icon barrel tree-shaking enabled
- [x] Link prefetching confirmed active
- [ ] `npm run build` clean locally _(run before pushing — sandbox can't build)_
- [ ] True DB pagination for listings _(next pass)_
- [ ] Product-table indexes migration _(next pass)_
- [ ] Lighthouse/CWV captured on prod build _(run locally)_
