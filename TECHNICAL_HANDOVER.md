# Dyuthi Pattu Sarees — Technical Handover

_Last updated: 2026-06-25_

Technical reference for developers maintaining/extending the storefront.

- **Repo:** https://github.com/Pattu-Sarees/dyuthi-pattu-sarees (branch `main`, auto-deploys to Vercel)
- **Local path:** `C:\Saree project\Saree project\saree-store`
- **Stack:** Next.js 16 (App Router, Turbopack) · React · TypeScript · Tailwind v4 · Supabase (Postgres + Auth + Storage) · Zustand · Razorpay
- **Supabase project ref:** `yqkurcnxbkowdeovwlaw`

---

## 1. Folder Structure

```
saree-store/
├─ public/
│  ├─ logo.png            # navbar logo (trimmed lotus)
│  ├─ logo-source.png     # original full logo
│  ├─ hero.png            # homepage hero (artisan weaving)
│  └─ *.svg               # default next assets
├─ supabase/
│  └─ schema.sql          # tables, RLS, sample data
├─ src/
│  ├─ proxy.ts            # middleware (Next 16 "proxy"): session refresh, maintenance gate, protected routes
│  ├─ middleware.ts       # (removed — replaced by proxy.ts)
│  ├─ types/index.ts      # Product, CartItem, Order, InventoryItem, etc.
│  ├─ store/cart.ts       # Zustand cart (persisted, per-image lines, stock caps)
│  ├─ lib/
│  │  ├─ utils.ts         # cn, formatPrice, formatDate, getStockStatus, order status maps
│  │  ├─ admin.ts         # isAdminEmail() — checks ADMIN_EMAILS
│  │  └─ supabase/
│  │     ├─ client.ts     # browser client (anon)
│  │     ├─ server.ts     # server client (cookies, anon)
│  │     ├─ middleware.ts # updateSession helper (used by proxy)
│  │     └─ admin.ts      # service-role client (server-only, bypasses RLS)
│  ├─ components/
│  │  ├─ layout/          # Navbar, Footer, PageBanner
│  │  ├─ products/        # ProductCard, ProductDetail, ProductsGrid, ProductFilters
│  │  ├─ admin/           # ProductForm, BulkUploadForm, AdminGate, ImageCropper
│  │  ├─ ui/              # button, input, badge, card, LotusAccent
│  │  ├─ CategoryCarousel.tsx
│  │  └─ ContactForm.tsx
│  └─ app/
│     ├─ layout.tsx       # root layout (Navbar/Footer, Toaster, hides chrome on maintenance)
│     ├─ globals.css
│     ├─ page.tsx         # homepage (hero, carousel, new arrivals, price, best sellers, testimonials, trust)
│     ├─ products/        # listing (page.tsx) + detail ([id]/page.tsx)
│     ├─ new-arrivals/ best-sellers/ on-sale/   # dedicated listing pages
│     ├─ cart/ checkout/ orders/ orders/[id]/ account/
│     ├─ contact/         # contact page (uses ContactForm)
│     ├─ login/           # page.tsx (Suspense) + LoginForm.tsx (email OTP, 6-box)
│     ├─ maintenance/     # maintenance page
│     ├─ admin/           # dashboard, categories, products/new, products/bulk, products/[id]/edit, layout (gate)
│     └─ api/
│        ├─ products/ + products/[id]            # public product reads
│        ├─ orders/ + orders/[id]                # user orders (auth)
│        ├─ payment/create-order                 # Razorpay order
│        ├─ leads                                # public contact-form insert
│        ├─ maintenance/unlock                   # bypass-cookie setter
│        └─ admin/                               # admin-only (service role)
│           ├─ products (GET/POST), products/[id] (PUT/DELETE), products/bulk (POST)
│           ├─ categories (GET/POST), categories/[id] (PUT/DELETE)
│           ├─ leads (GET), check-email (POST), upload (POST → Supabase Storage)
├─ .env.local            # secrets (gitignored)
├─ .env.example          # template
├─ next.config.ts        # image remotePatterns (unsplash, *.supabase.co)
├─ vercel.json
├─ SETUP.md / HANDOVER.md / TECHNICAL_HANDOVER.md
```

---

## 2. Environment Variables

Set in `.env.local` (local) and **Vercel → Settings → Environment Variables** (Production).

| Variable | Purpose | Public? |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (browser/server reads) | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role — admin writes, uploads, leads, categories. **Server only.** | **no** |
| `RAZORPAY_KEY_ID` | Razorpay key id (server) | no |
| `RAZORPAY_KEY_SECRET` | Razorpay secret (server) | **no** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key id (client checkout) | yes |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL | yes |
| `MAINTENANCE_MODE` | `true`/`false` — show maintenance page to non-admins | no |
| `MAINTENANCE_BYPASS_SECRET` | Key for `/api/maintenance/unlock?key=…` | **no** |
| `ADMIN_EMAILS` | Comma-separated admin emails (gates `/admin` + admin APIs) | no |

