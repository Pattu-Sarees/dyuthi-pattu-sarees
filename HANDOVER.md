# Dyuthi Pattu Sarees — Project Handover

_Last updated: 2026-06-25_

A complete e-commerce web application for selling handloom sarees, built with Next.js + Supabase and deployed on Vercel.

- **Repository:** https://github.com/Pattu-Sarees/dyuthi-pattu-sarees
- **Local project path:** `C:\Saree project\Saree project\saree-store`
- **Supabase project ref:** `yqkurcnxbkowdeovwlaw`

---

## 1. Business Details

| Item | Value |
|------|-------|
| **Brand name** | Dyuthi Pattu Sarees |
| **Tagline** | Direct From Weavers |
| **Hero caption** | A Legacy Woven in Silk |
| **Hero heading** | Treasures from Timeless Traditions |
| **Location** | Telangana State, India |
| **Reference site** | https://aryacollections.com (used as design/UX reference) |

### Vision & Positioning
A premium, heritage-focused handloom saree store that sources **directly from master weavers**. Positioned around authenticity, craftsmanship, and India's textile heritage — not a generic marketplace. Tone is elegant and traditional with a modern, clean storefront.

**Hero description (current):**
> Discover authentic handloom sarees born from generations of artistry and dedication, where every weave reflects India's rich cultural heritage. Crafted by skilled artisans, each piece embodies timeless tradition, exceptional craftsmanship, and the enduring legacy of handloom weaving.

---

## 2. Branding

### Logo
- **Final logo:** Pink **lotus** mark + "Dyuthi Pattu Sarees" wordmark + "Direct From Weavers" tagline (white/transparent background).
- Stored at `public/logo.png` (trimmed); original kept at `public/logo-source.png`.
- Used in the navbar (top-left). An earlier gold "D + charkha (spinning wheel) + thread spool" logo was replaced by the lotus version.
- The **lotus** is the core brand symbol — reused as the active-nav indicator and in page banners (`LotusAccent` component).

### Color Palette (finalized)
| Use | Color |
|-----|-------|
| Primary brand pink (CTAs, accents, active states) | `#C2185B` (hover `#a01049`) |
| Announcement bar background | `#B8860B` (gold) |
| Announcement bar text/icon | `#FFF8E7` (cream) |
| Main header background | `#F5EFE6` (warm cream) |
| Header text & icons | `#4E1E24` (deep maroon) |
| Hero background | `#4A1F1F` (deep maroon) |
| Hero heading | `#F8E7C5` (antique gold) |
| Hero description | `#E8DCC7` (warm ivory) |
| Hero CTA button | `#B8860B` (gold) |
| Hero secondary button | transparent + gold border |
| Footer background | `#3a0d22` (deep maroon) |
| Footer accents | `#F4C430` (gold) |
| Dashboard section headings | `#A30B2E` (deep red) |
| Account/profile sparkle icon | `#F59E0B` (gold/orange) |
| Category frame outline | `#4E1E24` (deep maroon) |
| Gold tones (frames/zari) | `#D4AF37`, antique `#C9A227` |
| Ivory matting | `#FBF6EA` |

### Typography
- **Geist** (via `next/font`) as the primary sans-serif across the app.
- **Georgia / serif** used for the logo wordmark contexts and some headings/banners.
- Two weights in practice (regular + bold). Sentence case for UI labels.

### Lotus & Handloom Motif Requirements
- **Lotus** is the signature motif — appears as the nav active indicator, banner crowns, and was explored heavily for category frames.
- **Handloom wheel (charkha)** and weaving imagery represent craftsmanship/authenticity (hero image is an artisan at a loom: `public/hero.png`).
- **Category card frame (current/final):** a **scalloped petal frame** — 18 fine shallow lobes, single thin **deep-maroon `#4E1E24`** outline, portrait (4:5), subtle pink glow on hover.
  - Many frame styles were prototyped during the project (see §7).

---

## 3. Website Design

### Homepage (`/`)
- **Announcement bar:** "Enjoy Free Shipping All Over India" with a van/truck icon (gold bar).
- **Header/navbar:** cream background; logo left; centered nav (Home, New Arrivals, Best Sellers, On Sale, All Collections, Contact); search bar + wishlist (heart) + account (with sparkle) + cart (bag) on the right.
- **All Collections mega-menu** (hover): columns — Sarees (Mangalgiri, Kuppadam, Gadwal, Kota, Kanchipattu, Soft Silks), Other Sarees (Jamdhani, Butter Silk, Green Mango), Lehengas, Dress Materials.
- **Hero:** two-column — text (left, maroon bg) + weaving image (right, full-bleed).
- **Category carousel:** scalloped-frame circular/portrait cards with prev/next arrows; **admin-managed** (loads from DB, falls back to defaults).
- **New Arrivals** grid, **Shop by Price** cards, **Best Sellers** grid, **Testimonials**, **Trust badges** (Free Shipping, Secure Payments, Trusted Quality, Premium Collections).
- **Footer:** trust strip + Brand / Help / Discover / Contact columns, "Made in India", payment methods.

