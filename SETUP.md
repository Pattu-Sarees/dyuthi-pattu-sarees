# Vibha Handloom Sarees — Setup Guide

## Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- Razorpay account (for payments)
- Vercel account (for deployment)

---

## 1. Supabase Setup

1. Go to https://supabase.com → New Project
2. Note your **Project URL** and **Anon Key** from Settings → API
3. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
4. Go to **Authentication → Settings**:
   - Enable **Email OTP** (Magic Link)
   - Set Site URL to your Vercel domain
   - Add `http://localhost:3000` to redirect URLs (for development)
5. Go to **Storage** → Create a bucket named `product-images` (public)

---

## 2. Razorpay Setup

1. Go to https://razorpay.com → Sign up
2. From Dashboard → Settings → API Keys → Generate Test Key
3. Note your **Key ID** and **Key Secret**

---

## 3. Environment Variables

Update `.env.local` with real values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 4. Local Development

```bash
cd saree-store
npm install
npm run dev
```

Visit http://localhost:3000

---

## 5. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo to Vercel and add environment variables in Project Settings → Environment Variables.

**Required Vercel env vars:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `NEXT_PUBLIC_SITE_URL` (set to your Vercel domain)

After deploying, update the Supabase redirect URL and Site URL to your Vercel domain.

---

## 6. Adding Products

Option A — SQL Editor:
Edit and run the INSERT statements at the bottom of `supabase/schema.sql`

Option B — Supabase Dashboard:
Go to Table Editor → products → Insert row

Product images: Upload to Supabase Storage bucket `product-images` and use the public URL.

---

## Features Implemented

- ✅ Email OTP sign-in (passwordless)
- ✅ Product catalog with images, descriptions, pricing
- ✅ Filters: category, fabric, occasion, region, color, price range
- ✅ Product detail page with image gallery, reviews
- ✅ Shopping cart (persisted in localStorage)
- ✅ Checkout with address form
- ✅ Razorpay payment (UPI, Cards, Net Banking)
- ✅ Cash on Delivery option
- ✅ Order management & history
- ✅ Order tracking with status timeline
- ✅ User account & profile
- ✅ Responsive design (mobile-first)
- ✅ Free shipping threshold (₹999)