> Code falls back to `https://placeholder.supabase.co` / `placeholder` if Supabase vars are missing, so builds don't crash without env — but the app won't function until real values are set.
> **Env changes on Vercel require a redeploy.** Local changes require restarting `npm run dev`.

---

## 3. Supabase Configuration

- **Project ref:** `yqkurcnxbkowdeovwlaw`
- **Auth → Providers → Email:** enabled; **Email OTP** used.
- **Auth → Email Templates → Magic Link:** customized to send the **6-digit `{{ .Token }}`** code (branded HTML).
- **Auth → Email OTP length:** 6 digits. **Expiry:** 15 min (900s).
- **SMTP (Auth → SMTP Settings):** **Custom SMTP via Resend**
  - Host `smtp.resend.com`, Port `465`, User `resend`, Password = Resend API key
  - Sender `alerts@dyuthipattusarees.com` (verified Resend domain)
- **Storage:** bucket **`product-images`** (public). Auto-created on first admin upload via `/api/admin/upload` (service role).
- **RLS:** enabled on all tables. Public can SELECT products/reviews/categories; users see own profiles/orders; writes go through the **service-role** client in admin APIs (bypasses RLS).
- **Grants:** after schema `DROP/CREATE`, standard grants were re-applied so `service_role` (and `anon`/`authenticated`) have table privileges. If you ever see `permission denied for table …`, run:
  ```sql
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role, authenticated;
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role, authenticated;
  ```

---

## 4. Authentication Flow

### Supabase clients
- `lib/supabase/client.ts` — browser (anon), used in client components.
- `lib/supabase/server.ts` — server (anon + cookies), used in server components/route handlers for `getUser()`.
- `lib/supabase/admin.ts` — **service role**, server-only, used in admin APIs to bypass RLS.

### Customer login (email OTP)
1. `/login` → `LoginForm` calls `supabase.auth.signInWithOtp({ email, shouldCreateUser: true })`.
2. User receives 6-digit code (Resend SMTP) → enters it in a 6-box input.
3. `supabase.auth.verifyOtp({ email, token, type: 'email' })` creates the session (cookies).
4. `proxy.ts` refreshes the session on each request; protected paths `/account`, `/orders`, `/checkout` redirect to `/login` if unauthenticated.

### Admin login (gated)
1. `/admin/layout.tsx` (server) reads the user. If admin → dashboard; if logged-in non-admin → "You cannot access this page"; if logged-out → `<AdminGate>`.
2. `AdminGate`: enters email → `POST /api/admin/check-email` (checks `ADMIN_EMAILS`). If not admin → restricted message; if admin → `signInWithOtp` → 6-box OTP → `verifyOtp` → `router.refresh()` → dashboard.
3. **Defense in depth:** every `/api/admin/*` route re-checks `isAdminEmail(user.email)` server-side; writes use the service-role client.

### Maintenance gate (`proxy.ts`)
- When `MAINTENANCE_MODE=true`, non-admins are rewritten to `/maintenance` (with `x-maintenance` header so root layout hides nav/footer).
- Always allowed: `/maintenance`, `/api/maintenance`, `/login`, `/admin`, `/api/admin`, `/api/auth`, `/auth`.
- Admins (by `ADMIN_EMAILS`) or holders of the bypass cookie (`/api/maintenance/unlock?key=…`) see the live site.

---

## 5. Database Schema

Defined in `supabase/schema.sql` (plus later additions for `color_variants`, `leads`, `categories`).

### `profiles`
`id` (uuid, FK→auth.users), `full_name`, `phone`, `avatar_url`, timestamps. Auto-created on signup via trigger. RLS: owner-only.

### `products`
`id` uuid, `name`, `description`, `price` numeric, `original_price` numeric?, `images` text[], `category` text, `fabric` text, `color` text[], **`color_variants` jsonb** (`[{image, quantity}]`), `occasion` text[], `region` text, `in_stock` bool, `stock_quantity` int, `rating` numeric, `review_count` int, `is_featured` bool, `is_new_arrival` bool, timestamps. RLS: public SELECT; writes via service role.

### `orders`
`id` uuid, `user_id` (FK→auth.users, RESTRICT), `status` (pending/confirmed/processing/shipped/out_for_delivery/delivered/cancelled/returned), `total_amount`, `shipping_amount`, `discount_amount`, `address` jsonb, `payment_method`, `payment_status` (pending/paid/failed/refunded), `payment_id`, `tracking_number`, `tracking_url`, `estimated_delivery`, timestamps. RLS: user sees own; insert own.

