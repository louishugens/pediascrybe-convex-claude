# Pediascrybe Pricing Update — Claude Code Instructions

**Date:** March 30, 2026  
**Scope:** Full pricing restructure — tier names, prices, limits, feature gates, Stripe products, UI copy  
**Priority:** Execute in the order listed. Each section is a self-contained task.

---

## Context

We are restructuring the pricing from the current model to a new model. Here is the complete mapping:

### Price Changes

| Current | New | Change |
|---------|-----|--------|
| Starter $29/mo | Essentials $29/mo | Name change only |
| Pro $49/mo | Professional $59/mo | +$10/mo + name change |
| Premium $99/mo | Complete $119/mo | +$20/mo + name change |
| (none) | Institution — Custom | New tier |

### Annual Pricing (NEW — does not exist yet)

| Tier | Monthly | Annual (per month) | Annual (billed) |
|------|---------|-------------------|-----------------|
| Essentials | $29 | $24 | $288/year |
| Professional | $59 | $49 | $588/year |
| Complete | $119 | $99 | $1,188/year |

### Scrybe Assist (Parent AI)

| Current | New |
|---------|-----|
| $4.99/mo | $6.99/mo |

---

## Task 1: Rename Tiers Across the Codebase

Search and replace all references to the old tier names. This is a global find-and-replace but be careful with case sensitivity and context.

**String replacements (case-sensitive):**

```
"Starter"     → "Essentials"      (when referring to the subscription tier)
"starter"     → "essentials"      (lowercase variants in code/keys)
"Pro"         → "Professional"    (when referring to the subscription tier — NOT "Pro plan" for Convex/Resend/etc.)
"pro"         → "professional"    (lowercase variants in code/keys — be careful: only subscription tier references)
"Premium"     → "Complete"        (when referring to the subscription tier)
"premium"     → "complete"        (lowercase variants in code/keys)
```

**Important:** Do NOT rename references to third-party service plans (e.g., Convex Pro, Resend Pro, Vercel Pro). Only rename Pediascrybe subscription tier references.

**Files likely affected:**
- `convex/schema.ts` — subscriptionTiers table, tier enum definitions
- `convex/subscriptions.ts` or similar — tier logic, feature gating
- `convex/usage.ts` — usage tracking per tier
- Any seed/migration files that define tier names
- Frontend components: pricing page, dashboard, settings, subscription management
- API routes that check tier: `/api/ai/*`, `/api/whatsapp/*`, etc.
- Email templates (welcome email mentions tier name)
- Public marketing pages: pricing, features, FAQ

**Verification:** After renaming, search the entire codebase for any remaining instances of "Starter", "Pro" (as a tier name), and "Premium" to ensure nothing was missed. Grep for `"Starter"`, `"Pro"` (excluding third-party contexts), and `"Premium"`.

---

## Task 2: Update Subscription Prices in Stripe Configuration

Find where Stripe product/price IDs are configured and update the monthly prices. You will also need to create annual price variants.

**Current → New monthly prices:**

```
Essentials:   $29/mo  (unchanged)
Professional: $59/mo  (was $49)
Complete:     $119/mo (was $99)
```

**New annual prices (create these):**

```
Essentials:   $288/year  ($24/mo equivalent)
Professional: $588/year  ($49/mo equivalent)
Complete:     $1,188/year ($99/mo equivalent)
```

**Where to look:**
- `convex/schema.ts` — `prices` table, `products` table
- Stripe webhook handler — likely in `/api/stripe/webhook` or `convex/stripe.ts`
- Checkout session creation — where `stripe.checkout.sessions.create()` is called
- Billing portal configuration
- Any seed data or constants file that hardcodes price amounts

**What to do:**
1. Find the Stripe price creation/sync logic
2. Update monthly price amounts: Pro $49→$59, Premium $99→$119
3. Add annual billing interval support: create `interval: 'year'` variants for each tier
4. Update the checkout session to accept a `billingInterval` parameter ('monthly' | 'annual')
5. Update the billing portal to show both options
6. If prices are seeded in the database, update the seed values

