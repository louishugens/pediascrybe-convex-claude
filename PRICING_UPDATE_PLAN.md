# Pediascrybe Pricing Restructure — Execution Plan

## Context

The source of truth is `Pricing Update Instructions - Claude.md` (project root, 564 lines). It defines a full pricing rewrite:

- **Rename** tiers: Starter→Essentials, Pro→Professional, Premium→Complete. Add a 4th "Institution" tier (custom / contact sales).
- **Reprice**: Essentials $29 (unchanged), Professional $49→$59, Complete $99→$119, plus new annual plans ($288/$588/$1,188) and Scrybe Assist $4.99→$6.99.
- **Replace** the per-feature usage counters (`scrybegptMessages`, `aiPrescription`, `aiLabExam`, `aiDiagnostic`, `aiReport`) with a unified `aiCreditsUsed` pool. Add a purchasable pack system (`packCreditsRemaining`) with one-time Stripe checkout.
- **Kill every "unlimited" (-1) sentinel.** The Complete tier must have explicit caps (1500 patients, 900 credits, 10GB storage, 120 telehealth min, 200 services, 3 staff seats, 365-day audit retention).
- **Unlock** all 5 growth chart types and patient-specific AI on Essentials; give Essentials a 10-message WhatsApp trial.
- **Track new resources** that don't exist today: file storage bytes, telehealth minutes, WhatsApp trial usage, service catalog count.
- **No grandfathering**: the product is still in testing, so existing test subscribers will be deleted rather than migrated. No `legacyPricing` flag, no 90-day cron, no pre-migration email.

The audit confirms the codebase currently has:
- `-1` used as the unlimited sentinel in ~30 spots across `convex/subscriptions.ts`, `convex/usage.ts`, `convex/whatsappData.ts`, `convex/portalAi.ts`
- Hardcoded tier limits in TWO seed locations: `convex/seed.ts:137-284` and `convex/stripe.ts:655-797` (must both be updated or consolidated)
- **NO** monthly reset cron wired up (`usage.resetUsageForPeriod` exists at `convex/usage.ts:576` but is not scheduled)
- **NO** `aiCreditsUsed`, `packCreditsRemaining`, `whatsappTrialUsed`, `storageUsedBytes`, or `telehealthMinutesUsed` fields
- **NO** annual interval, institution tier, or overage-billing infrastructure

This plan organizes the 16 tasks from the instructions file into a safe execution order, anchors every task to concrete files, and flags the migration risks.

---

## Critical Files

### Backend — schema & tier config (touch early, cascades everywhere)
- `convex/schema.ts:383-399` — `usage` table (add `aiCreditsUsed`, `packCreditsRemaining`, `whatsappTrialUsed`, `telehealthMinutesUsed`, `storageUsedBytes`)
- `convex/schema.ts:403-426` — `subscriptionTiers` table `limits` object (add new fields, drop `-1`)
- `convex/schema.ts:268-298` — `subscriptions` table (add `billingInterval`)
- `convex/schema.ts:431-450` — `patientSubscriptions` (Scrybe Assist $6.99)
- `convex/seed.ts:137-284` — `seedSubscriptionTiers` mutation (primary tier values)
- `convex/stripe.ts:655-797` — duplicate `seedSubscriptionTiers` internal mutation + `seedStripeProducts` action (lines 580-651)

### Backend — tier logic & usage
- `convex/subscriptions.ts:8-39` — `FEATURE_ACCESS` map (rename keys, add `patient_specific_ai`, widen `all_growth_charts`, change `whatsapp_scrybegpt` to include essentials-with-trial logic)
- `convex/subscriptions.ts:44-83` — `getCurrentTier` (name mapping)
- `convex/subscriptions.ts:236-275` — `hasFeatureAccess`
- `convex/subscriptions.ts:289-342` — `getSubscriptionLimits`
- `convex/subscriptions.ts:345-413` — `canAddPatient` (drop the `limit === -1` branch)
- `convex/subscriptions.ts:418-507` — `upsertSubscription` (handle monthly vs annual price IDs)
- `convex/usage.ts:140-143` — `calculateRemaining` / `calculatePercent` (drop `-1` branches)
- `convex/usage.ts:330-410` — `checkMonthlyQuota` helper
- `convex/usage.ts:413-468` — per-feature quota queries (collapse to `checkAICreditQuota`)
- `convex/usage.ts:473-555` — `incrementUsageField` + per-feature increments (replaced by `deductAICredits`)
- `convex/usage.ts:575-595` — `resetUsageForPeriod` (extend to zero counters, not just GC)

