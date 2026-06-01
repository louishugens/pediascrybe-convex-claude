# Pediascrybe - Technical Cost Audit & Analysis

**Date:** March 30, 2026
**Scope:** All paid services, API costs, infrastructure, and revenue model

---

## Table of Contents

1. [Revenue Model](#1-revenue-model)
2. [Service-by-Service Cost Breakdown](#2-service-by-service-cost-breakdown)
3. [Cost Scenarios](#3-cost-scenarios)
4. [Per-Doctor Unit Economics](#4-per-doctor-unit-economics)
5. [Cost Optimization Opportunities](#5-cost-optimization-opportunities)
6. [Risk Factors](#6-risk-factors)

---

## 1. Revenue Model

### Doctor Subscriptions (Primary Revenue)

| Tier | Monthly Price | Trial | Target |
|------|--------------|-------|--------|
| **Starter** | $29/mo | 7 days | New pediatricians, low-volume practices |
| **Pro** | $49/mo | 7 days | Established pediatricians, full AI support |
| **Premium** | $99/mo | 7 days | High-volume practitioners |

### Doctor Tier Quotas

| Resource | Starter | Pro | Premium |
|----------|---------|-----|---------|
| Patients | 100 | 500 | Unlimited |
| Records | 200 | 1,000 | Unlimited |
| ScrybeGPT messages | 50/mo | 300/mo | Unlimited |
| AI Prescriptions | 20/mo | 100/mo | Unlimited |
| AI Lab Exams | 20/mo | 100/mo | Unlimited |
| AI Diagnostics | 20/mo | 100/mo | Unlimited |
| AI Reports | 0 | 50/mo | Unlimited |
| Patient Portal | No | Yes | Yes |
| WhatsApp ScrybeGPT | No | Yes | Yes |
| Telehealth | No | No | Yes |

### Patient Subscription (Secondary Revenue)

| Plan | Price | Quota |
|------|-------|-------|
| **Free** | $0 | 5 AI explanations/month |
| **Scrybe Assist Premium** | $4.99/mo | Unlimited AI explanations |

---

## 2. Service-by-Service Cost Breakdown

### 2.1 OpenAI API (Largest Variable Cost)

**Models in use:**

| Model | Use Case | Input Cost | Output Cost |
|-------|----------|------------|-------------|
| `gpt-4o-mini` | Portal AI, chat completions, report generation | $0.15/1M tokens | $0.60/1M tokens |
| `text-embedding-ada-002` | Vector search, patient data indexing | $0.10/1M tokens | - |
| `gpt-4.1-nano` | Condition classification, decision log embeddings | $0.10/1M tokens | $0.40/1M tokens |

**Vercel AI Gateway fallback chain (for doctor-facing AI routes):**

| Tier | Primary (OpenAI) | Fallback 1 (Anthropic) | Fallback 2 (Google) |
|------|-------------------|------------------------|---------------------|
| **Fast** | gpt-4o-mini | claude-3-5-haiku | gemini-2.0-flash |
| **Balanced** | gpt-5-mini | claude-sonnet-4 | gemini-2.0-flash |
| **Powerful** | gpt-4.1 | claude-opus-4 | gemini-2.0-pro |

**WhatsApp Agent:** `claude-sonnet-4-6` (Anthropic) via Vercel AI SDK with tool calling (up to 8 steps per message).

**AI route-to-model mapping:**

| Route | Model Tier | Redis Cache | Cache TTL |
|-------|-----------|-------------|-----------|
| `/api/ai/prescriptions` | Balanced (gpt-5-mini) | Yes | 1 hour |
| `/api/ai/exams` | Powerful (gpt-4.1) | Yes | 1 hour |
| `/api/ai/diagnostic` | Balanced (gpt-5-mini) | No | - |
| `/api/ai/report` | Fast (gpt-4o-mini) | No | - |
| `/api/ai/chat/[patientId]` | Varies | No | - |
| `/api/ai/scrybegpt` | Fast (gpt-4o-mini) | No | - |
| `/api/classify-conditions` | Nano (gpt-4.1-nano) | Yes | 24 hours |
| `/api/completion` | Fast (gpt-4o-mini) | No | - |
| Portal AI (convex) | gpt-4o-mini | SHA256 hash | Permanent (DB) |

**Token consumption estimates per operation:**

| Operation | ~Input Tokens | ~Output Tokens | ~Cost per Call |
|-----------|--------------|----------------|----------------|
| ScrybeGPT chat message | 800-2,000 | 300-800 | $0.0004-0.001 |
| AI Prescription | 1,500-3,000 | 500-1,500 | $0.002-0.008 |
| AI Diagnostic | 1,500-3,000 | 500-1,500 | $0.002-0.008 |
| AI Lab Exam (powerful) | 1,500-3,000 | 500-1,500 | $0.008-0.025 |
| AI Report | 2,000-4,000 | 1,000-3,000 | $0.001-0.003 |
| Portal AI explanation | 500-1,500 | 300-800 | $0.0003-0.0007 |
| Condition classification | 200-500 | 50-200 | $0.00005-0.0001 |
| Embedding (ada-002) | 200-500 | - | $0.00003-0.00005 |
| WhatsApp agent (multi-step) | 3,000-10,000 | 1,000-4,000 | $0.01-0.06 |

**Cost savings already implemented:**
- Redis caching on prescriptions, exams, conditions (avoids repeat API calls)
- Portal AI caches explanations by SHA256 hash permanently in DB (aiExplanations table)
- Condition classification cached 24 hours
- Conversation history limited to last 20 messages for WhatsApp
- WhatsApp agent capped at 8 tool-calling steps

---

### 2.2 Anthropic API

Used primarily for WhatsApp ScrybeGPT agent (`claude-sonnet-4-6`) and as fallback for doctor AI routes.

| Model | Input Cost | Output Cost |
|-------|------------|-------------|
| claude-sonnet-4-6 | $3.00/1M tokens | $15.00/1M tokens |
| claude-opus-4 (fallback) | $15.00/1M tokens | $75.00/1M tokens |
| claude-3-5-haiku (fallback) | $0.80/1M tokens | $4.00/1M tokens |

**WhatsApp agent is the biggest Anthropic cost driver.** Each message triggers a multi-step agent with tool calling. A single doctor query could consume 5,000-15,000 tokens ($0.02-0.08 per interaction).

---

### 2.3 Convex (Backend-as-a-Service)

**Pricing model:** Based on function calls, database operations, storage, and bandwidth.

| Resource | Free Tier | Pro ($25/mo) | Usage-Based |
|----------|-----------|--------------|-------------|
| Function calls | 500K/mo | Unlimited | Included |
| Database storage | 512MB | 1GB | $0.03/GB/mo |
| File storage | 1GB | 10GB | $0.03/GB/mo |
| Bandwidth | 1GB | 5GB | $0.10/GB |

**Cost drivers in codebase:**
- **32 tables** with multiple indexes (by_doctorId, by_patientId, by_startDate, etc.)
- **1 vector index** (documents.by_embedding) for AI search
- **Actions** (call external APIs): whatsapp agent, email sending, Stripe calls, LiveKit tokens, PDF generation
- **Cron jobs**: hourly WhatsApp daily summary scan, weekly preference consolidation
- **HTTP endpoints**: Stripe webhooks, auth routes, WhatsApp webhooks

**Estimated monthly:** $25-50 (Pro plan likely sufficient for early stage)

---

### 2.4 Stripe (Payment Processing)

| Fee Type | Rate |
|----------|------|
| Transaction fee | 2.9% + $0.30 per charge |
| Subscription management | Included |
| Webhook processing | Free |
| Billing portal | Free |

**Revenue impact per subscription:**

| Plan | Monthly | Stripe Fee | Net Revenue |
|------|---------|------------|-------------|
| Starter ($29) | $29.00 | $1.14 | $27.86 |
| Pro ($49) | $49.00 | $1.72 | $47.28 |
| Premium ($99) | $99.00 | $3.17 | $95.83 |
| Scrybe Assist ($4.99) | $4.99 | $0.44 | $4.55 |

---

### 2.5 LiveKit (Telehealth Video)

Premium-tier only feature.

| Resource | Cost |
|----------|------|
| Participant minutes | ~$0.004-0.01/min |
| Room creation | Free (token-based) |
| Webhook processing | Free |

**Configuration:** 2 participants per room (doctor + parent), 2-hour token TTL.

**Estimated per consultation:** 30-minute call = $0.24-0.60 per call (2 participants x 30 min).

---

### 2.6 Resend (Transactional Email)

| Plan | Price | Emails |
|------|-------|--------|
| Free | $0 | 100/day (3,000/mo) |
| Pro | $20/mo | 50,000/mo |

**Email triggers in codebase (8 types):**
- Auth emails: verification, OTP, magic link, password reset (per auth event)
- Welcome email (per signup, BCC to admin)
- Portal invitation (per doctor invite action)
- Portal notifications (per new prescription/lab/vaccine/appointment)
- Telehealth notifications (per booking/reschedule/cancel/reminder)

**Estimated volume:** Free tier likely sufficient up to ~50 doctors. Switch to Pro at scale.

---

### 2.7 Upstash Redis

| Plan | Price | Commands |
|------|-------|----------|
| Free | $0 | 10K commands/day |
| Pay-as-you-go | $0.20/100K commands | Unlimited |

**Usage in codebase:**
- **Rate limiting** (5 limiters): AI (30/min), auth (10/min), email (5/min), API (60/min), public (3/min)
- **AI response caching**: prescriptions (1hr TTL), exams (1hr TTL), conditions (24hr TTL)

**Estimated:** $0-5/month at early scale. Rate limiting is lightweight.

---

### 2.8 UploadThing (File Storage)

| Plan | Price | Storage |
|------|-------|---------|
| Free | $0 | 2GB |
| Pro | $10/mo | 100GB |

**Usage:** Appointment file attachments (images, PDFs, videos), doctor profile photos, portal file uploads.

**Estimated:** Free tier for early stage, $10/mo at scale.

---

### 2.9 Vercel (Hosting & Serverless)

| Plan | Price | Includes |
|------|-------|----------|
| Hobby | $0 | 100GB bandwidth, 100K function invocations |
| Pro | $20/mo | 1TB bandwidth, unlimited functions |

**Cost drivers:**
- ~38 API routes (serverless functions)
- Static page rendering (public pages, pricing)
- Image optimization (doctor photos, uploads)
- Analytics rewrites (PostHog proxy)

**Estimated:** $20/mo (Pro plan needed for production).

---

### 2.10 PostHog (Analytics)

| Plan | Price | Events |
|------|-------|--------|
| Free | $0 | 1M events/month |
| Growth | Usage-based | $0.00031/event after 1M |

**Estimated:** Free tier likely sufficient for early stage.

---

### 2.11 WhatsApp / Kapso API

The platform uses Kapso as a WhatsApp Business API proxy (`api.kapso.ai`).

**WhatsApp Business API pricing (Meta, via Kapso):**

| Conversation Type | Cost (approx.) |
|-------------------|----------------|
| User-initiated (24hr session) | $0.003-0.008 per conversation |
| Business-initiated (templates) | $0.01-0.05 per message |
| Utility messages | $0.004-0.01 |

Plus Kapso platform fee (varies by plan).

**Messages sent per WhatsApp interaction:**
- `sendTextMessage()` — single text response
- `sendChunkedMessages()` — large responses split into 4096-char chunks (multiple API calls)
- `sendDocumentMessage()` — PDF attachments
- `markMessageAsRead()` — read receipts
- `reactToMessage()` — emoji reactions

**Daily summary cron:** Sends 1 message per active WhatsApp doctor at 7am local time.

---

### 2.12 Domain & DNS

Not tracked in codebase. Typical cost: $10-15/year for domain registration.

---

## 3. Cost Scenarios

### Scenario A: Early Stage (10 doctors, 5 parents)

| Service | Monthly Cost |
|---------|-------------|
| OpenAI API | $15-30 |
| Anthropic API (WhatsApp) | $10-25 |
| Convex | $0 (free tier) |
| Stripe fees | $14 (on ~$490 revenue) |
| LiveKit | $0-5 |
| Resend | $0 (free tier) |
| Upstash Redis | $0 (free tier) |
| UploadThing | $0 (free tier) |
| Vercel | $20 |
| PostHog | $0 (free tier) |
| WhatsApp/Kapso | $10-30 |
| Domain | ~$1 |
| **Total infrastructure** | **$70-125/mo** |
| **Revenue** (5 starter, 4 pro, 1 premium) | **$440/mo** |
| **Margin** | **~72-84%** |

### Scenario B: Growth (50 doctors, 25 parents)

| Service | Monthly Cost |
|---------|-------------|
| OpenAI API | $100-250 |
| Anthropic API (WhatsApp) | $80-200 |
| Convex | $25-50 |
| Stripe fees | $73 (on ~$2,500 revenue) |
| LiveKit | $15-40 |
| Resend | $0-20 |
| Upstash Redis | $2-5 |
| UploadThing | $10 |
| Vercel | $20 |
| PostHog | $0 |
| WhatsApp/Kapso | $50-200 |
| Domain | ~$1 |
| **Total infrastructure** | **$376-860/mo** |
| **Revenue** (15 starter, 25 pro, 10 premium) | **$2,650/mo** + ~$125 parent subs |
| **Margin** | **~69-86%** |

### Scenario C: Scale (200 doctors, 100 parents)

| Service | Monthly Cost |
|---------|-------------|
| OpenAI API | $500-1,200 |
| Anthropic API (WhatsApp) | $400-1,000 |
| Convex | $50-150 |
| Stripe fees | $300 (on ~$10,000 revenue) |
| LiveKit | $60-200 |
| Resend | $20 |
| Upstash Redis | $10-20 |
| UploadThing | $10 |
| Vercel | $20-50 |
| PostHog | $0-30 |
| WhatsApp/Kapso | $200-800 |
| Domain | ~$1 |
| **Total infrastructure** | **$1,571-3,800/mo** |
| **Revenue** (60 starter, 100 pro, 40 premium) | **$10,600/mo** + ~$500 parent subs |
| **Margin** | **~66-86%** |

---

## 4. Per-Doctor Unit Economics

### Cost Per Doctor (at 50-doctor scale)

| Cost Component | Starter Doctor | Pro Doctor | Premium Doctor |
|----------------|---------------|------------|----------------|
| **AI (OpenAI)** | $1.50/mo (50 msgs) | $6.00/mo (300 msgs + reports) | $15.00/mo (unlimited) |
| **AI (Anthropic/WhatsApp)** | N/A | $4.00/mo | $8.00/mo |
| **Convex compute** | $0.30/mo | $0.60/mo | $1.00/mo |
| **Stripe fee** | $1.14 | $1.72 | $3.17 |
| **Email** | $0.10/mo | $0.20/mo | $0.30/mo |
| **WhatsApp messaging** | N/A | $2.00/mo | $4.00/mo |
| **LiveKit** | N/A | N/A | $3.00/mo |
| **Shared infra (Vercel, Redis, etc.)** | $0.50/mo | $0.50/mo | $0.50/mo |
| **Total cost per doctor** | **$3.54/mo** | **$15.02/mo** | **$34.97/mo** |
| **Revenue per doctor** | **$29.00/mo** | **$49.00/mo** | **$99.00/mo** |
| **Gross margin per doctor** | **$25.46 (88%)** | **$33.98 (69%)** | **$64.03 (65%)** |

**Key insight:** Starter tier has the best margin (limited AI usage). Premium has lower margin % but highest absolute margin ($64/doctor). The AI and WhatsApp costs are the primary margin compressors.

### Breakeven Analysis

| Cost | Monthly Fixed |
|------|--------------|
| Vercel Pro | $20 |
| Domain | ~$1 |
| **Minimum fixed costs** | **~$21/mo** |
| **Breakeven** | **1 Starter subscriber** |

All other costs are usage-based and scale with revenue.

---

## 5. Cost Optimization Opportunities

### High Impact

| Opportunity | Current State | Optimization | Estimated Savings |
|-------------|--------------|--------------|-------------------|
| **WhatsApp agent model** | `claude-sonnet-4-6` for all messages | Use `claude-haiku` for simple queries, sonnet for complex only | 40-60% on Anthropic costs |
| **AI exam route model** | `gpt-4.1` (powerful tier) | Downgrade to balanced (`gpt-5-mini`) — exams don't need opus-level reasoning | 60-80% per call |
| **Extend Redis cache TTLs** | Prescriptions/exams: 1 hour | Extend to 24h for stable patient contexts | 30-50% cache hit improvement |
| **WhatsApp message batching** | Chunked into 4096-char messages | Summarize long responses before sending | Fewer API calls |

### Medium Impact

| Opportunity | Current State | Optimization | Estimated Savings |
|-------------|--------------|--------------|-------------------|
| **Portal AI caching** | SHA256 hash cached in DB (good) | Already well-optimized | Maintaining |
| **Condition classification** | 24hr cache (good) | Could extend to 7 days for stable conditions | Minor |
| **WhatsApp conversation trim** | Last 20 messages loaded | Reduce to 10 for shorter contexts | 20-30% token reduction |
| **Embedding model** | text-embedding-ada-002 | Migrate to `text-embedding-3-small` (cheaper, better) | 60% on embedding costs |

### Low Impact (Already Optimized)

- Portal AI permanent caching via DB
- Rate limiting preventing runaway costs
- Monthly usage quotas per subscription tier
- WhatsApp agent step limit (8 max)

---

## 6. Risk Factors

### Unbounded Cost Risks

| Risk | Trigger | Mitigation in Place | Gap |
|------|---------|---------------------|-----|
| **Premium "unlimited" AI** | Heavy Premium user sends 1000+ ScrybeGPT msgs/month | None — Premium is truly unlimited | Add soft cap or fair-use policy |
| **WhatsApp agent loops** | Complex query triggers 8 tool-calling steps repeatedly | 8-step max, 20 msg/min rate limit | No per-doctor daily spend cap |
| **Fallback cascades** | OpenAI outage triggers Anthropic (3-20x more expensive) | Fallback chain exists | No cost circuit-breaker on fallback |
| **Large file uploads** | Doctors upload many large videos | UploadThing plan limits | No per-doctor file size quota |
| **Telehealth abuse** | Premium user runs multi-hour calls | 2-hour token TTL | No per-month minute cap |

### Cost Monitoring Gaps

- No real-time spend tracking per doctor
- No alerts when a single doctor's API costs exceed thresholds
- No cost attribution dashboard
- WhatsApp message costs not tracked per-doctor in the usage table

### Recommendations

1. **Add spend caps for Premium tier**: Track actual API costs per doctor, alert at $50/mo
2. **Add WhatsApp cost tracking**: Count outbound messages per doctor in the usage table
3. **Implement cost circuit-breaker on AI fallbacks**: If primary fails, don't fall back to opus-tier models for non-critical requests
4. **Upgrade embedding model**: `text-embedding-3-small` is cheaper and higher quality than ada-002
5. **Consider haiku for WhatsApp triage**: Route simple queries (greetings, status checks) to cheaper model

---

## Summary

| Metric | Value |
|--------|-------|
| **Total paid services** | 11 (OpenAI, Anthropic, Convex, Stripe, LiveKit, Resend, Upstash, UploadThing, Vercel, PostHog, Kapso/WhatsApp) |
| **Fixed monthly costs** | ~$21-95 (Vercel + Convex + domain) |
| **Variable costs** | Scale linearly with doctor count and AI usage |
| **Biggest cost driver** | AI APIs (OpenAI + Anthropic) = 50-65% of infrastructure costs |
| **Second biggest** | WhatsApp/Kapso messaging = 10-20% |
| **Gross margin range** | 65-88% per doctor depending on tier |
| **Breakeven** | 1 Starter subscriber covers minimum fixed costs |
| **Recommended first optimization** | Downgrade WhatsApp agent to haiku for simple queries |
