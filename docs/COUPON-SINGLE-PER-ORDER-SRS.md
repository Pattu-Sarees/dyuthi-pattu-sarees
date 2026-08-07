# SRS — Single Coupon Per Order (No Stacking)

**Project:** Dyuthi Pattu Sarees (Next.js App Router + Supabase + Razorpay)
**Feature:** Exactly one coupon may apply to a cart/order at a time. Stacking is disallowed.
**Audience:** Backend, Frontend, QA, Database engineers.

> **Current state:** This rule is **already implemented**. The checkout keeps a single `coupon` object in React state (`src/app/checkout/page.tsx`); applying a code **replaces** any previous one; the order row stores a single `coupon_code` + `discount_amount`. This document formalizes the behavior and lists the minor server hardening to guarantee it can't be bypassed by a crafted API call.

---

## 1. Business Requirement

Only one coupon may be active on a cart/order. If one is applied, a second cannot be added until the first is removed.

**Rationale:** stacking multiplies margin loss, creates confusing "which discount wins" math, invites abuse (combining a free-shipping + percentage + flat coupon), and complicates accounting/refunds. A single-coupon rule is predictable for the customer, protects margin, and is trivial to reason about and audit. It is the default in most premium storefronts.

---

## 2. Functional Requirements (step-by-step)

- **Apply first coupon:** validate server-side → if valid, set the cart's single coupon, recompute totals, show applied state.
- **Apply second coupon (one already applied):** **replace** semantics recommended (see §7/§13): validate the new code; if valid, swap it in and recompute; if invalid, keep the existing coupon unchanged and show the error. (Alternative "block" semantics: reject with "remove the existing coupon first.")
- **Remove coupon:** clear the cart's coupon, recompute totals, re-enable the input.
- **Replace coupon:** = remove + apply in one action (the apply flow already overwrites state).
- **Cart recalculation:** on every apply/remove/cart-change, `total = max(0, subtotal − discount) + shipping`. Discount is always the **server-computed** value.
- **Checkout:** the single `coupon_code` travels to `/api/payment/create-order` (server sets the real charge amount) and `/api/orders` (server re-validates and stores).
- **Order placement:** server re-validates the coupon, recomputes the discount, stores `coupon_code` + `discount_amount`, records one `coupon_redemptions` row, increments counters atomically. One order → at most one redemption.

---

## 3. Checkout Flow

```
Cart → Enter coupon → POST /api/coupons/validate (server) →
  valid?  → set single coupon in state → recalc totals → show "Applied / Remove"
  invalid?→ show error, no coupon set
→ Pay now → POST /api/payment/create-order {items, coupon_code}
         → server computes amount (subtotal − discount + shipping) → Razorpay order
→ Razorpay success (signature) → POST /api/orders {items, coupon_code, razorpay_*}
         → server RE-validates coupon, recomputes discount, stores order + one redemption
```

Each step's discount is **recomputed server-side**; the client value is display-only. "Disable further coupon application" is achieved simply because the UI shows the applied state instead of an input (§4) and the cart model holds only one coupon.

---

## 4. UI Behavior

**Before:** input + `Apply`.
**After:** green "✓ FESTIVE200 applied · Save ₹200" + `Remove`.

**Recommendation:** **hide** the input while a coupon is applied (replace it with the applied-coupon chip + Remove) — this is the cleanest UX and structurally prevents a second entry. Do **not** merely disable/read-only (looks broken/confusing). To change coupons, the customer taps **Remove**, which reveals the input again. *(This is exactly how the current checkout behaves.)*

---

## 5. Validation Logic (backend)

```
POST /api/coupons/validate  (and re-run at order time)
  subtotal = Σ(server price × qty)              // never trust client prices
  IF request carries >1 coupon  → 400 "Only one coupon can be applied per order."
  coupon = lookup(code); IF none → COUPON_NOT_FOUND
  IF not active            → COUPON_INACTIVE
  IF expired               → COUPON_EXPIRED
  IF total limit reached   → COUPON_LIMIT_REACHED
  IF daily limit reached   → COUPON_DAILY_LIMIT
  user restrictions (new/existing/per-user/guest) → COUPON_*_ONLY / COUPON_USER_LIMIT / COUPON_LOGIN_REQUIRED
  IF subtotal < min OR subtotal > max → COUPON_MIN_NOT_MET / COUPON_MAX_EXCEEDED
  discount = compute(percent|flat) capped at subtotal
  RETURN {valid, discount}
```

**Single-coupon enforcement:** the API accepts a **single** `coupon_code` string (not an array). If a caller sends an array or a second code, reject. Because the cart/order model stores one code, stacking is impossible at the data layer.

---

## 6. Remove Coupon Flow

```
Click Remove → clear cart.coupon (client state / cart row) → recalc totals →
input re-enabled → customer may enter another code
```
Server has no state to clear for a not-yet-placed order (coupon lives in the request); for a persisted cart model, `update carts set coupon_id=null, discount_amount=0`.

---

## 7. Auto-Apply Coupons (future — Phase 4)