### Category / Listing page (`/products`)
- Sidebar **filters**: category, fabric, occasion, region, color, price range, in-stock, sort.
- Product grid with restyled cards: **SALE/NEW** corner badge, pink price + struck-through original, outlined **ADD** button, **LOW STOCK / Sold Out** states.
- Dedicated landing pages: `/new-arrivals`, `/best-sellers`, `/on-sale` (each with a lotus banner + heading), plus `/contact`.

### Product page (`/products/[id]`)
- Image gallery with **prev/next arrows** + counter and thumbnails.
- Price/discount, occasion tags, **stock automation** status, quantity stepper (capped to stock), **Add to Cart** / **Buy Now**, trust badges, description, product details, reviews.
- Add-to-cart uses the **currently selected image** so different images become separate cart lines.

### About page
- **Not yet built** (pending). Brand story content exists in the hero/footer and can be expanded into a dedicated `/about`.

### Contact page (`/contact`)
- Lotus banner + heading + caption ("We're here to help! …✨").
- Contact details (email, phone/WhatsApp, Telangana, hours) + a **lead-capture form** that saves to the `leads` table (shown in admin dashboard Leads count).

---

## 4. Technical Stack

| Layer | Choice |
|-------|--------|
| **Framework** | Next.js 16 (App Router, Turbopack) + React + TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Database** | Supabase (PostgreSQL) with Row-Level Security |
| **Auth** | Supabase Auth — **email OTP** (passwordless); 6-box OTP UI |
| **Storage** | Supabase Storage bucket `product-images` (public) |
| **State** | Zustand (cart, persisted to localStorage) |
| **Payments** | Razorpay (online: UPI/cards/netbanking) + Cash on Delivery |
| **Email (OTP)** | Resend SMTP connected to Supabase (sender `alerts@srhandlooms.com`) |
| **Image cropping** | `react-easy-crop` (admin uploads) |
| **Hosting** | Vercel (auto-deploy on push to `main`) |

### Key environment variables (`.env.local` / Vercel)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY            # admin writes, image upload, leads, categories
RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / NEXT_PUBLIC_RAZORPAY_KEY_ID
NEXT_PUBLIC_SITE_URL
MAINTENANCE_MODE                     # true/false
MAINTENANCE_BYPASS_SECRET            # unlock link key
ADMIN_EMAILS                         # comma-separated admin emails
```

### Database tables
- `profiles`, `products`, `orders`, `order_items`, `reviews` (schema in `supabase/schema.sql`)
- `products.color_variants` (jsonb) — per-photo inventory rows `{image, quantity}`
- `leads` — contact form submissions
- `categories` — admin-managed homepage carousel categories `{name, slug, image, sort_order}`
- **Grants:** standard Supabase grants were (re)applied so `service_role` can write (one-time SQL).

---

## 5. Features Completed

- ✅ Storefront: homepage, products listing + filters, product detail, cart, checkout
- ✅ Email OTP sign-in (6-box input), profile/account, orders + order tracking timeline
- ✅ Razorpay + COD checkout; free-shipping threshold (₹999)
- ✅ Cart with per-image lines, stock caps, remove-confirmation dialog, fast toast (1.5s)
- ✅ Inventory automation: **0 = Sold Out, 1–2 = Low Stock, 3+ = In Stock**
- ✅ Admin dashboard (admin-only via `ADMIN_EMAILS`): product CRUD, image upload, **bulk upload** (one product per photo), **per-photo inventory** with quantities
- ✅ Admin dashboard stats: Total Products, Total Categories, Category In Stock, Low Stock (≤5), Leads
- ✅ Admin **Categories manager** (carousel) with image cropper (zoom/pan/zoom-out)
- ✅ Admin **email gate** at `/admin` (email → admin check → OTP; restricted message otherwise)
- ✅ Leads pipeline (contact form → `leads` table → admin count)
- ✅ Maintenance mode (admin/bypass-key access)
- ✅ Branding: lotus logo, color palette, hero redesign, mega-menu, scalloped category frames
- ✅ Deployed to Vercel with auto-deploy

---

## 6. Features Pending

- ⏳ **About page** (`/about`) — dedicated brand-story page
- ⏳ **Wishlist** — heart icon is visual only (badge shows 0); not wired to storage
- ⏳ **Phone/WhatsApp OTP login** — researched (DLT/OTPLESS/Kwikpass); not implemented (email OTP is live)
- ⏳ **Razorpay production keys** — currently test/placeholder; payment verification/signature check to harden
- ⏳ **Order emails** to customers (confirmation/shipping) — needs verified Resend domain
- ⏳ **Real category images & content** — replace stock/sample data with actual catalog
- ⏳ Policy pages (Privacy, Refund, Shipping, Terms) — footer links are placeholders
- ⏳ Admin: order management/status updates UI (orders exist; admin editing of status/tracking is minimal)

---

## 7. Design Decisions to Remember

- **Inventory model:** one product can hold multiple **per-photo inventory rows** (`color_variants` = `{image, quantity}`); total stock auto-sums. Each photo can be added to cart as its **own line**. (Colour-name input was intentionally dropped in favor of index/photo + quantity.)
- **Bulk upload** = one product **per photo** (qty 1) for unique pieces; single-product form for multi-angle photos of one saree.
- **Category frames** went through many iterations: beaded circle → arch → lotus mandala → rangoli → lotus medallion → simple circle → jeweled rectangle → handloom wheel → lotus+zari → saree pallu → floral wreath → floral medallion → **scalloped petal (final)**. Final = single thin **deep-maroon** outline, fine 18-lobe scallop, portrait 4:5, pink hover glow.
- **Header** is cream `#F5EFE6` with maroon text; **announcement bar** gold `#B8860B`.
- **Admin access is strict**: gated by `ADMIN_EMAILS`; non-admins see "You cannot access this page" (no login form exposed). Admin APIs also reject non-admins server-side.
- **Maintenance mode** keeps `/login`, `/admin`, and admin APIs reachable so admins can always get in.
- **Cart format changed** (items now keyed by product + image) — old carts should be cleared once.
- **DB privilege fix**: after `DROP/CREATE` in schema, grants to `service_role` had to be re-applied (one-time SQL) or admin writes fail with "permission denied for table".
- **OTP length**: Supabase was set to 6 digits; the login UI accepts 6 (and was made flexible during an 8-digit phase).