**Scrybe Assist price:**
- Find the parent/patient subscription price ($4.99) and update to $6.99
- This is likely in a separate Stripe product — search for `4.99` or `499` (cents)

**Note:** If Stripe price IDs are hardcoded, you will need to create new prices in Stripe and update the IDs. Do not modify existing Stripe prices — create new ones and archive the old ones.

---

## Task 3: Update Subscription Tier Quotas & Limits

Find the configuration where per-tier quotas are defined and update them.

**CRITICAL RULE: NO value in the codebase should be -1, Infinity, or 'unlimited'. Every single resource must have an explicit numeric cap.** Search the entire codebase for `-1`, `Infinity`, `unlimited`, `UNLIMITED`, and replace every instance with the explicit cap from the table below.

**Search for:** the `subscriptionTiers` table definition, or any constants/config file that maps tier names to limits.

### Updated Quotas Table

```typescript
// New tier quota configuration
const tierQuotas = {
  essentials: {
    patients: 100,           // LIFETIME total — never resets
    records: 50,             // MONTHLY cap — resets at billing cycle (half of patients)
    aiCredits: 50,           // UNCHANGED from old Starter (was 50 ScrybeGPT messages, now 50 credits)
    patientPortal: false,
    whatsappTrial: 10,       // NEW: 10 trial WhatsApp messages/month (separate counter)
    telehealth: false,
    fileStorageMB: 500,      // NEW: was no limit — 500MB cap
    services: 5,             // NEW: was undefined "basic" — 5 service catalog entries
    growthCharts: 'all',     // CHANGED: was 'basic' (2 types) — now all 5 types
    dashboard: 'basic',      // daily revenue + total patient count only
    auditRetentionDays: 30,  // NEW: 30 days retention
    staffSeats: 0,           // single doctor only
  },
  professional: {
    patients: 500,           // LIFETIME total — never resets
    records: 250,            // MONTHLY cap — resets at billing cycle (half of patients)
    aiCredits: 300,          // UNCHANGED from old Pro (was 300 ScrybeGPT messages, now 300 credits)
    aiReports: 50,           // UNCHANGED from old Pro
    patientPortal: true,
    whatsappMessages: 300,   // uses AI credit pool (1 credit each, shared with other AI)
    telehealth: false,
    fileStorageMB: 2048,     // NEW: was no limit — 2GB cap
    services: 50,            // NEW: was undefined "full" — 50 services max
    growthCharts: 'all',
    dashboard: 'standard',   // daily + monthly revenue, gender, conditions
    auditRetentionDays: 90,  // NEW: 90 days retention
    staffSeats: 0,           // single doctor
  },
  complete: {
    patients: 1500,          // LIFETIME total — was unlimited, now 3x Professional
    records: 750,            // MONTHLY cap — resets at billing cycle (half of patients)
    aiCredits: 900,          // was unlimited — NOW: 3x Professional (300 x 3)
    aiReports: 150,          // was unlimited — NOW: 3x Professional (50 x 3)
    patientPortal: true,
    whatsappMessages: 900,   // uses AI credit pool (1 credit each, shared with other AI)
    telehealth: true,
    telehealthMinutes: 120,  // NEW: 120 included minutes/month (was unlimited)
    telehealthOverageRate: 0.08, // NEW: $0.08/min past 120
    fileStorageMB: 10240,    // NEW: was no limit — 10GB cap
    services: 200,           // NEW: was undefined "full" — 200 services max
    growthCharts: 'all',
    dashboard: 'full',       // all analytics
    auditRetentionDays: 365, // NEW: 1 year retention
    staffSeats: 3,           // was "coming soon" — NOW: 3 seats
  },
};
```

**Where to apply:**
- Database seed/migration for `subscriptionTiers` table
- Any hardcoded quota checks in Convex mutations/queries
- Usage checking middleware (e.g., `checkUsageLimit()` or similar functions)
- Frontend components that display remaining usage

---

## Task 4: Implement AI Credit System

