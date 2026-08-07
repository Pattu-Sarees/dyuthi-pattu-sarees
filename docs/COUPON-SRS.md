# Coupon Management Module — Software Requirements Specification (SRS)

**Project:** Dyuthi Pattu Sarees — eCommerce Admin + Storefront
**Scope:** Coupon creation, restriction rules, checkout redemption, tracking, and edge-case behavior.
**Audience:** Backend, Frontend, QA, Database engineers.
**Status of today's codebase:** Coupons exist as admin CRUD only (`code`, `discount_type`, `discount_value`, `min_order_value`, `max_order_value`, `expiry_date`, `usage_limit`, `used_count`, `is_active`). **They are not yet validated or applied at checkout.** This SRS defines the target system.

> **Money-safety rule (applies everywhere):** every discount is computed and every limit is enforced **server-side** at order creation, inside the same transaction that verifies the Razorpay payment. The client is never trusted for coupon eligibility, discount amount, or usage counts.

---

## 0. Glossary

| Term | Meaning |
|---|---|
| **Redemption** | A coupon successfully applied to a **paid** order. |
| **Reservation** | A short-lived hold on a limited coupon while payment is in progress. |
| **Eligible subtotal** | Sum of line items the coupon is allowed to discount (after product/category filters), before shipping/tax. |
| **New user** | A logged-in user with **zero** paid orders. |
| **Existing user** | A logged-in user with **≥1** paid order. |
| **Guest** | Checkout without login (if allowed). Tracked by email + phone. |

**Order status model used for counting** (map to your `orders.payment_status` / `status`):
- Counts toward limits: `payment_status = 'paid'` **and** `status NOT IN ('cancelled','refunded')`.
- Never counts: `pending`, `failed`, `cancelled`, `refunded`.

---

# I. OTHER RESTRICTIONS

## 1. Cannot Combine With Other Coupons (`stackable = false`)

**Purpose:** Prevent discount stacking so margins stay controlled.

**Functional logic**
- A cart holds an ordered list of applied coupons (usually 0–1).
- If a coupon has `stackable = false`, it must be the **only** coupon on the cart.
- Applying a non-stackable coupon when another is present → reject with a clear choice, OR replace on explicit confirmation.
- Applying a second coupon when a non-stackable one is already present → reject.

**Validation rules**
- `if (cart.coupons.length > 0 && (newCoupon.stackable === false || cart.hasNonStackable)) → block`.
- Auto-apply coupons are subject to the same rule (see §I.4/§I.5).

**Database:** `coupons.stackable boolean not null default false`.

**Backend flow (apply):**
1. Load current applied coupons for the cart/session.
2. If any existing coupon is non-stackable, or the new one is non-stackable and something is applied → return `409 COUPON_NOT_STACKABLE`.
3. Otherwise append.

**Customer-facing behavior:** Show "This coupon can't be combined with others. Replace *WELCOME100* with *DIWALI20*?" [Replace] / [Keep current].

**Error messages:** `COUPON_NOT_STACKABLE` → "This coupon cannot be combined with another offer."

**Examples**
- Cart has `WELCOME100` (non-stackable). User enters `SILK20` (non-stackable) → blocked; offer replace.
- Cart has `FREESHIP` (stackable=true) + user adds `SILK20` (stackable=true) → both allowed (if your policy permits >1 stackable).
- Removing `WELCOME100` frees the slot; `SILK20` can now be applied.
- Interaction with auto-apply: if an auto-apply non-stackable coupon is on the cart and the user types a manual coupon, the manual one either replaces the auto one (if higher value/priority) or is rejected — decided by §I.5.

---

## 2. Maximum Total Redemptions (`max_total_redemptions`, e.g. 1000)

**Purpose:** Hard cap on how many paid orders can ever use the coupon.

**Functional logic**
- Coupon becomes invalid once **successful (paid, non-refunded)** redemptions reach the cap.
- Only paid orders count. Cancelled/refunded orders **decrement** the effective count (or are excluded from the count query).

**Validation:** `redemptions_paid_count < max_total_redemptions`.