### Backend — Stripe & webhooks
- `convex/stripe.ts:89-126` — `createSubscriptionCheckout` (accept `billingInterval`, map to annual price)
- `convex/stripe.ts:159-188` — `createPortalSession`
- `convex/stripe.ts:191-292` / `295-379` — sync flows
- `convex/stripe.ts:405-414` — `getTierByPriceId` (must resolve both monthly and annual price IDs → same tier)
- `convex/stripeWebhooks.ts:135-250` — `syncSubscription` (write `billingInterval`; handle new price IDs)
- `convex/patientSubscriptions.ts:293-310` — Scrybe Assist product (`499` → `699`; update description)
- New file: `convex/aiPacks.ts` — pack catalog, `createPackCheckout` action, `applyPackCredits` internal mutation
- `app/api/stripe/webhook/route.ts` — route pack `checkout.session.completed` with `mode: 'payment'` to `aiPacks.applyPackCredits`

### Backend — AI routes (credit deduction)
Each must `deductAICredits` BEFORE the model call and `refundAICredits` on failure:
- `app/api/ai/scrybegpt/route.ts:16-235` — chat (1 credit)
- `app/api/ai/chat/[patientId]/route.ts` — patient chat (1 credit; UNBLOCK essentials)
- `app/api/ai/prescriptions/route.ts:29-114` — 2 credits (cache hit ⇒ no deduction)
- `app/api/ai/exams/route.ts:29-107` — 2 credits (cache hit ⇒ no deduction)
- `app/api/ai/diagnostic/route.ts:9-56` — 2 credits
- `app/api/ai/report/route.ts:8-45` — 5 credits
- `app/api/ai/completion/route.ts` — 1 credit
- `app/api/classify-conditions/route.ts:19-62` — 1 credit

### Backend — WhatsApp / Telehealth / Storage
- `convex/whatsapp.ts:45-200+` — `handleIncomingWebhook` (essentials branch: check `whatsappTrialUsed < 10` before processing; other tiers deduct 1 AI credit)
- `convex/whatsappData.ts:942` — drop the `limit === -1` branch
- `convex/telehealth.ts:571,610` — add minute calculation on session end; write `telehealthMinutesUsed`
- New overage cron: extend `convex/crons.ts` and add a monthly billing job that pushes `(used - 120) * $0.08` to Stripe as a one-time invoice item
- `convex/patientFiles` / `convex/files.ts` — add `storageUsedBytes` delta on create/delete
- UploadThing handler — reject uploads that would push `storageUsedBytes` past the tier cap

### Backend — Crons & migrations
- `convex/crons.ts:4-20` — add `reset-monthly-usage` (1st of month, 00:00 UTC) and `telehealth-overage-billing` (1st of month)
- New file: `convex/migrations.ts` — one-shot wipe script: (a) delete all rows in `subscriptions`, `patientSubscriptions`, `usage`, `patientUsage`, and cancel+delete matching Stripe test customers, (b) re-seed `subscriptionTiers` with the new names/limits, (c) zero `storageUsedBytes` on all doctor profiles

### Frontend — tier display, gates, pricing page
- `app/(public)/pricing/page.tsx:1-383` — public pricing (4 cards, monthly/annual toggle, "Most Popular" on Professional, annual savings badge)
- `app/user/pricing/page.tsx:1-417` — in-app pricing (same structure + current-plan highlight)
- `app/user/settings/subscription/page.tsx:1-426` — billing page (show AI credits + pack balance + pack purchase CTA, swap per-feature counters for unified credit widget)
- `components/subscription-section.tsx:1-326` — dashboard compact widget
- `hooks/use-subscription-guard.tsx:8-30` — client-side `FEATURE_ACCESS` mirror (must stay in sync with `convex/subscriptions.ts`)
- `components/subscription-guard.tsx:1-240` — `SubscriptionGuard` + `AIQueryGuard` (point `AIQueryGuard` at `checkAICreditQuota`)
- `components/upgrade-modal.tsx:1-277` — add "Buy credits" CTA path and pack picker
- `components/subscription-dialog.tsx:84-95` — update prices grid
- `components/nav-main.tsx` — navigation gates cascade once `FEATURE_ACCESS` changes