This is the biggest change. Replace the separate per-feature counters with a **unified credit pool**.

### Credit Weights

```typescript
const AI_CREDIT_WEIGHTS = {
  chat: 1,              // General ScrybeGPT chat message
  patientChat: 1,       // Patient-specific AI chat
  diagnostic: 2,        // AI diagnostic suggestion
  prescription: 2,      // AI medication recommendation
  labExam: 2,           // AI lab exam suggestion
  textCompletion: 1,    // AI text completion
  conditionClassify: 1, // ICD condition classification
  report: 5,            // Full AI medical report
  whatsapp: 1,          // WhatsApp ScrybeGPT message (Pro+ only)
};
```

### What to change:

1. **Update the `usage` table schema** to track a single `aiCreditsUsed` counter instead of (or in addition to) separate `scrybegptMessages`, `aiPrescriptions`, `aiExams`, `aiDiagnostics`, `aiReports` counters.

2. **Update every AI API route** to deduct the correct credit amount:
   - `/api/ai/chat/[patientId]` → deduct 1 credit
   - `/api/ai/scrybegpt` → deduct 1 credit  
   - `/api/ai/prescriptions` → deduct 2 credits
   - `/api/ai/diagnostic` → deduct 2 credits
   - `/api/ai/exams` → deduct 2 credits
   - `/api/ai/report` → deduct 5 credits
   - `/api/ai/completion` → deduct 1 credit
   - `/api/classify-conditions` → deduct 1 credit
   - WhatsApp agent messages → deduct 1 credit per message (for Professional+ users; Essentials uses separate 10-msg counter)

3. **Update the usage check function** — instead of checking `scrybegptMessages < tier.scrybegptLimit`, check `aiCreditsUsed < tier.aiCredits`. Return the remaining credits and the credit cost of the requested action so the frontend can display it.

4. **Update the usage reset** — the monthly cron/trigger that resets usage counters should reset `aiCreditsUsed` to 0 (plus reset the Essentials WhatsApp trial counter).

5. **Frontend usage display** — update the dashboard widget to show:
   ```
   AI Credits: {used} / {limit} used this month
   ```
   With a progress bar. Add a warning banner at 80% usage and a purchase prompt at 100%.

---

## Task 5: Implement AI Message Packs (Stripe One-Time Purchases)

Create a new purchasable product: AI credit packs.

### Pack Definitions

```typescript
const AI_PACKS = [
  { credits: 100,  price: 500,   label: '100 Credits',   priceDisplay: '$5' },
  { credits: 500,  price: 2000,  label: '500 Credits',   priceDisplay: '$20' },
  { credits: 1000, price: 3500,  label: '1,000 Credits', priceDisplay: '$35' },
];
```

### Implementation:

1. **Create Stripe products/prices** for each pack as one-time payments (not subscriptions).

2. **Create a purchase endpoint** — when a doctor clicks "Buy Pack":
   - Create a Stripe Checkout session with `mode: 'payment'` (not subscription)
   - On successful payment (via webhook), increment the doctor's `packCreditsRemaining` field in the `usage` table
   - Pack credits do NOT roll over — they expire at the end of the billing cycle

3. **Update the credit deduction logic** — when deducting credits:
   ```
   if (usage.aiCreditsUsed < tier.aiCredits) {
     // Deduct from included pool
     usage.aiCreditsUsed += creditCost;
   } else if (usage.packCreditsRemaining >= creditCost) {
     // Deduct from purchased packs
     usage.packCreditsRemaining -= creditCost;
   } else {
     // No credits available — show purchase prompt
     return { error: 'NO_CREDITS', packsAvailable: AI_PACKS };
   }
   ```