- **Scenario 1 (auto applied, user enters manual):** manual **replaces** auto **only if** its discount ≥ auto's; else keep auto and inform "your current offer is better." *(Shopify/WooCommerce lean toward best-value-for-customer.)*
- **Scenario 2 (manual applied, an auto becomes eligible):** **do not** override a manual choice — respect the customer's explicit action; auto only fills when no manual coupon is present.
- **Best practice:** manual intent wins over automatic; among automatics, pick one by priority→discount. Never silently stack.

*(Auto-apply is not yet in this codebase; single-coupon rule still holds when it lands.)*

---

## 8. Multiple Eligible Coupons

Cart qualifies for WELCOME100 / FESTIVE200 / SAREE500.
- **Option A** auto-pick highest discount — simplest, customer-friendly.
- **Option B** show a list — most transparent, more UI.
- **Option C** apply highest priority — best for merchandising control.

**Recommendation for a premium saree store:** let the customer **enter/choose one** (manual), and for auto-apply use **Priority then highest discount** as tie-break. Optionally show a small "Available offers" list (Option B) they can one-tap apply — but still only **one** ends up applied.

---

## 9. Database Design

Store **exactly one** `coupon_id` (or `coupon_code`) per cart and per order — never a join list — because the rule is one-per-order. A join table would imply stacking.

```
orders:  coupon_code text, discount_amount numeric   -- already present
carts (if you persist carts): coupon_id uuid null, discount_amount numeric
coupon_redemptions: one row per paid order that used a coupon (already present)
```
`coupon_redemptions` is 1 row per order → naturally enforces one redemption per order. Add `unique(order_id)` on it to make double-redemption structurally impossible.

---

## 10. API Validation

- `POST /api/coupons/validate` → `{valid:true, code, discount, description}` or `{valid:false, error_code, message}` (HTTP 200 for business rejects, 400 for bad cart, 401 if login required, 429 if rate-limited).
- `POST /remove-coupon` (client-state today; API if carts persisted) → `{success:true, totals:{...}}`.
- `POST /api/orders` (checkout) → **re-validate** coupon before creating the order; store one coupon; `{orderId}`. If a second coupon is somehow present → 400 "Only one coupon can be applied per order."

**Idempotency:** order creation should be idempotent per Razorpay `order_id` so a retry/double-submit doesn't create a second redemption.

---

## 11. Error Messages (customer-facing)

| Situation | Message |
|---|---|
| Second coupon attempted | "Only one coupon can be applied per order. Remove the current coupon to use another." |
| Applied ok | "Coupon applied successfully." |
| Removed | "Coupon removed." |
| No longer qualifies | "This coupon no longer applies to your cart." |
| Expired | "This coupon has expired." |
| Min not met | "Add ₹X more to use this coupon." |
| Limit reached | "This coupon is no longer available." |

---

## 12. Edge Cases (expected behavior)

- **Page refresh / new tab:** coupon is re-validated on order creation; totals are server-authoritative, so a stale client view can't over-discount.
- **Coupon expires after applying:** order-time re-validation drops it; Phase-1 policy honors an already-**paid** order (charge was locked at create-order); an unpaid attempt is rejected before payment.
- **Product removed / qty reduced / cart below min:** recompute; if the coupon no longer qualifies at order time, the server proceeds **without** the discount (or the UI removes it and asks the user to re-apply) — never a negative total.
- **Coupon disabled by admin mid-checkout:** order-time re-validation rejects (unless already paid, then honored).
- **Payment failure / retry:** no redemption is recorded (redemptions are created only on a verified paid order); the same coupon can be retried.
- **Order cancelled/refunded:** mark redemption `reversed`, decrement counters (Phase-1 supports the redemption row; the reversal hook is a small addition).
- **Guest logs in / user logs out / session expires:** eligibility (new/existing/per-user) is re-evaluated against the current identity at order time; if it no longer qualifies, discount is dropped.

---

## 13. Best Practices & Recommendation

- **Replacement over block:** allow a new valid coupon to replace the current one (fewer clicks, no dead-ends). Only fall back to "remove first" if you want to force explicit intent. **Recommended: replace**, with a toast "FESTIVE200 replaced WELCOME100."
- **Manual > auto**, never stack.
- **One coupon per order** as a hard invariant enforced in the **data model** (single column + unique redemption per order), not just the UI.

**Pros of single-coupon:** simple, predictable, margin-safe, easy refunds/accounting, matches Shopify/most premium stores. **Cons:** customers with two codes can only use one (acceptable; communicate clearly).

---

## 14. Final Recommendation (this store)

Keep the current design — it already matches modern standards:
1. **UI:** hide input when a coupon is applied; show chip + Remove; **replace** on new valid apply.
2. **Data:** one `coupon_code`/`discount_amount` per order; add `unique(order_id)` on `coupon_redemptions`.
3. **Server:** single `coupon_code` param; reject arrays/second codes; re-validate + recompute at create-order and order time (already done); discount always server-side.
4. **Later:** auto-apply with manual-wins + priority tie-break — still one coupon out.

This is simple, user-friendly, scalable, secure, and low-maintenance.

---

### Minor hardening to add (small, safe)

1. `alter table coupon_redemptions add constraint uniq_redemption_per_order unique (order_id);` — one redemption per order, enforced by the DB.
2. In `/api/orders` and `/api/coupons/validate`, if `body.coupon_code` is ever an array → return 400 "Only one coupon can be applied per order." (Today it's typed as a string, so this is defensive only.)

*End of SRS.*