### `order_items`
`id`, `order_id` (FK CASCADE), `product_id` (FK SET NULL), `product_name`, `product_image`, `quantity`, `price`, `created_at`. RLS via `order_belongs_to_user()` SECURITY DEFINER helper.

### `reviews`
`id`, `product_id` (FK CASCADE), `user_id`, `user_name`, `rating` (1–5), `comment`, `created_at`. RLS: public SELECT; auth insert own.

### `leads`
`id` uuid, `name`, `email`, `phone`, `message`, `created_at`. RLS enabled, **no public policies** (private); accessed via service role only.

### `categories`  (homepage carousel)
`id` uuid, `name`, `slug`, `image`, `sort_order` int, `created_at`. RLS: public SELECT (`categories_select`); writes via service role. `slug` must match a product `category` for filtering to work.

---

## 6. Deployment Setup

- **Hosting:** Vercel, connected to GitHub `Pattu-Sarees/dyuthi-pattu-sarees`. Every push to `main` triggers a production deploy.
- **Build:** `npm run build` (Next 16 / Turbopack). `next.config.ts` allows remote images from `images.unsplash.com` and `*.supabase.co`.
- **Required Vercel env vars:** all of §2 (especially `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`, Razorpay keys). **Redeploy after changing env.**
- **SMTP/Auth** live in Supabase (shared by local + prod) — no code deploy needed for those.
- **Local dev:** `cd "C:\Saree project\Saree project\saree-store" && npm run dev` → http://localhost:3000.
- **Post-deploy for custom domain:** add domain in Vercel; update Supabase Auth **Site URL** + **Redirect URLs** and `NEXT_PUBLIC_SITE_URL`.

---

## 7. Pending Development Tasks

1. **Razorpay hardening:** move to live keys; add **server-side payment signature verification** in `/api/orders` (currently order is marked paid based on client handler).
2. **Customer emails:** order confirmation / shipping notifications (needs verified Resend domain).
3. **About page** (`/about`) and real policy pages (Privacy, Refund, Shipping, Terms) — footer links are placeholders (`#`).
4. **Wishlist:** heart icon is decorative (badge `0`); wire to a `wishlists` table + UI.
5. **Admin order management:** UI to update `status`, `payment_status`, `tracking_number/url` (data model supports it; admin UI minimal).
6. **Phone/WhatsApp OTP** login (optional; needs DLT or a provider like OTPLESS).
7. **Catalog data:** replace Unsplash placeholders/sample products with real catalog; add real `categories` rows.
8. **Stock decrement on order:** stock isn't decremented when an order is placed — implement inventory reduction (and restore on cancel).
9. **SEO/analytics, sitemap, structured data** — not yet added.

---

## 8. Known Bugs / Risks to Fix

- **Stock not decremented after purchase** — `stock_quantity`/`color_variants` are not reduced on successful order; overselling is possible. (Highest priority.)
- **Payment trust:** order `payment_status='paid'` is set from the client Razorpay handler without server signature verification — must verify `razorpay_signature` server-side.
- **Cart format migration:** cart items are now keyed by product+image; users with an old persisted cart (`saree-cart` in localStorage) may need to "Clear all items" once. Consider versioning the persisted store.
- **`color`/colour filtering:** products created via the current admin form save `color: []` (colour input was removed), so the colour filter on `/products` won't match newer products. Either repopulate colours or remove the colour filter.
- **Category slug mismatch:** carousel/category links use slugs that must exactly equal product `category` values; mismatches yield empty results. Keep admin category slugs aligned with product categories.
- **DB privileges after schema re-runs:** re-running `schema.sql` (DROP/CREATE) drops grants; re-apply the GRANT block (see §3) or admin writes fail with `permission denied for table`.
- **Large media:** `logo.png` (~1 MB) and `hero.png` (~1.4 MB) are heavy; compress for faster loads (Vercel/Next optimizes but source is large).
- **Dev-server staleness (local only):** Turbopack dev can get into a broken state (observed `adapterFn is not a function` / duplicate dev server). Fix: stop node, `rm -rf .next`, `npm run dev`. Does not affect production.
- **DB password exposure:** the Supabase DB password was shared during setup — rotate it (Supabase → Settings → Database). It doesn't affect the app (which uses API keys).

---

## Appendix — Common Commands

```bash
# Dev
cd "C:\Saree project\Saree project\saree-store"
npm run dev            # http://localhost:3000
npm run build          # production build check

# Git / deploy
git add -A && git commit -m "..." && git push origin main   # auto-deploys on Vercel
```

- **Admin:** `/admin` (email gate; emails in `ADMIN_EMAILS`)
- **Maintenance unlock:** `/api/maintenance/unlock?key=<MAINTENANCE_BYPASS_SECRET>` ( `?lock=1` to re-lock )
- **Schema:** `supabase/schema.sql` · **Setup:** `SETUP.md` · **Business handover:** `HANDOVER.md`