### Frontend — new gating surfaces (today: ungated)
- `app/user/page.tsx:1-54` + `components/dashboard/charts/*` — wrap advanced widgets (`GenderDistributionContainer`, `CommonConditionsContainer`, `ImmunizationStatusContainer`, monthly revenue) in tier checks
- Growth chart component — find and **remove** the `['wfa','hfa']` filter for Starter/Essentials
- `app/user/profile/page.tsx:110-138` — service catalog create flow (enforce 5/50/200 caps via mutation, plus client-side "Upgrade" prompt)
- `app/user/patients/[patientId]/(withLayout)/receipts/*` — block create/edit for essentials (view + print only)
- `app/user/settings/whatsapp/page.tsx:1-276` — show "Trial: X/10" banner for essentials
- `app/user/telehealth/appointments/page.tsx:1-210` + call page — show minutes used / 120, overage warning
- `.../upload-file/upload-form.tsx:1-143` — storage-used bar, pre-upload size check

### Frontend — new components to build
- `components/billing/CreditBalanceWidget.tsx` — unified credits display with 80%/100% warnings
- `components/billing/BuyCreditPacksDialog.tsx` — Stripe Checkout for packs
- `components/billing/BillingIntervalToggle.tsx` — monthly/annual pill toggle for pricing pages
- `components/billing/StorageUsageBar.tsx`, `components/telehealth/MinuteUsageBar.tsx`

---

## Execution Phases (Todo)

Phases run top-to-bottom. Inside a phase, order matters less, but don't cross phase boundaries early — each phase assumes the previous is deployed & migrated.

### Phase 0 — Pre-flight (do before any code)
- [ ] 0.1 Monthly/annual Stripe price IDs will be created fresh in Stripe test mode; old placeholder prices archived.
- [ ] 0.2 Wipe existing test data: truncate `subscriptions`, `patientSubscriptions`, `usage`, `patientUsage`, `subscriptionTiers`, `prices`, `products`, and delete corresponding Stripe test customers/subscriptions. No grandfathering to worry about.
- [ ] 0.3 Create a feature branch; open a draft PR for visibility through the migration.

### Phase 1 — Rename tiers (Task 1)
Pure find/replace. Ship and verify before touching prices.
- [ ] 1.1 Update `convex/schema.ts:403-426` tier name comments and `subscriptionTiers.name` accepted literals (`"essentials" | "professional" | "complete" | "institution"`).
- [ ] 1.2 Update `convex/subscriptions.ts:8-39` `FEATURE_ACCESS` keys and every `["pro","premium"]`/`["premium"]` array to new names.
- [ ] 1.3 Update both seed files in lockstep: `convex/seed.ts:137-284` and `convex/stripe.ts:655-797`.
- [ ] 1.4 Find every literal `"starter"|"pro"|"premium"` in `convex/` and `app/api/` — grep confirms hits in `subscriptions.ts`, `usage.ts`, `whatsapp.ts`, guards.
- [ ] 1.5 Frontend literals: `app/(public)/pricing/page.tsx:82-90`, `app/user/settings/subscription/page.tsx:61-71`, `components/subscription-section.tsx:54-78`, `components/subscription-dialog.tsx:84-95`, `components/upgrade-modal.tsx:88-112`, `components/subscription-guard.tsx:88`, `hooks/use-subscription-guard.tsx:8-30`.
- [ ] 1.6 No in-place rename migration needed — Phase 0.2 already wiped the tables. New seeds (step 1.3) write the new names directly.
- [ ] 1.7 Post-rename grep: `Starter|Pro plan|Premium plan` — every remaining hit must be a third-party product ref (Convex Pro, Resend Pro) or marketing copy that will be rewritten in Phase 9.
- [ ] 1.8 Typecheck + run app locally; smoke-test login, dashboard, billing page.

