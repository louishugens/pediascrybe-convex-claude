# Pediascrybe Launch Plan

> Once approved, this file will be copied to the project root as `LAUNCH-PLAN.md`.

## Context

Pediascrybe is feature-complete (~64K LoC, 36 tables, 4 revenue streams, 13 major systems) and the founder wants to launch in a few days. The codebase has accumulated three planning docs (SECURITY-AUDIT, PLAN-AI-GATEWAY, SCRYBEGPT_WHATSAPP_PLAN) plus an analysis doc (COST_AUDIT, FEATURES, VALUATION). The AI gateway and security audit phases are mostly DONE, but the project has **never been deployed to production**: Convex is on a `dev:` deployment, Stripe is in test mode, `.env.local` has localhost URLs, no privacy policy exists, and a few security/audit items remain. This plan consolidates **everything that must happen before pressing launch** into one ordered checklist, grouped by blocker severity. Bracketed `[source]` annotations point to where each task originates so you can trace the rationale.

---

## P0 — Hard Blockers (cannot launch without these)

### 1. Production Convex deployment
- `.env.local` currently points at `dev:groovy-crocodile-680` (`https://groovy-crocodile-680.convex.cloud`).
- Create the Convex production deployment: `npx convex deploy --prod` (or via dashboard).
- Push **all** Convex env vars to prod: `KAPSO_API_KEY`, `KAPSO_PHONE_NUMBER_ID`, `KAPSO_WEBHOOK_SECRET`, `AI_GATEWAY_API_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET` (live), `CACHE_KEY_SECRET`, `CACHE_ENCRYPTION_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_WEBHOOK_SECRET` (if used). Use fresh secrets — see §4.
- Run `npx convex run subscriptions:seedTiers` (or your equivalent seeder) on prod. Verify the `subscriptionTiers`, `products`, `prices` rows exist.
- Re-run `convex/seed.ts` if it seeds reference data (vaccine references, WHO charts) — `convex/charts.ts` and `scripts/migrate-reference-data.ts` for WHO references.
- Verify cron jobs registered: `whatsapp-daily-summary` (hourly) and `consolidate-preferences` (weekly Sunday). [convex/crons.ts:7,14]

### 2. Vercel production deployment
- No `vercel.json` — defaults are fine. Connect the GitHub repo (`main` branch) to a new Vercel project, framework = Next.js.
- Set Vercel env vars (production scope):
  - `NEXT_PUBLIC_CONVEX_URL` → prod Convex URL
  - `NEXT_PUBLIC_CONVEX_SITE_URL` → prod Convex `.site` URL
  - `NEXT_PUBLIC_SITE_URL=https://app.pediascrybe.com`
  - `SITE_URL=https://app.pediascrybe.com`
  - `NEXT_PUBLIC_LIVEKIT_URL=wss://pediascrybe-a71wj1hs.livekit.cloud`
  - `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_POSTHOG_KEY`
  - `NEXT_PUBLIC_SCRYBEGPT_PHONE_NUMBER`
  - `PATIENT_STRIPE_PRICE_ID` → **live mode** price id (see §3)
  - `OPENAI_API_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET` (live)
  - `AI_GATEWAY_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - `CACHE_KEY_SECRET`, `CACHE_ENCRYPTION_KEY` (must match Convex env — same values)
- Run `npm run build` locally first to catch any TS / lint / `cacheComponents` errors before pushing.
- Verify both Vercel BotID protection paths still work in prod. [instrumentation-client.ts:14]

### 3. Switch Stripe to LIVE mode end-to-end
- `.env.local` currently has `sk_test_*`. [.env.local:11]
- Create live versions of all products in Stripe Dashboard:
  - Doctor Starter ($29/mo + annual)
  - Doctor Pro ($49/mo + annual)
  - Doctor Premium ($99/mo + annual)
  - Patient Scrybe Assist ($4.99/mo)
- Capture each new live `price_id`. Update DB rows in `prices`/`products` (run a seed script against prod Convex) AND set `PATIENT_STRIPE_PRICE_ID` to the new live id.
- Create the live webhook endpoint pointing at `https://app.pediascrybe.com/api/stripe/webhooks` (or wherever `convex/stripeWebhooks.ts` listens — verify path in `convex/http.ts`). Subscribe to: `customer.subscription.created/updated/deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.trial_will_end`, `checkout.session.completed`.
- Set `STRIPE_WEBHOOK_SECRET` from the live endpoint, push to both Vercel and Convex envs.
- Re-test: 7-day trial → upgrade → downgrade → cancel → renew. Use a real card in live mode ($1 test product if needed, then refund).
- Implement remaining `TODO`s in `convex/http.ts:170` (failed payment email) and `convex/http.ts:177` (trial-ending email) — these are user-facing and currently silent.