**Counting rule**
- Maintain `coupons.redeemed_count` as a **materialized counter** incremented on payment success and **decremented** on refund/cancel — OR derive from `coupon_redemptions` with a filtered count. Prefer the materialized counter for performance + atomic locking.

**Race-condition handling (critical):** Two users claiming redemption #1000 simultaneously must not both succeed.
- Use an **atomic conditional update** inside the order transaction:
  ```sql
  update coupons
     set redeemed_count = redeemed_count + 1
   where id = :couponId
     and (max_total_redemptions is null or redeemed_count < max_total_redemptions)
  returning redeemed_count;
  ```
  If `0 rows` returned → the cap was hit; abort the order with `COUPON_LIMIT_REACHED` and refund/void the payment if already captured.
- Do the increment **after** payment verification, inside the same DB transaction as the order insert. On any failure, roll back (counter included).

**Refund/cancel handling:** on refund or cancel, `update coupons set redeemed_count = greatest(0, redeemed_count - 1)` and mark the `coupon_redemptions` row `status='reversed'`.

---

## 3. Maximum Daily Uses (`max_daily_uses`, e.g. 100)

**Purpose:** Throttle redemptions per calendar day (store timezone, Asia/Kolkata).

**Functional logic**
- A per-day counter resets at local midnight.
- Only paid orders count; failed/cancelled don't.

**Database:** table `coupon_daily_usage(coupon_id, usage_date, count, primary key(coupon_id, usage_date))`.

**Concurrency:** atomic upsert with a conditional guard:
```sql
insert into coupon_daily_usage (coupon_id, usage_date, count)
values (:id, (now() at time zone 'Asia/Kolkata')::date, 1)
on conflict (coupon_id, usage_date)
  do update set count = coupon_daily_usage.count + 1
  where coupon_daily_usage.count < :max_daily_uses
returning count;
```
`0 rows` → daily cap reached → `COUPON_DAILY_LIMIT`.

**Reset:** no cron needed — the `usage_date` key naturally partitions by day; "today's" row simply doesn't exist yet after midnight.

**Query — remaining today:**
```sql
select :max - coalesce((select count from coupon_daily_usage
  where coupon_id=:id and usage_date=(now() at time zone 'Asia/Kolkata')::date),0);
```

---

## 4. Auto Apply (`auto_apply = true`)

**Purpose:** Best-eligible coupon applies automatically; customer needn't type a code.

**Functional logic**
- On cart/checkout load, server evaluates all `auto_apply=true`, active, in-window coupons whose restrictions the cart satisfies.
- Among qualifying auto coupons, pick **one** by §I.5 Priority (then by highest discount, then newest).
- A manually entered coupon overrides/handles per §I.5.

**Multiple qualifying auto coupons:** only the winner (priority → discount → newest) is applied; others ignored. If the winner is stackable and store policy allows, additional stackable auto coupons may layer — keep it simple: **apply exactly one** unless stacking is explicitly designed.

**Interaction with manual coupons:**
- If a manual coupon is entered and it's non-stackable, it replaces the auto coupon **only if** its discount ≥ auto coupon's (else warn "Your current auto-discount is better").
- If manual is stackable and auto is stackable → both (if policy allows).

**Admin config:** `auto_apply` toggle; auto coupons should usually have no `code` requirement (or a hidden code).

**Checkout behavior:** show "Offer applied automatically: ₹X off (SILK20)" with a remove option.

---

## 5. Priority (`priority` integer, lower = higher priority OR define explicitly)

> **Convention (pick one and document):** In this project the storefront already treats **lower number = higher priority** for products. Use the **same** convention here: `priority ASC` wins. State it in code comments.

**Purpose:** Decide the winner when multiple eligible coupons exist (mainly auto-apply).

**Logic / sorting:** eligible coupons sorted by `priority ASC, discount_value_effective DESC, created_at DESC`. First = winner.

**Tie-breaking:** equal priority → higher **actual computed discount** for this cart → then newest.

**Interaction:** applies to auto-apply selection and to "is the manual coupon better than the current auto coupon".