### Phase 2 — Stripe repricing & annual support (Task 2)
- [ ] 2.1 Create new Stripe products/prices (monthly + annual) for Essentials/Professional/Complete via Stripe dashboard or `seedStripeProducts` action. Archive old prices.
- [ ] 2.2 Add `billingInterval: v.union(v.literal("month"), v.literal("year"))` to `subscriptions` table in `convex/schema.ts`.
- [ ] 2.3 Extend `subscriptionTiers.limits` with dual price IDs (`stripeMonthlyPriceId`, `stripeAnnualPriceId`) or introduce a `tierPrices` sub-table; update `getTierByPriceId` (`convex/stripe.ts:405-414`) to match against both.
- [ ] 2.4 `createSubscriptionCheckout` (`convex/stripe.ts:89-126`) — accept `billingInterval`; resolve the right price ID; pass through `syncSubscription`.
- [ ] 2.5 `stripeWebhooks.syncSubscription` — persist `billingInterval` from `price.recurring.interval`.
- [ ] 2.6 `convex/patientSubscriptions.ts:293-310` — Scrybe Assist `499` → `699`; update description copy to "$6.99/mo".
- [ ] 2.7 Test checkout via Stripe test mode for all 6 combinations (3 tiers × monthly/annual) + Scrybe Assist.

### Phase 3 — Quota table rewrite, kill -1 sentinels (Task 3)
This phase is the hinge: once limits are explicit, every `-1` check must be gone.
- [ ] 3.1 Extend `convex/schema.ts:403-426` `subscriptionTiers.limits` with new numeric fields: `fileStorageMB`, `services`, `staffSeats`, `auditRetentionDays`, `telehealthMinutes`, `telehealthOverageRate`, `whatsappTrial`, `whatsappMessages`, `dashboardTier` (`"basic"|"standard"|"full"`), `growthCharts` (`"all"`), `patientPortal`, `telehealth`.
- [ ] 3.2 Rewrite both seed files to emit the exact numbers from the instructions table (essentials 100/50/50, professional 500/250/300, complete 1500/750/900, etc.). Seed an Institution tier row with `isCustom: true`.
- [ ] 3.3 `convex/subscriptions.ts:345-413` `canAddPatient` — delete `if (patientLimit === -1)` branch.
- [ ] 3.4 `convex/usage.ts:140-143,217,295,375` — remove every `limit === -1` branch; `calculateRemaining` now always `Math.max(0, limit - current)`.
- [ ] 3.5 `convex/whatsappData.ts:942` — drop `-1` branch.
- [ ] 3.6 `convex/portalAi.ts:185` — premium patient AI capped at **50 explanations/month** (free tier stays at 5). Replace the `remaining: -1, isPremium: true` return with an actual counter check.
- [ ] 3.7 Run the instructions' mandated grep: `-1`, `Infinity`, `Number.MAX_SAFE_INTEGER`, `unlimited|UNLIMITED` — scope to tier/usage files; zero unrelated hits.
- [ ] 3.8 No cleanup migration needed — tables were wiped in Phase 0.2 and re-seeded in 3.2.

### Phase 4 — Quick wins (Tasks 6 + 8)
Small, isolated, high-confidence wins. Ship with Phase 3.
- [ ] 4.1 Find growth chart tier filter (likely in `components/growth-charts/*` or `convex/growthCharts.ts`) — delete `['wfa','hfa']` restriction.
- [ ] 4.2 Update `FEATURE_ACCESS.all_growth_charts` to include essentials.
- [ ] 4.3 Unblock `/api/ai/chat/[patientId]` for essentials; route keeps the credit deduction path from Phase 6.

### Phase 5 — WhatsApp trial for Essentials (Task 7)
- [ ] 5.1 Add `whatsappTrialUsed` to `usage` table (Phase 3 already did this; confirm).
- [ ] 5.2 `convex/whatsapp.ts` handler — branch on tier: essentials checks `whatsappTrialUsed < 10`, increments on success; professional/complete deduct 1 AI credit (Phase 6 wires the deduction).
- [ ] 5.3 When essentials hits 10/10, send outbound WhatsApp: "You've used your 10 free messages this month. Upgrade to Professional for more."
- [ ] 5.4 Reset `whatsappTrialUsed` alongside other counters in the monthly cron.