4. **Update the monthly reset** — on billing cycle reset:
   - Reset `aiCreditsUsed` to 0
   - Reset `packCreditsRemaining` to 0 (packs don't roll over)

5. **Frontend: pack purchase UI** — add a "Buy More Credits" button/modal accessible from:
   - The AI credits dashboard widget
   - The 80% usage warning banner
   - The 100% usage block screen
   - Use Stripe Checkout (same saved payment method) for one-click purchase

---

## Task 6: Unlock Growth Charts on Essentials

Find the growth chart feature gate that restricts Essentials/Starter to only Weight-for-Age and Height-for-Age.

**Search for:** logic that checks the subscription tier before rendering growth chart types, or any filter that limits chart types to `['wfa', 'hfa']` for the Starter tier.

**Change:** Allow all 5 chart types (WFA, HFA, HCFA, BFA, WFL) on all tiers including Essentials.

**Likely locations:**
- Growth chart component (React) — look for a tier check or feature flag
- Convex query that returns available chart types — may filter by tier
- Growth chart page route — may have a tier guard

**Action:** Remove the tier-based filtering for growth chart types entirely. All chart types should be available to all tiers.

---

## Task 7: Add WhatsApp Trial for Essentials

Currently, WhatsApp ScrybeGPT access is completely blocked for Starter users. Change this to allow 10 messages per month on Essentials as a trial.

**Search for:** the WhatsApp access check — likely a function that returns `false` if the doctor's tier is Starter/Essentials.

**Change to:**
```typescript
// Before
if (tier === 'starter') return { allowed: false, reason: 'UPGRADE_REQUIRED' };

// After
if (tier === 'essentials') {
  const waUsage = await getWhatsAppTrialUsage(doctorId);
  if (waUsage >= 10) {
    return { allowed: false, reason: 'TRIAL_LIMIT_REACHED', limit: 10, used: waUsage };
  }
  return { allowed: true, remaining: 10 - waUsage, isTrial: true };
}
```

**Also:**
- Add a `whatsappTrialUsed` counter to the usage table for Essentials users
- Reset it monthly along with other usage counters
- In the WhatsApp webhook handler, check this counter before processing Essentials user messages
- Send a message to the doctor when they hit 10/10: "You've used your 10 free WhatsApp messages this month. Upgrade to Professional for unlimited WhatsApp access."

---

## Task 8: Add Patient-Specific AI to Essentials

Currently, the patient-specific AI chat (`/api/ai/chat/[patientId]`) is blocked for Starter users.

**Change:** Allow Essentials users to use patient-specific AI, counted against their 50-credit AI pool (1 credit per message). The pool is small enough to naturally limit heavy usage — no separate sub-counter needed.

**Search for:** the route handler or middleware that blocks Starter users from `/api/ai/chat/[patientId]`.

**Change to:** Allow access, deducting from the AI credit pool.

---

## Task 9: Update Billing "Basic" Definition

Find where the Essentials/Starter billing features are gated and make "Basic" explicit.

**Essentials billing restrictions:**
- Service catalog: maximum 5 services (not unlimited)
- Receipt generation: view and print only (no create/edit)
- Transaction history: accessible

**Search for:** billing/receipt feature gates, service catalog mutations.

**Add:** A check in the service creation mutation that limits Essentials users to 5 services:
```typescript
if (tier === 'essentials') {
  const serviceCount = await getServiceCount(doctorId);
  if (serviceCount >= 5) {
    throw new Error('Essentials plan limited to 5 services. Upgrade to Professional for unlimited.');
  }
}
```

**Add:** A check in receipt create/edit mutations that blocks Essentials users from creating or editing receipts (they can only view and print receipts auto-generated from appointments).

---

## Task 10: Update Dashboard Analytics Gating

Define what "Basic" dashboard means for Essentials.

**Essentials dashboard shows:**
- Daily revenue chart only (no monthly aggregation)
- Total patient count only (no gender distribution, no condition frequency, no immunization status)
- Today's patients count
- Today's revenue

**Professional dashboard shows:**
- Daily + Monthly revenue charts
- Gender distribution chart
- Common conditions chart
- All patient stats

**Complete dashboard shows:**
- Everything Professional has
- Immunization status chart
- Full analytics suite

**Search for:** Dashboard page component, analytics queries.

**Add:** Conditional rendering based on tier for the advanced analytics widgets.

---

## Task 11: Add File Storage Tracking

Currently there are no per-doctor file storage limits. Add tracking and enforcement.

**New limits:** Essentials: 500MB, Professional: 2GB, Complete: 10GB

**Implementation:**
1. Add a `storageUsedBytes` field to the doctor profile or usage table
2. On every file upload (via UploadThing), add the file size to the counter
3. On file deletion, subtract the file size
4. Before upload, check if the new file would exceed the tier limit
5. Return a clear error: "Storage limit reached ({used}MB / {limit}MB). Delete files or upgrade your plan."

**Search for:** UploadThing upload handler, file attachment creation mutations.

---

## Task 12: Add Telehealth Usage Tracking (Complete Tier)

Currently telehealth has no minute cap. Add a 120 min/month included limit with $0.08/min overage.

**Implementation:**
1. Add `telehealthMinutesUsed` to the usage table
2. When a LiveKit session ends (or on the end-session webhook), calculate the duration and add it to the counter
3. At 120 minutes, don't block — allow the call but track overages
4. At billing cycle end, calculate overage: `max(0, minutesUsed - 120) * 0.08`
5. Charge the overage via Stripe (metered billing or one-time charge)
6. Reset `telehealthMinutesUsed` monthly

**Search for:** LiveKit session management, telehealth appointment completion handler.

---

## Task 13: Update Annual Billing Toggle on Pricing Page

Add a monthly/annual toggle to the pricing page.

**UI Change:**
- Add a toggle switch: "Monthly | Annual (Save 18%)"
- When annual is selected, show the annual per-month prices ($24/$49/$99) with the annual total below
- The CTA button should create a Stripe Checkout session with `recurring.interval: 'year'`

**Search for:** Pricing page component, checkout session creation.

---

## Task 14: Update All Frontend Copy

Update the pricing page, feature comparison table, and any marketing copy.

**Tier descriptions:**
```
Essentials — For pediatricians starting their digital practice
Professional — For established solo practitioners (RECOMMENDED)
Complete — For high-volume practices and clinics
Institution — For hospitals, NGOs, and health systems
```

**Feature comparison table:** Update to match the new quota table from Task 3.

**AI section copy:**
```
Before: "50 ScrybeGPT messages" / "300 messages" / "Unlimited"
After:  "50 AI credits/month" / "300 AI credits/month" / "900 AI credits/month"
```

**Add to pricing page:**
- "Need more AI credits? Buy packs starting at $5" link
- Annual savings callout badge on Professional tier
- "Most Popular" or recommended badge on Professional tier

---

## Task 15: Update Email Templates

Update the welcome email and any tier-reference emails.

**Search for:** React Email templates in the codebase (likely in a `emails/` or `components/emails/` directory).

**Update:** All references to tier names (Starter→Essentials, Pro→Professional, Premium→Complete).

---

## Task 16: Add Institution Tier (Placeholder)

Create a basic Institution tier that shows on the pricing page but routes to a contact form.

**Implementation:**
1. Add "Institution" as a tier option in the `subscriptionTiers` table with `isCustom: true`
2. On the pricing page, add a 4th card: "Institution — Custom Pricing" with a "Contact Sales" button
3. The button should link to `/contact` or open an email to the sales contact
4. Do NOT create a Stripe product for this tier — it's handled manually

---

## Execution Order

Run these tasks in this order to minimize breakage:

1. **Task 1** — Rename tiers (global search/replace)
2. **Task 2** — Update Stripe prices + add annual
3. **Task 3** — Update quota configuration
4. **Task 6** — Unlock growth charts (quick win)
5. **Task 8** — Allow patient-specific AI on Essentials
6. **Task 7** — Add WhatsApp trial for Essentials
7. **Task 4** — Implement AI credit system (biggest change)
8. **Task 5** — Implement message packs
9. **Task 9** — Define Basic billing
10. **Task 10** — Dashboard analytics gating
11. **Task 11** — File storage tracking
12. **Task 12** — Telehealth usage tracking
13. **Task 13** — Annual billing toggle
14. **Task 14** — Frontend copy updates
15. **Task 15** — Email template updates
16. **Task 16** — Institution tier placeholder

---

## Testing Checklist

After implementation, verify:

- [ ] **ZERO UNLIMITED: grep -r "unlimited\|Infinity\|-1" finds ZERO matches in tier configs/usage checks**
- [ ] All tier names display correctly across UI (pricing, dashboard, settings, emails)
- [ ] Monthly checkout creates subscription at new prices ($29/$59/$119)
- [ ] Annual checkout creates yearly subscription at correct amounts ($288/$588/$1,188)
- [ ] Scrybe Assist checkout charges $6.99 (not $4.99)
- [ ] Essentials users can access all 5 growth chart types
- [ ] Essentials users can send patient-specific AI messages (deducts from 50-credit pool)
- [ ] Essentials users can send up to 10 WhatsApp messages per month
- [ ] Essentials users see AI reports option (5 credits each, limited by 50-credit pool)
- [ ] Professional users have 300-credit AI pool (UNCHANGED from old Pro)
- [ ] Complete users have 900-credit AI pool (NOT unlimited — 3x Professional)
- [ ] Complete users have 1,500 patient cap (NOT unlimited — 3x Professional)
- [ ] Complete users have 750 record cap (NOT unlimited — half of 1,500 patients)
- [ ] Complete users have 10GB storage cap (NOT unlimited)
- [ ] Complete users have 200 service catalog cap (NOT unlimited)
- [ ] Complete users have 120 telehealth minute cap with $0.08/min overage
- [ ] Complete users have 3 staff seats (NOT unlimited)
- [ ] Audit log retention enforced: 30/90/365 days per tier
- [ ] Credit deduction works correctly: chat=1, Dx/Rx/Lab=2, report=5
- [ ] Message pack purchase works (one-time Stripe payment → credits added)
- [ ] Pack credits are consumed after included credits are exhausted
- [ ] All credits (included + pack) reset at billing cycle
- [ ] 80% usage warning banner appears
- [ ] 100% usage block screen appears with pack purchase option
- [ ] File storage limits are enforced per tier
- [ ] Telehealth minutes are tracked; overages calculated correctly
- [ ] Service catalog limited to 5 for Essentials
- [ ] Dashboard analytics gated by tier
- [ ] Annual/monthly toggle works on pricing page
- [ ] Existing users are grandfathered (see note below)

---

## Grandfathering Existing Users

**Critical:** Do not break existing subscriptions.

- Existing users on the old Starter/Pro/Premium plans should continue on their current prices for 90 days
- After 90 days, migrate them to the new pricing on their next billing cycle
- Send an email notification 30 days before the migration: "Your plan is being upgraded with more features. Your new rate will be [new price] starting [date]."
- Implement this via a `legacyPricing: true` flag on existing subscriptions, with a scheduled job to flip it after 90 days

---

## Notes for Claude Code

- **ZERO UNLIMITED RULE:** There must be NO instance of -1, Infinity, or 'unlimited' anywhere in the tier configuration or usage checking logic. Every single resource (patients, records, AI credits, telehealth minutes, services, storage, audit logs, staff seats) must have an explicit numeric cap. After completing all tasks, search the entire codebase for `-1`, `Infinity`, `unlimited`, `UNLIMITED`, `Number.MAX_SAFE_INTEGER` and fix any remaining instances.
- The codebase uses Next.js + Convex + TypeScript + Stripe
- Convex mutations/queries are in the `convex/` directory
- API routes are in `app/api/` (Next.js App Router)
- React components are in `components/` or `app/` 
- Stripe webhook handler processes subscription events
- Search for `subscriptionTiers`, `usage`, `checkUsage`, `TIER`, `isFeatureEnabled` as entry points
- The AI routes use Vercel AI SDK with a fallback chain — the credit deduction should happen BEFORE the AI call, not after (to prevent usage without payment on failed calls; refund the credit if the AI call fails)