---

## 8. Image Generation / Assets Used

> No AI image-generation prompts were used to produce final assets. Imagery came from:

- **Logo:** provided by the client (pink lotus PNG) → trimmed to `public/logo.png`.
- **Hero image:** provided by the client (artisan weaving at a loom) → `public/hero.png`.
- **Category/sample product images:** placeholder **Unsplash** URLs during development, e.g.:
  - `https://images.unsplash.com/photo-1610030469983-98e550d6193c` (Kanjivaram)
  - `https://images.unsplash.com/photo-1583391733956-6c78276477e2` (Banarasi)
  - `https://images.unsplash.com/photo-1594938298603-c8148c4b4057` (Patola)
  - `https://images.unsplash.com/photo-1617137968427-85924c800a22` (Chanderi)
  - `https://images.unsplash.com/photo-1600298882525-05bfbaa4ff45` (Silk)
  - `https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03` (Cotton)
- **Decorative frames** (lotus, mandala, scallop, etc.) are hand-authored **inline SVG**, not generated images.
- Real product/category images are uploaded by admins to **Supabase Storage** (`product-images`).

---

## 9. Important Business Rules

- **Free shipping** on orders **₹999 and above**; otherwise ₹99 shipping.
- **Stock status (automation):** 0 → Sold Out, 1–2 → Low Stock, 3+ → In Stock.
- **Cart cannot exceed available stock** (per image/piece).
- **Only admins** (emails in `ADMIN_EMAILS`) can access `/admin` and manage catalog/categories.
- **Leads** (contact enquiries) are private (RLS) — visible only to admins.
- **Payments:** UPI/Cards/NetBanking via Razorpay + Cash on Delivery.
- **Returns:** 7-day returns messaging; handloom-certified positioning.
- Current admin emails: `sainathnarayanam710@gmail.com`, `nithyasumedha6798@gmail.com`.

---

## 10. Next Steps

1. **Production env on Vercel:** set `ADMIN_EMAILS` to both admin emails and **redeploy**; confirm `SUPABASE_SERVICE_ROLE_KEY`, Razorpay keys, `NEXT_PUBLIC_SITE_URL`, maintenance vars are all set for Production.
2. **Catalog data:** add real products (admin / bulk upload) and real carousel **categories** with cropped images; ensure category `slug` matches product `category` for filtering.
3. **Razorpay go-live:** switch to live keys; add server-side **payment signature verification** before marking orders paid.
4. **Customer emails:** verify a sending domain in Resend; add order-confirmation/shipping emails.
5. **Build pending pages:** `/about`, and real Privacy/Refund/Shipping/Terms pages.
6. **Wishlist:** wire the heart icon to a real wishlist (table + UI) if desired.
7. **Custom domain:** point `dyuthipattusarees.com` (or chosen domain) to Vercel; update Supabase Auth Site URL + redirect URLs and `NEXT_PUBLIC_SITE_URL`.
8. **Turn off maintenance mode** when ready to launch (`MAINTENANCE_MODE=false` on Vercel → redeploy).
9. **Security pass:** rotate the DB password (it was shared during setup), review RLS policies, and confirm service-role key is never exposed client-side.

---

## Appendix — Useful URLs & Commands

- **Run locally:** `cd "C:\Saree project\Saree project\saree-store" && npm run dev` → http://localhost:3000
- **Build:** `npm run build`
- **Admin:** `/admin` (email gate)
- **Maintenance unlock:** `/api/maintenance/unlock?key=<MAINTENANCE_BYPASS_SECRET>` (and `?lock=1` to re-lock)
- **Setup guide:** see `SETUP.md`
- **DB schema:** see `supabase/schema.sql`