### Phase 6 — AI credit system (Task 4)
The largest change — don't start until 1–5 are stable.
- [ ] 6.1 Rewrite `usage` table: DELETE `scrybegptMessages`, `aiPrescription`, `aiLabExam`, `aiDiagnostic`, `aiReport`, `aiQueries`, `documentGeneration`. ADD `aiCreditsUsed: number` and `packCreditsRemaining: number` (both default 0). No rollback path — product isn't live.
- [ ] 6.2 New file `convex/aiCredits.ts` exporting `AI_CREDIT_WEIGHTS`, `deductAICredits(ctx, doctorId, feature)`, `refundAICredits(...)`, `getCreditBalance(doctorId)`. Deduction order: included pool first, then pack balance, then throw `NO_CREDITS`.
- [ ] 6.3 DELETE `checkScrybeGPTQuota`/`checkAIPrescriptionQuota`/`checkAILabExamQuota`/`checkAIDiagnosticQuota`/`checkAIReportQuota`/`canMakeAIQuery`/`canGenerateDocument` + their increment mutations (`convex/usage.ts:413-555`). Replace with single `checkAICreditQuota(costHint)` query and `deductAICredits` mutation.
- [ ] 6.4 Wire every AI route to call `deductAICredits` BEFORE the model call and `refundAICredits` on thrown errors. Cache hits in `prescriptions.ts` / `exams.ts` must NOT deduct.
- [ ] 6.5 Update `components/subscription-guard.tsx` `AIQueryGuard` (lines 98-193) to use the unified query.
- [ ] 6.6 Build `components/billing/CreditBalanceWidget.tsx` and drop it into the dashboard + subscription page. Warning at 80%, block screen with "Buy credits" CTA at 100%.
- [ ] 6.7 Extend the (newly scheduled) monthly reset cron to zero `aiCreditsUsed`, `packCreditsRemaining`, `whatsappTrialUsed`, `telehealthMinutesUsed`, and per-patient portal counters.

### Phase 7 — AI credit packs (Task 5)
- [ ] 7.1 Create 3 Stripe one-time prices ($5 / $20 / $35). Store IDs in a new `aiPackProducts` config or env.
- [ ] 7.2 `convex/aiPacks.ts` — `createPackCheckout` action (Stripe checkout `mode: 'payment'`), `applyPackCredits` internal mutation.
- [ ] 7.3 Extend `app/api/stripe/webhook/route.ts` to route `checkout.session.completed` with `metadata.pack=true` to `aiPacks.applyPackCredits`.
- [ ] 7.4 `components/billing/BuyCreditPacksDialog.tsx` — mounted from the credit balance widget, upgrade modal, and 100% block screen.
- [ ] 7.5 Confirm packs are wiped in the monthly reset (instructions: pack credits do NOT roll over).

### Phase 8 — Explicit caps for previously loose resources (Tasks 9–12)
These are independent; can be parallelized once Phase 6 lands.
- [ ] 8.1 **Services cap (Task 9):** mutation guard in `convex/services.ts` (or wherever `addService` lives) enforcing 5/50/200. Frontend upgrade prompt in `app/user/profile/page.tsx:110-138`.
- [ ] 8.2 **Receipts lockdown (Task 9):** block `createReceipt`/`updateReceipt` for essentials; receipts auto-generated from appointments remain viewable/printable.
- [ ] 8.3 **Dashboard gating (Task 10):** wrap `GenderDistributionContainer`, `CommonConditionsContainer`, `ImmunizationStatusContainer`, monthly-revenue chart in `components/dashboard/charts/*` with tier checks; essentials shows daily revenue + total patient count only.
- [ ] 8.4 **File storage tracking (Task 11):** add `storageUsedBytes` to `usage`; delta on every file create/delete (`convex/patientFiles`, `convex/files.ts`, UploadThing handler); pre-upload check; `StorageUsageBar` widget.
- [ ] 8.5 **Telehealth minutes (Task 12):** in `convex/telehealth.ts:571,610`, compute `ceil((sessionEndedAt - sessionStartedAt) / 60000)` and add to `telehealthMinutesUsed`. Allow overages — don't block — but on the 1st-of-month billing cron, push `max(0, used - 120) * 0.08` as a Stripe invoice item on the Complete subscription.
- [ ] 8.6 Audit log retention: enforce 30/90/365 days in the cleanup cron (if one exists) or add it.