### 4. Rotate every secret exposed in this conversation
- `.env.local` was loaded into this chat context, so the following keys must be considered burned and rotated **before** going live:
  - `RESEND_API_KEY`
  - `OPENAI_API_KEY`
  - `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (will be replaced anyway by live keys in §3)
  - `AI_GATEWAY_API_KEY`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`
  - `KAPSO_API_KEY` / `KAPSO_WEBHOOK_SECRET`
  - `CACHE_KEY_SECRET` / `CACHE_ENCRYPTION_KEY` (rotating these invalidates existing cache — fine pre-launch, NOT fine post-launch)
  - `STRIPE_WEBHOOK_SECRET` from PATIENT_STRIPE_PRICE_ID context
- Confirm `.env.local` is still gitignored (`git check-ignore -v .env.local`). The security audit noted `.env` was historically committed once — verify no live secrets are in git history (`git log --all -S 'sk_live'` and `git log --all -S 'sk_proj'`).
- After rotation, push the new values to Convex AND Vercel envs (§1, §2).

### 5. Domain + DNS
- Confirm `pediascrybe.com` and `app.pediascrybe.com` are registered.
- Point `app.pediascrybe.com` → Vercel (CNAME or A/AAAA per Vercel instructions).
- Point apex `pediascrybe.com` → marketing site (or redirect to `app.`).
- Verify Better Auth's `baseURL` / `trustedOrigins` in `convex/betterAuth/` are set to `https://app.pediascrybe.com` for production. Also check Convex auth config in `convex/auth.config.ts`.
- Verify Resend sending domain (`pediascrybe.com`) is verified with DKIM/SPF/DMARC; otherwise transactional email lands in spam.
- Configure Stripe Customer Portal return URLs to use the live domain.
- Verify Kapso webhook URL is updated to the **production** Convex `.site` URL, NOT `groovy-crocodile-680.convex.site`. [SCRYBEGPT_WHATSAPP_PLAN.md:1052]

### 6. Privacy Policy + medical disclaimers
- Only `/(public)/terms/page.tsx` exists. **No privacy policy page exists.** [grep result]
- This is medical software touching PHI — launching without a privacy policy is a legal blocker in essentially every jurisdiction.
- Add `/(public)/privacy/page.tsx` covering: data collected, how it's used, third parties (OpenAI, Anthropic, Stripe, Resend, LiveKit, Kapso/Meta, PostHog, UploadThing), retention, parent/guardian rights for minors, contact for deletion requests, jurisdiction.
- Add a medical disclaimer prominently in the AI surfaces (ScrybeGPT chat, prescription/diagnostic AI panels, portal AI explanations) — the AI does not replace clinical judgment.
- For the parent portal: explicit consent flow for processing children's PHI (parental consent text shown during invitation acceptance).
- Add a cookie/analytics consent banner if you intend to ship to EU users — PostHog's `person_profiles: "identified_only"` helps but doesn't substitute for consent.
- Update sign-up copy to reference the new Privacy Policy and Terms links.
- If you intend to market to US doctors handling PHI: HIPAA Business Associate Agreements with OpenAI (yes available), Anthropic (yes), Resend (yes), Convex (yes via Convex Pro), Vercel (Enterprise required), Stripe (yes), LiveKit (yes), UploadThing (verify), Kapso (verify — likely no). **If no HIPAA:** add a clear "Not for US PHI / not HIPAA-compliant" disclaimer and target Haiti/Africa/LATAM only as the valuation doc already does.

### 7. Delete the stale backup file flagged by the security audit
- `app/api/ai/chat/[patientId]/route.original.ts` still exists despite item #21 being marked done. [SECURITY-AUDIT.md:139, verified on disk]
- Remove it before launch. One-line task; no functional change.

---

## P1 — Should fix before launch (high risk, medium effort)

### 8. Convert `[ ]` test items in WhatsApp plan into a manual smoke-test pass
The following Phase 2-7 verification steps are still unchecked in `SCRYBEGPT_WHATSAPP_PLAN.md`. Run each once against the production WhatsApp number with a real linked doctor account before announcing the feature:
- Phase 2: "Who do I have today?", "How's patient Jean?", "Vaccines due for Marie?" [line 924]
- Phase 3: full clinical flow (symptoms → diagnosis → approve → meds → edit → approve → save) [line 957]
- Phase 3: preference learning (edit Rx twice for same condition → verify third proposal matches) [line 958]
- Phase 3: safety check (propose allergy-conflicting drug → verify warning) [line 959]
- Phase 4: multi-step chains and PDF delivery [lines 975, 976]
- Phase 5: multi-doctor concurrent test (link two doctors, send messages simultaneously, verify isolation) [line 985]
- Phase 6: write-tools confirmation flow ("New patient Marc Pierre…") [line 997]
- Phase 7: background jobs ("Generate full report for Sophie") [line 1010]
- The deferred `generateGrowthChartPDF` (Phase 4 line 965) — decide whether to ship without it or build it. Ship without it; document as "coming soon".