**DB:** `coupons.priority integer not null default 100`. Index `(is_active, auto_apply, priority)`.

**Example:** Cart qualifies for `A`(priority 1, ₹100) and `B`(priority 2, ₹300). Priority wins → `A` applied. If you want largest discount to win instead, sort by discount first — **document the business choice**.

---

# II. PRODUCT RESTRICTIONS

A coupon has a **scope mode** plus optional include/exclude sets.

`coupons.applies_to enum('entire_store','categories','products') default 'entire_store'`
Plus association tables (below) for included/excluded categories and products.

## Options

| Option | Purpose | Checkout logic |
|---|---|---|
| **Entire Store** | Discounts the whole eligible subtotal. | Eligible subtotal = full cart subtotal (minus any excluded items). |
| **Selected Categories** | Only items in listed categories are discounted. | Eligible subtotal = Σ line totals where `product.category ∈ included_categories`. |
| **Selected Products** | Only listed products. | Eligible subtotal = Σ line totals where `product_id ∈ included_products`. |
| **Excluded Categories** | Everything **except** these categories. | Remove items whose category ∈ excluded from eligible subtotal. |
| **Excluded Products** | Everything except these products. | Remove those product_ids from eligible subtotal. |

**Validation (admin):** can't list the same product/category as both included and excluded; included sets require `applies_to` to match.

**Database design**
```sql
create table coupon_categories (
  coupon_id uuid references coupons(id) on delete cascade,
  category  text not null,
  mode      text not null check (mode in ('include','exclude')),
  primary key (coupon_id, category, mode)
);
create table coupon_products (
  coupon_id  uuid references coupons(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  mode       text not null check (mode in ('include','exclude')),
  primary key (coupon_id, product_id, mode)
);
create index on coupon_categories(coupon_id);
create index on coupon_products(coupon_id);
```

**Restriction precedence & evaluation order (per line item):**
1. Start `eligible = true`.
2. If `applies_to='products'` → eligible only if `product_id ∈ include products`.
3. Else if `applies_to='categories'` → eligible only if `category ∈ include categories`.
4. Else (`entire_store`) → eligible = true.
5. **Exclusions always win:** if `product_id ∈ exclude products` → eligible = false.
6. If `category ∈ exclude categories` → eligible = false.

So: **Excluded Product overrides Selected Category**, and **Excluded Category overrides Entire Store.** Exclusions are evaluated last and are absolute.

**Partial / mixed cart:** the discount applies only to the **eligible subtotal**, not the whole cart. `min_order_value`/`max_order_value` are checked against the **cart subtotal** (document if you instead want them against eligible subtotal — recommend cart subtotal for min-spend, eligible subtotal for the discount base).

**Discount calculation**
- `percent`: `discount = round(eligible_subtotal * value/100)`, capped by optional `max_discount_amount`.
- `flat`: `discount = min(value, eligible_subtotal)` (never discount more than the eligible items are worth).

**Worked example**
Cart: Silk Saree ₹5,000 · Cotton Saree ₹2,000 · Blouse ₹500 (subtotal ₹7,500).
Coupon `SILK10` = 10% off, `applies_to='categories'`, include `kanjivaram/silk`.
- Eligible items: Silk Saree only → eligible_subtotal = ₹5,000.
- Discount = 10% × 5,000 = **₹500**. Cotton + Blouse untouched.
- Order total = 7,500 − 500 (+ shipping).

