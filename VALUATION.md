# Pediascrybe Financial Evaluation

**Date:** March 2026
**Status:** Pre-revenue, no users
**Stage:** Feature-complete product

---

## Project Metrics

| Metric | Count |
|--------|-------|
| Lines of Code | ~64,000 |
| Database Tables | 36 |
| Pages/Routes | 126 (87 pages + 39 API routes) |
| React Components | 222+ |
| Convex Backend Functions | 394+ |
| Third-Party Integrations | 15+ |
| Major Feature Systems | 13 |

---

## Tech Stack

- **Frontend:** Next.js 16, React 19, TailwindCSS, shadcn/ui, Recharts
- **Backend:** Convex (serverless, real-time sync, vector search)
- **Auth:** Better Auth (multi-role: doctor, patient, admin)
- **Payments:** Stripe (subscriptions + one-time)
- **AI:** OpenAI GPT-4, Vercel AI SDK, RAG with vector embeddings
- **Video:** LiveKit (telehealth)
- **Email:** Resend
- **WhatsApp:** Kapso/Meta Business API
- **Offline:** Serwist PWA + Dexie IndexedDB
- **Caching:** Upstash Redis

---

## Major Features

1. **Core EMR** - Patient management, appointments, vitals, findings, medications, exams, recommendations
2. **WHO Growth Charts** - 8 chart variants (WFA, HFA, HCFA, BFA for 0-5y and 5-19y), percentile tracking, PDF export
3. **Vaccination Management** - Doctor-defined vaccine catalog, dose tracking, compliance reporting
4. **WhatsApp AI Agent (ScrybeGPT)** - Conversational clinical assistant via WhatsApp with tool calling, clinical safety checks, PDF generation, preference learning, audit logging
5. **Parent Portal** - Parent signup via invitation, child health viewing, AI explanations (Scrybe Assist premium)
6. **Telehealth** - LiveKit video consultations, doctor scheduling, parent booking, timezone-aware
7. **Stripe Billing** - 3 doctor tiers (Starter/Pro/Premium) + parent premium ($4.99/mo), free trials, usage quotas
8. **Offline PWA** - Service worker caching, IndexedDB sync, conflict resolution, offline-first access
9. **Analytics Dashboard** - Revenue tracking, patient stats, gender/age distribution, immunization status, common conditions
10. **AI Clinical Tools** - Prescription suggestions, diagnostic reasoning, lab exam proposals, medication safety checks
11. **PDF Generation** - Prescriptions, lab orders, receipts, patient summaries, WHO growth charts
12. **Audit & Compliance** - Full mutation audit logging, role-based access control, private notes
13. **Email Notifications** - Transactional emails, portal notifications, telehealth reminders

---

## Revenue Streams

| Stream | Model | Target |
|--------|-------|--------|
| Doctor Starter Tier | Monthly subscription | Small practices |
| Doctor Pro Tier | Monthly subscription | Growing practices |
| Doctor Premium Tier | Monthly subscription | Full-featured clinics |
| Parent Scrybe Assist | $4.99/mo premium | Engaged parents |

---

## Development Cost Estimate (Replacement Value)

| Role | Rate/hr | Hours | Cost |
|------|---------|-------|------|
| Senior Full-Stack Dev | $100-150 | ~1,200 | $120K-180K |
| AI/ML Engineer | $120-170 | ~400 | $48K-68K |
| UI/UX Design | $80-120 | ~200 | $16K-24K |
| DevOps/Infra | $100-140 | ~100 | $10K-14K |
| QA/Testing | $60-90 | ~150 | $9K-13K |
| Product/PM | $90-130 | ~200 | $18K-26K |
| **Total Rebuild** | | **~2,250 hrs** | **$221K - $325K** |

Solo-developer labor value (sweat equity): **~$150K-200K**

---

## Feature-Level Value Breakdown

| Feature | Complexity | Standalone Value |
|---------|-----------|-----------------|
| Core EMR (patients, appointments, vitals) | High | $40K-60K |
| WHO Growth Charts (8 variants + PDF) | Medium | $15K-25K |
| Vaccination Management | Medium | $10K-15K |
| WhatsApp AI Agent (ScrybeGPT) | Very High | $50K-80K |
| Parent Portal + Scrybe Assist | High | $25K-40K |
| Telehealth (LiveKit video) | High | $20K-35K |
| Stripe Billing (3 tiers + parent premium) | Medium | $15K-20K |
| Offline PWA + Sync | High | $20K-30K |
| Analytics Dashboard | Medium | $8K-12K |
| Auth + RBAC + Audit Logging | Medium | $10K-15K |
| AI Clinical Tools (Rx, Dx, Labs) | High | $20K-30K |
| PDF Generation (6 types) | Medium | $8K-12K |

---

## Market Valuation (Pre-Revenue)

| Method | Multiplier | Estimated Value |
|--------|-----------|-----------------|
| Replacement cost (1x) | 1x | $220K-325K |
| Tech asset premium (1.5-2x) | 1.5x | $330K-490K |
| IP + market potential (2-3x) | 2.5x | $550K-810K |

### Realistic Current Value: $250K - $400K

**Factors considered:**
- No revenue or users (biggest discount)
- Working product (feature-complete, not just MVP)
- Strong technical moat (WhatsApp AI agent, offline-first, clinical safety)
- Clear monetization (4 revenue streams)
- Target market advantage (Haiti, Africa, Latin America — underserved, mobile-first)
- Solo founder risk (bus factor = 1)

---

## Value Acceleration Milestones

| Milestone | Projected Value |
|-----------|----------------|
| 10 paying doctors | $500K - $1M |
| 100 paying doctors | $1M - $3M |
| $5K MRR | $600K - $900K (10-15x ARR) |
| $10K MRR | $1.2M - $1.8M |
| Strategic partnership (hospital/NGO) | +50-100% |
| HIPAA certification | +30% (US market entry) |

---

## Key Differentiators

- **WhatsApp AI Agent** - No pediatric EMR in emerging markets offers conversational clinical AI via WhatsApp
- **Offline-First Architecture** - Critical for low-connectivity regions in target markets
- **Parent Engagement Portal** - Creates data moat and patient stickiness
- **WHO-Standard Growth Charts** - Clinical credibility with international standards
- **Multi-Language Support** - French, English, Creole (expandable)
- **Flexible Timezone System** - Built for global deployment across Americas, Africa, Europe