### 9. Defense-in-depth on API routes (security audit "Pending" items)
Convex mutations enforce ownership, but the 19 thin Next.js API routes in `app/api/patients/*` and `app/api/doctor/*` accept client-provided IDs without verifying. Convex catches this — but a single mistake in a future Convex refactor would expose all patients. Add a small `verifyDoctorOwnsResource(req, resourceId, type)` helper at route level. [SECURITY-AUDIT.md:160]
- Highest priority routes (client-supplied `doctorId` not verified against session): `app/api/patients/addAppointment/route.ts`, `app/api/transactions/route.ts`, `app/api/doctor/edit/route.ts`. [SECURITY-AUDIT.md:172,175,184]
- Fix unsafe UploadThing ID extraction: `app/api/patients/deleteFile/route.ts` uses `file.url.split("/").pop()`. Replace with the UploadThing key returned from the upload response, or parse via URL. [SECURITY-AUDIT.md:182,196]
- Add input validation (vital signs ranges, fileType whitelist, cost ≥ 0) at the API route boundary as well. [SECURITY-AUDIT.md:191]

### 10. Audit log integration into mutations
- The `auditLogs` table and `logAudit()` helper exist (`convex/auditLog.ts`). Item #12 in the security audit is marked done at the table level but **not yet wired into mutations**. [SECURITY-AUDIT.md:88]
- For launch, instrument at minimum: `patients.create/update/remove`, `appointments.create/update/remove`, `vaccines.createRecord`, `invitations.createInvitation`, `telehealth.book/cancel`, `whatsappLinks.link/revoke`, `subscriptions.upgrade/cancel`. Without these, you have no audit trail when something goes wrong post-launch.

### 11. Cost circuit-breakers + observability for Premium "unlimited" tier
- COST_AUDIT §6 calls out unbounded cost risk for Premium users (truly unlimited AI + WhatsApp). [COST_AUDIT.md:419]
- Minimum viable: add a per-doctor monthly spend column to the `usage` table; track API tokens × model price for each AI call; trigger an internal Slack/email alert when a single doctor crosses $50/mo. Don't gate the user on launch day, just alert yourself.
- WhatsApp messages currently NOT tracked per-doctor in `usage` — add `whatsappMessages` counter increment in `convex/whatsapp.ts`. [COST_AUDIT.md:432]
- Recommended quick downgrade (huge cost win, low risk): swap WhatsApp agent from `claude-sonnet-4-6` → `claude-3-5-haiku-latest` for the orchestrator. Estimated 40-60% Anthropic cost savings. [COST_AUDIT.md:391]

### 12. Error monitoring
- No Sentry, no error reporting beyond `console.log` and PostHog. For the first 90 days post-launch you'll be debugging blind on every prod incident.
- Add Sentry (Next.js + Convex). Free tier is fine. Wire it in `app/layout.tsx`, `instrumentation-client.ts`, and `convex/_generated` via Convex's built-in error reporting.
- Alternative: rely on Convex dashboard logs + a daily Vercel log digest. Acceptable for week 1, not week 4.

---

## P2 — Nice to have before launch (do if time permits)

### 13. Service-worker hardening leftover
- `app/sw.ts` uses `defaultCache` from `@serwist/turbopack/worker`. Security audit item #19 was partially completed; the remaining work is a custom cache strategy with short TTL for medical data. [SECURITY-AUDIT.md:133]
- Risk: cached PHI on a shared device persists until manually cleared.
- Quick fix: add a `NetworkOnly` strategy for `/api/patients/*` and `/api/ai/*`, leave `defaultCache` for static assets only.

### 14. Onboarding polish
- 7-day trial flow: verify `welcome` email sends, that the trial countdown banner shows in the doctor dashboard, and that `convex/http.ts:177` (trial-ending email) actually fires. Today these are TODOs.
- Pricing page (`app/(public)/pricing/page.tsx`) — confirm it uses the `pricing` API route which Redis-caches live Stripe prices. Run it against live mode after §3.
- First-run experience: when a new doctor signs up, do they see empty states with calls-to-action? Test by creating a clean prod account.

### 15. Marketing readiness (out of scope but blocks "launch in days")
- Marketing site (apex domain) — separate concern from this app. If shipping `app.pediascrybe.com` only, write a one-pager that redirects to `/signup`.
- Sitemap (`app/sitemap.xml`) — verify it lists the public routes (`/`, `/pricing`, `/contact`, `/terms`, `/privacy`).
- OpenGraph image — `app/opengraph-image.png` exists. Verify it renders correctly when sharing the site URL.
- Demo video / screenshots for the landing page.