If instead `SILK10` were `flat ₹6,000` on eligible ₹5,000 → discount capped at ₹5,000 (can't exceed eligible value).

---

# III. USER RESTRICTIONS

## 1. Usage Per User (`per_user_limit`, e.g. 2)

**Meaning:** the same customer can redeem this coupon at most N times (paid orders).

**DB:** derive from `coupon_redemptions`. **Validation query:**
```sql
select count(*) from coupon_redemptions r
 where r.coupon_id=:id and r.user_id=:uid and r.status='redeemed';
-- block if count >= per_user_limit
```
**Counting:** only `status='redeemed'` (paid, not reversed). Cancelled/refunded → `status='reversed'` (don't count). Failed payments never create a redemption row (only reservations, which expire).

## 2. Once Per Logged-in User (`once_per_user = true`)

Shorthand for `per_user_limit = 1` **restricted to logged-in users** (guests excluded from this guarantee). Difference from §1: it's a boolean convenience and implies login required. Validation = same query with `>= 1`. Guests: if `allow_guests=false`, blocked; if allowed, tracked by email+phone (weaker guarantee — see §III.5).

## 3. New Users Only (`new_users_only = true`)

**New user = zero paid orders.**
```sql
select not exists (
  select 1 from orders o
   where o.user_id=:uid and o.payment_status='paid'
     and o.status not in ('cancelled','refunded')
) as is_new;
-- block if is_new = false
```
Pending/failed/cancelled orders do **not** disqualify a new user (they never completed a paid order). Guest checkout: treat by email/phone history; if no prior paid order for that email/phone → new.

## 4. Existing Users Only (`existing_users_only = true`)

**Existing = ≥1 paid order.** Inverse of §3 (`is_new = false`). Guests: check email/phone paid-order history.

> Admin validation: `new_users_only` and `existing_users_only` are mutually exclusive — block enabling both.

## 5. Allow Guest Users (`allow_guests = true`)

**Purpose:** let non-logged-in customers redeem.
**Abuse risk:** without an account, per-user limits are weak.
**Recommended tracking:** composite key **normalized email + normalized phone**; store on `coupon_redemptions` even for guests. Enforce per-user/once-per-user against that key. Cookies/device fingerprints are supplementary and easily bypassed — never the sole guard.
**Best practice:** for scarce/high-value coupons set `allow_guests=false` (require login) so identity is strong; for broad marketing coupons allow guests but keep a global + daily cap as the real backstop.

---

# IV. DESCRIPTION FIELD (below Name)

**Two separate fields recommended:**
- `admin_note` (internal, not shown to customers) — e.g. "Festive campaign, finance-approved 2026-09".
- `description` (customer-visible marketing line) — e.g. "₹500 OFF on orders above ₹3,000".

**Character limits:** `description` ≤ 160 chars (fits chips/summaries); `admin_note` ≤ 500.

**Where `description` appears:** coupon listing, coupon detail, checkout applied-coupon row, coupon popup/offers list, customer account → offers, order summary, and order invoice (as "Discount (SILK20): ₹500 — Applicable only on Silk Sarees").

**Examples:** "₹500 OFF on orders above ₹3000" · "Applicable only on Silk Sarees" · "Cannot be combined with any other coupon."

---

# V. DATABASE DESIGN

```sql
-- Core (extends today's coupons table)
alter table coupons add column if not exists description        text;
alter table coupons add column if not exists admin_note         text;
alter table coupons add column if not exists stackable          boolean not null default false;
alter table coupons add column if not exists auto_apply         boolean not null default false;
alter table coupons add column if not exists priority           integer not null default 100;
alter table coupons add column if not exists max_total_redemptions integer;   -- null = unlimited
alter table coupons add column if not exists redeemed_count     integer not null default 0;
alter table coupons add column if not exists max_daily_uses     integer;       -- null = unlimited
alter table coupons add column if not exists per_user_limit     integer;       -- null = unlimited
alter table coupons add column if not exists once_per_user      boolean not null default false;
alter table coupons add column if not exists new_users_only     boolean not null default false;
alter table coupons add column if not exists existing_users_only boolean not null default false;
alter table coupons add column if not exists allow_guests       boolean not null default true;
alter table coupons add column if not exists applies_to         text not null default 'entire_store'
     check (applies_to in ('entire_store','categories','products'));
alter table coupons add column if not exists max_discount_amount numeric;      -- cap for percent coupons
-- (already present: code, discount_type, discount_value, min_order_value, max_order_value,
--  expiry_date, usage_limit/used_count [legacy → migrate to max_total_redemptions/redeemed_count], is_active)

create table coupon_categories ( ... );   -- see §II
create table coupon_products   ( ... );    -- see §II

-- One row per successful redemption (source of truth for per-user counts)
create table coupon_redemptions (
  id           uuid primary key default gen_random_uuid(),
  coupon_id    uuid not null references coupons(id) on delete cascade,
  order_id     uuid references orders(id) on delete set null,
  user_id      uuid,                          -- null for guests
  guest_email  text,                          -- normalized (lowercase, trimmed)
  guest_phone  text,                          -- normalized (digits only)
  discount_amount numeric not null,
  status       text not null default 'redeemed' check (status in ('reserved','redeemed','reversed')),
  created_at   timestamptz not null default now(),
  reversed_at  timestamptz
);
create index on coupon_redemptions(coupon_id, user_id);
create index on coupon_redemptions(coupon_id, guest_email);
create index on coupon_redemptions(order_id);

-- Per-day counter (see §I.3)
create table coupon_daily_usage (
  coupon_id  uuid references coupons(id) on delete cascade,
  usage_date date not null,
  count      integer not null default 0,
  primary key (coupon_id, usage_date)
);

-- Optional immutable audit trail
create table coupon_usage_logs (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid, order_id uuid, user_id uuid,
  action text,               -- validated | applied | rejected | reversed
  reason text,               -- error code when rejected
  created_at timestamptz not null default now()
);
```
**Relationships:** `coupons 1—N coupon_categories / coupon_products / coupon_redemptions / coupon_daily_usage`. All FKs cascade on coupon delete (except redemptions, which you may keep for accounting → `on delete set null`/soft-delete instead).

**Sample records**
```
coupons: (SILK10, percent, 10, applies_to=categories, per_user_limit=2, max_total_redemptions=1000,
          max_daily_uses=100, priority=1, stackable=false, description='10% off Silk Sarees')
coupon_categories: (SILK10, 'kanjivaram', 'include')
coupon_redemptions: (SILK10, order#123, user#u1, 500, 'redeemed')
coupon_daily_usage: (SILK10, 2026-09-30, 37)
```

---

# VI. VALIDATION ORDER (server, at both "apply" and "final order")

1. **Coupon exists** (by code, case-insensitive).
2. **Active** (`is_active = true`).
3. **Date window** (`now < expiry_date`; also `starts_at` if you add one).
4. **Total redemption limit** (`redeemed_count < max_total_redemptions`).
5. **Daily usage limit** (today's count < `max_daily_uses`).
6. **User restrictions** (login required? new/existing? per-user/once-per-user? guest allowed?).
7. **Product restrictions** → compute **eligible items**; if none eligible → reject.
8. **Cart value** (`min_order_value ≤ subtotal ≤ max_order_value`).
9. **Combination** (stackable/auto/priority resolution).
10. **Discount calculation** (percent/flat, cap, never exceed eligible subtotal).
11. **Final apply** (persist reservation → on payment success convert to redemption).

**Why this order:** cheapest/most-decisive checks first (existence, active, dates, global caps are single-row reads) so you fail fast before the expensive per-item product-scope computation and discount math. User restrictions precede product math because a blocked user shouldn't trigger cart evaluation. Discount is computed last, only for a fully valid coupon.

---

# VII. EDGE CASES (expected behavior)

1. **Coupon expires between apply and checkout** → re-validate at order creation; reject `COUPON_EXPIRED`; remove from cart; recompute total.
2. **Coupon expires after payment starts** → the Razorpay amount was set at order-create with the discount locked in a **reservation**; honor it if the reservation is still valid (short TTL, e.g. 15 min). If reservation expired → fail order pre-payment, don't capture.
3. **Last redemption claimed simultaneously** → atomic conditional increment (§I.2); loser gets `COUPON_LIMIT_REACHED`, payment not captured / auto-refunded.
4. **Guest logs in during checkout** → re-run user restrictions as logged-in; if now ineligible (e.g. existing-user coupon and they're new) → remove coupon, notify.
5. **Product removed from cart after coupon applied** → recompute eligible subtotal; if coupon no longer qualifies (min not met / no eligible items) → auto-remove, notify.
6. **Quantity changes** → recompute discount on every cart mutation and again server-side at order time.
7. **Cart no longer qualifies (below min / above max)** → auto-remove with message "Add ₹X more to use SILK10".
8. **Manual coupon after auto-apply** → §I.4/I.5 resolution (replace if better, else keep auto).
9. **Auto-apply after manual coupon** → manual takes precedence; auto only fills if no manual coupon and cart qualifies.
10. **Multiple auto-apply coupons qualify** → pick one by priority→discount→newest.
11. **Category conflict (item in included + excluded)** → exclusion wins (§II precedence).
12. **Product conflict (included product in excluded category)** → excluded-product/category wins; item not discounted.
13. **Order cancelled** → reverse redemption (`status='reversed'`), decrement `redeemed_count` and daily count.
14. **Order refunded** → same as cancel (reverse counts). Keep the redemption row for audit.
15. **Failed payment** → reservation expires/rolls back; **no** redemption row; counters untouched.
16. **COD order cancelled** → if COD ever counts as redemption on placement, reverse on cancel; recommended: COD counts only on delivery/confirmation.
17. **Duplicate API requests (double-submit)** → idempotency key on order creation; coupon increment happens once inside the order transaction; second request returns the same order.
18. **Browser refresh** → coupon state is server-derived from the cart/session, not client memory; re-validate on load.
19. **Multiple tabs** → same session; server is source of truth; last valid state wins; re-validate at order time.
20. **Payment retry** → reuse the same reservation/order; do not double-increment; only convert to redemption once on first successful capture.
21. **Coupon disabled by admin mid-checkout** → re-validation at order creation rejects it (`COUPON_INACTIVE`); if payment already authorized against a valid reservation, honor per your reservation policy (recommend: honor within TTL, since the customer acted in good faith).
22. **Percent coupon exceeding item value / max_discount_amount** → cap discount; never negative totals.

---

# VIII. API CONSIDERATIONS

**`POST /api/coupons/validate`** (apply/preview — no side effects except optional reservation)
- Req: `{ code, cart: [{product_id, quantity}], user_id? }`
- Res (ok): `{ valid: true, coupon: {code, description}, eligible_subtotal, discount_amount, new_total }`
- Res (fail): `{ valid: false, error_code, message }` with codes: `COUPON_NOT_FOUND, COUPON_INACTIVE, COUPON_EXPIRED, COUPON_LIMIT_REACHED, COUPON_DAILY_LIMIT, COUPON_USER_LIMIT, COUPON_LOGIN_REQUIRED, COUPON_NEW_USERS_ONLY, COUPON_EXISTING_USERS_ONLY, COUPON_MIN_NOT_MET, COUPON_MAX_EXCEEDED, COUPON_NO_ELIGIBLE_ITEMS, COUPON_NOT_STACKABLE`.

**Order creation** (`/api/orders`) — re-run **all** validations server-side, compute discount from DB prices, verify Razorpay signature, then in **one transaction**: insert order (with `discount_amount`), insert `coupon_redemptions` (`status='redeemed'`), atomic-increment `redeemed_count` + `coupon_daily_usage` (conditional), commit. Any failure → roll back everything.

**Never** accept `discount_amount` from the client. The client value is display-only.

---

# IX. RECOMMENDED IMPLEMENTATION PHASES (for this project)

Because coupons aren't applied at checkout yet, build in safe, testable slices:

1. **Phase 1 — Redemption engine (no restrictions):** coupon field at checkout, server validate (exists/active/date/min/max/global+daily limit), compute discount server-side, store redemption, increment counters atomically. This alone makes coupons *work*.
2. **Phase 2 — User restrictions:** per-user / once-per-user / new / existing / guests.
3. **Phase 3 — Product/category restrictions:** `coupon_products` / `coupon_categories`, eligible-subtotal math.
4. **Phase 4 — Other restrictions:** stackable, auto-apply, priority.
5. **Phase 5 — Admin UI** for all the above + descriptions, and reporting.

Each phase is independently deployable and testable in Razorpay test mode.

---

*End of SRS.*