### Phase 9 — Pricing UI & marketing copy (Tasks 13 + 14)
- [ ] 9.1 Build `BillingIntervalToggle` and wire into both pricing pages. Copy: "Monthly | Annual (Save 17%)".
- [ ] 9.2 Rewrite both pricing pages to 4 cards (Essentials / Professional [RECOMMENDED] / Complete / Institution [Contact Sales]).
- [ ] 9.3 Update the feature comparison table to exactly match Phase 3's quota table.
- [ ] 9.4 Add "Need more credits? Packs from $5" link below each tier card.
- [ ] 9.5 `app/user/settings/subscription/page.tsx` — rip out the 3 per-feature progress bars, replace with credit balance + pack history.

### Phase 10 — Institution tier (Task 16)
- [ ] 10.1 Seed `subscriptionTiers` row with `name: "institution"`, `isCustom: true`, no Stripe price.
- [ ] 10.2 Pricing pages render a 4th card with "Contact Sales" → `/contact` or mailto.
- [ ] 10.3 No checkout path; webhook ignores; billing page hides usage (or shows "Managed — contact your account manager").

### Phase 11 — Emails (Task 15)
- [ ] 11.1 Audit `convex/emails/*` for any tier-name strings (audit pass found none today — re-verify after Phase 1).
- [ ] 11.2 Update the welcome email tier/price references if any surface during Phase 1.
- [ ] 11.3 No grandfathering emails, no migration cron, no `legacyPricing` flag — skipped entirely per testing-phase decision.

### Phase 12 — Verification & ship
- [ ] 12.1 Run the full 30-item testing checklist from the instructions file (lines 508-539).
- [ ] 12.2 Grep `-r "unlimited\|Infinity\|-1"` across `convex/` and `app/api/` — zero in tier/usage contexts.
- [ ] 12.3 Stripe test-mode run-through: new subscription (monthly + annual), upgrade, downgrade, cancel, pack purchase, overage invoice.
- [ ] 12.4 Local smoke test on all three tiers: quota enforcement, growth charts, WhatsApp trial, dashboard gating, storage bar, telehealth minute display.
- [ ] 12.5 Draft release notes + in-app changelog banner.
- [ ] 12.6 Deploy to staging → soak → production. Monitor Convex logs + Stripe webhook error rate for 48h.

---

## Decisions Locked In

1. **No grandfathering** — product is in testing; Phase 0 wipes all test subs + Stripe test customers.
2. **Parent AI (Scrybe Assist Premium) capped at 50 explanations/month** (free stays at 5).
3. **Telehealth overage = one-time invoice items** pushed on the 1st-of-month cron — no Stripe metered billing.
4. **Old per-feature counters deleted in the Phase 6 PR** — not kept for rollback since nothing is live.

## Remaining Risks

1. **Stripe IDs**: `price_*_placeholder` must be replaced with real test-mode IDs before Phase 2 flips traffic. `seedStripeProducts` action needs to run against the real Stripe test account.
2. **Double seed source**: `convex/seed.ts` and `convex/stripe.ts` both hardcode tier limits. I will update both; follow-up PR should consolidate to one source of truth (out of scope here).
3. **WhatsApp sub-cap semantics**: instructions say Pro/Complete WhatsApp "uses AI credit pool (1 credit each)" AND list `whatsappMessages: 300/900`. I will treat the 300/900 as a **hard sub-cap** enforced alongside the AI pool, so a doctor can't burn their entire credit pool on WhatsApp alone. Flag if you disagree.

---

## Verification

End-to-end smoke test after ship:

```bash
# 1. Typecheck & build
pnpm typecheck && pnpm build

# 2. Grep for unlimited sentinels in tier/usage files
rg -n "(-1|Infinity|MAX_SAFE_INTEGER|unlimited)" convex/subscriptions.ts convex/usage.ts convex/whatsappData.ts convex/portalAi.ts convex/schema.ts convex/seed.ts convex/stripe.ts

# 3. Tier rename sweep — only third-party hits should remain
rg -nw "Starter|Premium" -g '!node_modules' -g '!*.md' -g '!pnpm-lock.yaml'
rg -nw "Pro" -g '!node_modules' -g '!*.md' -g '!pnpm-lock.yaml' convex/ app/ components/

# 4. Local dev: run through the tier checklist manually
pnpm dev
```

Then execute the instructions' 30-item Testing Checklist (lines 508-539) against staging, using three test accounts (one per tier).