### 16. Cost optimizations from COST_AUDIT (post-launch is fine)
- Migrate embeddings from `text-embedding-ada-002` → `text-embedding-3-small` (60% cheaper, better quality). [COST_AUDIT.md:404]
- Downgrade `/api/ai/exams` from `gpt-4.1` (powerful tier) to `gpt-5-mini` (balanced). [COST_AUDIT.md:393]
- Extend Redis cache TTLs from 1h → 24h on prescriptions and exams. [COST_AUDIT.md:394]
- These are revenue-margin improvements, not launch blockers.

---

## Critical Files to Touch

| Area | File | What to do |
|---|---|---|
| Stripe live | `convex/stripeWebhooks.ts`, `convex/http.ts:170`, `convex/http.ts:177` | Add failed-payment + trial-ending emails; verify webhook secret |
| Privacy | `app/(public)/privacy/page.tsx` (NEW) | Create page; link from layout footer + signup |
| Medical disclaimer | `app/user/scrybegpt/page.tsx`, `components/portal/*Ai*.tsx`, AI form panels | Add disclaimer banner |
| Stale file | `app/api/ai/chat/[patientId]/route.original.ts` | Delete |
| Cost tracking | `convex/whatsapp.ts`, `convex/usage.ts` | Increment per-doctor WhatsApp counter |
| Defense-in-depth | `app/api/patients/addAppointment/route.ts`, `app/api/transactions/route.ts`, `app/api/doctor/edit/route.ts`, `app/api/patients/deleteFile/route.ts` | Add ownership verification |
| Auth log integration | All mutations listed in §10 | Call `logAudit()` |
| Service worker | `app/sw.ts` | NetworkOnly for PHI routes |
| Production envs | Vercel + Convex dashboards | Set every var listed in §1, §2 |

---

## Recommended order of operations (3-day launch sprint)

**Day 1 (preparation, no traffic):**
1. Rotate all secrets (§4).
2. Create Convex prod deployment + push envs (§1).
3. Create live Stripe products + capture price IDs (§3).
4. Delete stale file (§7), wire trial/failed-payment emails (§3 + §1 cleanup).
5. Run `npm run build` locally — fix anything broken.

**Day 2 (deploy + smoke test):**
6. Deploy to Vercel with `app.pediascrybe.com` (§2 + §5).
7. Configure Kapso webhook to prod URL.
8. Configure live Stripe webhook.
9. Run the §8 manual WhatsApp smoke tests against prod with one linked doctor account.
10. Run a complete Stripe lifecycle test (signup → trial → upgrade → cancel).
11. Add Sentry (§12) and audit logging (§10).

**Day 3 (legal + go-live):**
12. Ship privacy policy + medical disclaimers (§6).
13. Verify Resend domain, transactional email landing in inbox.
14. Add cost alerts (§11) and per-doctor WhatsApp tracking.
15. Soft launch — invite 2-3 known doctors, monitor logs for 24h.
16. Full launch.

---

## Verification (end-to-end happy path on production)

1. Visit `https://app.pediascrybe.com` → public landing renders → `/pricing` shows live prices → `/privacy` and `/terms` accessible.
2. Sign up as a new doctor → receive welcome email → land in onboarding.
3. Start 7-day trial → upgrade to Pro via Stripe Checkout (real card, $1) → verify subscription in DB → cancel → verify webhook fires.
4. Create a patient → record an appointment with vitals → generate AI prescription → verify quota increments.
5. Invite a parent to the portal → parent signs up → portal shows the child → AI explanation works.
6. Book a telehealth call → both sides join LiveKit room → call ends cleanly → email reminders sent.
7. Link WhatsApp via QR → send "who do I have today?" → receive correct schedule.
8. Run §8 WhatsApp smoke tests.
9. Disconnect network → verify offline dashboard works → reconnect → verify sync queue empties.
10. Check Sentry: zero errors on the happy path. Check PostHog: events for signup, paywall, AI call.
11. Check Convex dashboard: no failed function calls; cron `whatsapp-daily-summary` ran on schedule.
12. Stripe dashboard: payment shows up in live mode.

---

## Known scope cuts (acknowledged "ship without")

- `generateGrowthChartPDF` over WhatsApp — defer; the text summary works.
- HIPAA certification — not before launch; target non-US markets per VALUATION.md.
- Voice notes / OCR / Meta Direct migration — Phase 8 features, post-launch.
- Cost optimizations from §16 — post-launch margin improvement.
- Deep audit log integration into every mutation — start with the §10 critical set.
