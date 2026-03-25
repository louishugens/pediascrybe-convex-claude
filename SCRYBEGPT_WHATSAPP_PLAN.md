# ScrybeGPT WhatsApp Integration Plan

## Context

Doctors using Pediascrybe already have ScrybeGPT as an in-app chat (web only, per-patient context). The goal is to bring ScrybeGPT to **WhatsApp** so doctors can get AI-powered assistance from anywhere — without opening the app. This dramatically increases productivity: quick patient lookups, schedule checks, prescription help, diagnostic guidance, and more — all from the messaging app they already use daily.

**Why WhatsApp over OpenClaw:** E2E encryption (medical data), zero learning curve, works on any phone, and doctors already live in WhatsApp.

---

## Doctor Impact & ROI

### The Problem
A pediatrician's day is fragmented: between consultations, they're switching between apps, searching records, calculating dosages, checking vaccine schedules, and doing mental math on revenue. Every context switch costs time. Opening a laptop/app to ask ScrybeGPT is a barrier — especially between patients or after hours.

### How WhatsApp ScrybeGPT Solves This

| Use Case | Without WhatsApp ScrybeGPT | With WhatsApp ScrybeGPT | Time Saved |
|----------|---------------------------|------------------------|------------|
| **Patient prep** | Open app -> find patient -> read through appointments (~3-5 min) | Text "summary of patient Jean" -> instant response while walking to exam room (~15 sec) | **~4 min/patient** |
| **Prescription writing** | Look up drug reference -> calculate dose by weight -> check allergies manually (~5-8 min) | Text "prescriptions for patient Jean, otitis media" -> AI knows weight, allergies, gives dosage (~30 sec) | **~6 min/prescription** |
| **Differential diagnosis** | Mental recall + reference lookup during consultation (~5 min) | Text "DDx for patient Marie, fever + rash" -> instant differential with patient context (~20 sec) | **~4 min/case** |
| **Vaccine check** | Open app -> find patient -> check records vs schedule (~3 min) | Text "vaccines due for patient Sophie" -> instant checklist (~15 sec) | **~3 min/check** |
| **Lab ordering** | Recall which labs are appropriate for age + symptoms (~3 min) | Text "labs for patient X, suspected anemia" -> age-appropriate suggestions (~15 sec) | **~3 min/order** |
| **Schedule check** | Open app -> navigate to calendar (~1-2 min) | Text "who do I have today?" -> instant list (~10 sec) | **~1.5 min** |
| **Revenue tracking** | Open app -> go to analytics -> filter by date (~2 min) | Text "how much did I make today?" -> instant answer (~10 sec) | **~2 min** |

### Productivity Impact (Conservative Estimates)

**Per day (assuming 15-20 patients):**
- Patient prep: 4 min x 15 patients = **60 min saved**
- Prescriptions: 6 min x 8 prescriptions = **48 min saved**
- Diagnostics: 4 min x 5 complex cases = **20 min saved**
- Vaccine/lab checks: 3 min x 6 checks = **18 min saved**
- Schedule + revenue: **4 min saved**

**Total: ~2.5 hours saved per day**

### What That Means for the Doctor

- **See 3-5 more patients per day** (at ~30 min/consultation) without working longer hours
- **Revenue increase:** 3-5 extra patients x avg consultation fee = significant monthly revenue boost
- **Better care quality:** AI cross-checks allergies, suggests age-appropriate dosages, catches things human memory might miss
- **After-hours convenience:** Quick patient lookups from home via WhatsApp instead of opening the laptop
- **Reduced burnout:** Less time on administrative/lookup tasks, more time on actual patient care
- **Faster parent responses:** When a parent texts about their child, doctor can quickly ask ScrybeGPT for the patient's context and respond faster

### Why WhatsApp Specifically
- Doctors already check WhatsApp 50+ times/day — zero friction to adopt
- Works on any phone, no app download needed
- Can use it between patients, in transit, or at home
- Voice notes (Phase 5) will make it even faster — speak instead of type

---

## Architecture Overview — Agentic Design

ScrybeGPT is NOT a simple intent-classifier. It's an **AI agent with tools** — it can reason about what the doctor needs, chain multiple tools together, run background jobs, and proactively follow up.

### Message Flow

```
Doctor sends WhatsApp message
  -> Kapso receives it (later: Meta Cloud API)
  -> Kapso forwards webhook to Convex HTTP endpoint (POST /whatsapp/webhook)
    -> Signature verification
    -> internal.whatsapp.handleIncomingMessage (Node action)
      1. Look up doctor via whatsappLinks table (by phone number)
      2. If unlinked -> reply "Scan the QR code in your Pediascrybe settings"
      3. Check subscription + usage quota
      4. Load conversation history (last 10 message pairs)
      5. Call ScrybeGPT Agent (generateText with tools)
         The agent decides which tools to call based on the message.
         It can chain multiple tools in a single turn.
      6. Format response for WhatsApp
      7. Send reply via Kapso SDK (later: Meta API)
      8. Store messages + increment usage
```

### Agent Architecture

```
                         ┌─────────────────────┐
                         │   ScrybeGPT Agent    │
                         │  (Orchestrator LLM)  │
                         │  balanced model       │
                         └──────────┬────────────┘
                                    │
                     The agent calls tools as needed.
                     It can call multiple tools per turn,
                     chain results, and reason across them.
                                    │
        ┌───────────┬───────────┬───┴────┬──────────┬──────────────┐
        v           v           v        v          v              v
  ┌───────────┐ ┌────────┐ ┌────────┐ ┌──────┐ ┌────────┐ ┌────────────┐
  │  Patient   │ │Schedule│ │Medical │ │Growth│ │ Write  │ │ Background │
  │  Agent     │ │ Agent  │ │ Agent  │ │Agent │ │ Agent  │ │   Agent    │
  │            │ │        │ │        │ │      │ │        │ │            │
  │- search    │ │- today │ │- Rx    │ │-chart│ │-create │ │- generate  │
  │- lookup    │ │- week  │ │- DDx   │ │-track│ │-update │ │  report    │
  │- history   │ │- book  │ │- labs  │ │-WHO  │ │-confirm│ │- batch ops │
  │- vaccines  │ │- cancel│ │- notes │ │      │ │-undo   │ │- notify    │
  └───────────┘ └────────┘ └────────┘ └──────┘ └────────┘ └────────────┘
```

### Agent Tools (Functions the LLM Can Call)

Each tool is a Convex `internalQuery` or `internalMutation` that the agent invokes via AI SDK tool-calling. All tools are **scoped to the authenticated doctor's ID**.

#### Patient Tools
| Tool | Description | Returns |
|------|-------------|---------|
| `searchPatients` | Fuzzy search by name, age range, condition | List of matching patients |
| `getPatientSummary` | Full profile: demographics, allergies, history, recent vitals, meds | Patient summary |
| `getPatientAppointments` | All appointments for a patient (filterable by date range) | Appointment list |
| `getVaccinationRecords` | Vaccination history + what's due next | Vaccine records + due dates |
| `getPatientGrowthData` | Height, weight, head circumference over time | Growth data points |

#### Schedule Tools
| Tool | Description | Returns |
|------|-------------|---------|
| `getTodaySchedule` | Today's appointments with patient names + reasons | Schedule list |
| `getWeekSchedule` | This week's appointments | Weekly schedule |
| `getAvailableSlots` | Open slots for a given date | Available times |

#### Medical AI Tools
| Tool | Description | Returns |
|------|-------------|---------|
| `generatePrescription` | AI-generated Rx based on patient data + condition (allergy-safe, weight-dosed) | Prescription suggestions |
| `generateDiagnosis` | Differential diagnosis based on symptoms + patient history | DDx list with reasoning |
| `suggestLabExams` | Age-appropriate lab suggestions based on suspected condition | Lab exam list |

#### Chart, Report & Document Tools
| Tool | Description | Returns |
|------|-------------|---------|
| `generateGrowthChart` | WHO percentile chart — text summary or image | Text summary or image URL |
| `generateGrowthChartPDF` | WHO chart exported as PDF (reuses web app export logic) | PDF document URL |
| `generateReport` | Medical report, certificate, or reference note as PDF | PDF document URL |
| `generatePrescriptionPDF` | Prescription document with dosages | PDF document URL |
| `generateReceipt` | Invoice/receipt for a visit | PDF document URL |
| `getDailyAnalytics` | Revenue, patient count, appointment stats for today | Analytics summary |
| `getMonthlyAnalytics` | Revenue trends, patient growth, top services | Monthly analytics |

**PDF delivery:** All document tools store the PDF in Convex file storage and return a URL. The agent sends it via WhatsApp's document message API — the doctor gets a downloadable PDF right in the chat. Same rendering logic as the web app's PDF export.

#### Clinical Decision Tools (Propose -> Review -> Save)
| Tool | Description | Flow |
|------|-------------|------|
| `proposeDiagnostic` | Generate differential diagnosis from symptoms, vitals, demographics, history | Propose -> doctor approves/edits -> save to appointment |
| `proposeMedication` | Generate prescription based on diagnosis, patient weight, allergies, age | Propose -> doctor approves/edits -> save to appointment |
| `proposeLabExams` | Suggest lab exams based on suspected diagnosis + patient context | Propose -> doctor approves/edits -> save to appointment |

These tools follow a **propose-review-save** cycle (see "Interactive Clinical Workflow" section below).

#### Write Tools (Phase 5)
| Tool | Description | Confirmation Required |
|------|-------------|----------------------|
| `createPatient` | Create a new patient record | YES |
| `createAppointment` | Schedule an appointment | YES |
| `addAppointmentNote` | Add internal notes to an appointment | YES |
| `recordVitals` | Save vitals to an appointment | YES |
| `logVaccination` | Record a vaccine dose | YES |
| `undoLastAction` | Rollback the most recent write | YES |

#### Background Job Tools (Phase 6)
| Tool | Description | Notification |
|------|-------------|-------------|
| `generateFullReport` | Generate a comprehensive patient report (may take 30-60s) | "Your report is ready! Here it is..." |
| `generateEndOfDaySummary` | Summarize all of today's patients, findings, pending follow-ups | Sent when complete |
| `batchVaccineCheck` | Check vaccine status for all patients in a given age range | "Found 12 patients with overdue vaccines..." |

### How Tool-Chaining Works

The agent can call **multiple tools in a single turn** and reason across results:

**Example 1: Complex query**
Doctor: "Check patient Jean's vaccines and growth, and if anything is off, suggest labs"
```
Agent thinks: I need Jean's data first, then vaccines and growth.
  1. calls searchPatients("Jean") -> finds Jean Baptiste, age 3
  2. calls getVaccinationRecords(jeanId) -> missing DTP booster
  3. calls getPatientGrowthData(jeanId) -> weight below 15th percentile
  4. calls suggestLabExams(jeanId, "poor growth + missed vaccines")
  5. Composes response with all findings
```

**Example 2: End-of-day workflow**
Doctor: "Wrap up my day"
```
Agent thinks: Doctor wants a full day summary.
  1. calls getTodaySchedule() -> 12 patients seen
  2. calls getDailyAnalytics() -> revenue, stats
  3. calls generateEndOfDaySummary() -> background job started
  4. Sends immediate summary of stats
  5. When background job completes -> sends detailed summary
```

**Example 3: Write with confirmation**
Doctor: "Schedule Jean for next Monday 9am, vaccination"
```
Agent thinks: This is a write operation, needs confirmation.
  1. calls searchPatients("Jean") -> finds Jean Baptiste
  2. calls getAvailableSlots("2026-03-30") -> 9am is available
  3. Responds: "I'll schedule Jean Baptiste (3y, M) for Mon March 30
     at 9:00 AM — Vaccination visit. Reply YES to confirm."
  Doctor: "YES"
  4. calls createAppointment(jeanId, "2026-03-30", "09:00", "vaccination")
  5. Responds: "Done! Jean Baptiste is scheduled for Mon March 30 at 9 AM."
```

### Background Jobs & Notifications

Some operations take longer (report generation, batch checks). The agent handles these by:

1. **Scheduling a Convex action** via `ctx.scheduler.runAfter(0, internal.whatsapp.backgroundJob, {...})`
2. **Sending an immediate acknowledgment:** "Working on your report... I'll send it when it's ready."
3. **Background job completes** -> triggers a new WhatsApp message to the doctor with results

This keeps the WhatsApp response fast (< 10 seconds) while supporting heavy operations.

---

## What Doctors Can Do via WhatsApp

This is a **general-purpose agentic chat** -- not tied to a specific patient. The doctor can ask about any patient, switch between patients, chain requests, or ask general questions all in one conversation. The agent maintains context across messages.

### Example Conversations

**Quick patient check:**
> Doctor: "How's Marie Duval doing?"
> ScrybeGPT: *Marie Duval (8m, F) — Last visit: March 15*
> *Weight: 7.8kg (50th percentile), Height: 68cm (45th)*
> *Allergies: None known*
> *Last Rx: Vitamin D drops*
> *Vaccines: Up to date, next due: DTP3 in April*

**Multi-step clinical assistance:**
> Doctor: "Patient Jean has a fever 39.2 and ear pain for 2 days"
> ScrybeGPT: *Looking up Jean...*
> *Jean Baptiste (3y, M) — Weight: 14.2kg*
> *Allergies: Penicillin*
>
> *Likely DDx:*
> *1. Acute otitis media (most likely given ear pain + fever)*
> *2. Otitis externa*
> *3. URI with referred ear pain*
>
> *Suggested Rx (penicillin-safe):*
> *- Azithromycin 200mg/5ml — 5ml once daily x 5 days*
> *- Ibuprofen 100mg/5ml — 4ml q6h PRN fever/pain*
>
> *Want me to suggest labs or record these findings?*

**Background job:**
> Doctor: "Generate a full report for Sophie Bernard"
> ScrybeGPT: "Working on Sophie's report... I'll send it when ready."
> *(30 seconds later)*
> ScrybeGPT: *Sophie Bernard — Comprehensive Report*
> *[Full formatted report with history, growth, vaccines, recent visits...]*

**Write operation:**
> Doctor: "New patient: Marc Pierre, born 2025-06-10, male, mom: Julie Pierre"
> ScrybeGPT: *I'll create this patient:*
> *- Name: Marc Pierre*
> *- DOB: June 10, 2025 (9 months)*
> *- Sex: Male*
> *- Mother: Julie Pierre*
> *Reply YES to confirm.*
> Doctor: "YES"
> ScrybeGPT: *Done! Marc Pierre has been added to your patients.*

---

## Messaging Provider Strategy: Kapso First, Meta Direct Later

### Phase 1: Kapso (Development + Early Production)

**Kapso** (kapso.ai) handles ONLY the messaging layer — phone number + send/receive messages. All AI logic stays with us.

```
Doctor sends WhatsApp message
  -> Kapso receives it
  -> Kapso forwards webhook to our Convex HTTP endpoint
  -> Our AI pipeline (unchanged)
  -> We call Kapso SDK to send reply back
```

**Why start with Kapso:**
- **Instant phone number** — no 2-4 week wait for Meta business verification
- **Zero setup friction** — sign up, get number, configure webhook, done
- **TypeScript SDK** (`@kapso/whatsapp-cloud-api`) — clean API for send/receive
- **Free tier** (2K msgs/month) — enough for development + early testing with 1-2 doctors

**Kapso pricing:**

| Plan | Messages/month | Cost |
|------|---------------|------|
| Free | 2,000 | $0 |
| Pro | 100,000 | $25/month |
| Platform | 1,000,000 | $299/month |

**What Kapso gives us:** Phone number, webhook delivery, message sending API
**What Kapso does NOT do:** AI, patient data, intent classification, medical logic — that's all ours

**Env vars needed:** `KAPSO_API_KEY`, `KAPSO_PHONE_NUMBER_ID` (in Convex environment)

### Phase 2: Migrate to Meta Cloud API Direct (Production Scale)

When ready to eliminate the $25/month cost and remove the middleman:

1. Create Meta Business Account + Developer Account
2. Register a dedicated phone number (local Digicel/Natcom for Haiti)
3. Complete business verification (2-7 business days)
4. Submit template messages for approval
5. Swap `convex/whatsappClient.ts` from Kapso SDK -> Meta REST API (single file change)
6. Update env vars: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`

**Meta Cloud API costs:** Near-zero. Service conversations (doctor texts ScrybeGPT) are **FREE**. Only proactive notifications cost money (~$0.004-0.008/message).

### Provider Comparison

| | Kapso (Start Here) | Meta Cloud API (Migrate Later) |
|---|---|---|
| Setup time | **Minutes** | 1-4 weeks (verification) |
| Phone number | **Instant** | BYO, needs verification |
| Monthly cost | $0-25 | **$0** (service convos free) |
| Per-message markup | Included in plan | **None** |
| SDK | TypeScript SDK | REST API (fetch calls) |
| Migration effort | -- | Swap 1 file (`whatsappClient.ts`) |

### Required Template Messages

Needed for business-initiated messages (submit via Kapso dashboard, later via Meta):

1. **Link Confirmation:** "Your WhatsApp is now linked to Pediascrybe. Send any message to start chatting with ScrybeGPT!"
2. **Daily Summary** (Phase 6): "Good morning Dr. {{1}}! You have {{2}} patients today. Reply 'schedule' for details."
3. **Quota Warning:** "You've used {{1}} of your {{2}} ScrybeGPT messages this month. Upgrade for more."

---

## New Database Tables

### `whatsappLinks` -- Maps WhatsApp numbers to doctor accounts

```
doctorId:               v.id("doctors")
phoneNumber:            v.optional(v.string())  // E.164 format, set after QR scan
whatsappId:             v.optional(v.string())  // WhatsApp user ID from webhook
status:                 "pending" | "active" | "revoked"
linkToken:              v.string()              // Unique token embedded in QR code
linkTokenExpiresAt:     v.number()              // Token expiry (10 min)
linkedAt:               v.optional(v.number())
createdAt:              v.number()

Indexes: by_phoneNumber, by_whatsappId, by_doctorId, by_linkToken
```

### `whatsappMessages` -- Conversation history

```
doctorId:               v.id("doctors")
whatsappMessageId:      v.string()           // Meta's msg ID (dedup)
role:                   "user" | "assistant"
content:                v.string()
intent:                 v.optional(v.string())
patientId:              v.optional(v.id("patients"))
createdAt:              v.number()

Indexes: by_doctorId, by_doctorId_createdAt, by_whatsappMessageId
```

### `whatsappPendingActions` -- Clinical proposals + write operations awaiting doctor review

```
doctorId:               v.id("doctors")
action:                 v.string()              // "diagnostic" | "medication" | "labExam" | "createPatient" | "createAppointment" | etc.
patientId:              v.optional(v.id("patients"))
appointmentId:          v.optional(v.id("appointments"))
proposedData:           v.string()              // JSON: { diagnoses: [...], medications: [...], exams: [...] }
preview:                v.string()              // Human-readable summary shown to doctor
status:                 "pending" | "confirmed" | "edited" | "cancelled" | "expired"
editHistory:            v.optional(v.string())  // JSON array of edit instructions applied
resultEntityId:         v.optional(v.string())  // ID of created/updated record (for undo)
linkedActionId:         v.optional(v.id("whatsappPendingActions"))  // Chain: diagnostic -> medication -> labs
expiresAt:              v.number()              // Auto-expire after 10 min
createdAt:              v.number()

Indexes: by_doctorId_status, by_doctorId_createdAt
```

---

## Doctor Linking Flow (QR Code — Like WhatsApp Web)

```
   Pediascrybe Web App                          Doctor's Phone
   ==================                          ==============

   1. Doctor clicks "Link WhatsApp"
      in Settings

   2. System generates unique token
      + creates whatsappLinks record
      (status: "pending", 10min expiry)

   3. QR code displayed on screen     ----->   4. Doctor scans QR with phone camera
      Contains: wa.me/SCRYBEGPT_NUMBER               |
      ?text=LINK_<token>                              v
                                               5. WhatsApp opens with pre-filled
                                                  message "LINK_<token>"
                                                  Doctor taps Send
                                                        |
                                                        v
   6. Webhook receives message         <-----  Message arrives at ScrybeGPT number
      - Extracts token from text
      - Matches to pending whatsappLinks
      - Captures doctor's phone number
      - Sets status: "active"

   7. Web app shows "Linked!"                  8. Doctor receives welcome message:
      (real-time via Convex subscription)         "You're connected to ScrybeGPT!
                                                   Send any message to get started."
```

**Why QR code over OTP:**
- More familiar — same pattern as WhatsApp Web, Telegram, Signal
- One scan instead of typing a 6-digit code
- No template message needed for OTP (saves cost + no Meta approval needed)
- Doctor never manually enters their phone number (captured automatically from webhook)

**Security:**
- Token is cryptographically random, single-use, expires in 10 minutes
- Token only works for the authenticated doctor who generated it
- Each doctor can only have one active WhatsApp link
- Doctor can revoke the link anytime from Settings

---

## Feature Gating

- Add `whatsapp_scrybegpt: ["pro", "premium"]` to `FEATURE_ACCESS` in `convex/subscriptions.ts`
- WhatsApp messages increment the existing `scrybegptMessages` counter in the `usage` table
- Need a new `internalMutation` variant for usage increment (existing mutations require browser auth; WhatsApp flow authenticates via phone link)

---

## Interactive Clinical Workflow — Propose, Review, Save

The most powerful feature: ScrybeGPT doesn't just suggest — it creates **actionable clinical proposals** that the doctor can approve, edit, and save directly to the patient record. No need to open the app.

### The Propose -> Review -> Save Cycle

The interaction is fully **natural language** — no menu codes, no button letters. The doctor just talks normally and the agent understands the intent.

```
Doctor: "Jean has fever 39.2, ear pain 2 days, runny nose"

ScrybeGPT:
  1. Fetches Jean's profile (3y, 14.2kg, allergic to penicillin)
  2. Calls proposeDiagnostic -> AI generates DDx from symptoms + patient context
  3. Sends proposal:

  *Proposed Diagnosis for Jean Baptiste (3y, M)*

  1. Acute otitis media (most likely)
  2. Upper respiratory infection
  3. Otitis externa (less likely)

  Would you like to save this to his record? I can also
  suggest medications if you'd like.

Doctor: "yes save it and give me meds too"

ScrybeGPT:
  4. Saves diagnosis to appointment record
  5. Calls proposeMedication -> AI generates Rx (penicillin-safe, weight-dosed)
  6. Sends proposal:

  *Diagnosis saved!*

  *Proposed Medications for Jean Baptiste*
  (Based on: Acute otitis media | Weight: 14.2kg | Allergy: Penicillin)

  1. Azithromycin 200mg/5ml — 7ml once daily x 5 days
  2. Ibuprofen 100mg/5ml — 4ml every 6h PRN fever/pain
  3. Saline nasal drops — 2 drops each nostril 3x daily

  Should I save these, or would you like to adjust anything?

Doctor: "change azithromycin dose to 5ml and add ear drops"

ScrybeGPT:
  7. Updates the proposal:

  *Updated Medications:*
  1. Azithromycin 200mg/5ml — *5ml* once daily x 5 days  _(changed)_
  2. Ibuprofen 100mg/5ml — 4ml every 6h PRN fever/pain
  3. Saline nasal drops — 2 drops each nostril 3x daily
  4. Ciprofloxacin ear drops 0.3% — 3 drops affected ear 2x daily  _(added)_

  Want me to save this?

Doctor: "looks good, save"

ScrybeGPT:
  8. Saves medications to Jean's appointment record
  9. Confirms:

  *All saved to Jean Baptiste's record:*
  - Diagnosis: Acute otitis media, URI, Otitis externa (r/o)
  - 4 medications prescribed
  - Appointment updated: March 23, 2026

  Need anything else for Jean, or want me to suggest labs?

Doctor: "no that's it, who's my next patient?"

ScrybeGPT:
  10. Switches context seamlessly:

  *Next up at 10:30 AM:*
  Sophie Bernard (8m, F) — Growth check
```

### How It Works Technically

**State tracking via `whatsappPendingActions` table:**

```
When agent proposes something:
  -> Create pendingAction record with:
     - action: "diagnostic" | "medication" | "labExam"
     - patientId, appointmentId
     - proposedData: { diagnoses: [...], medications: [...], exams: [...] }
     - status: "pending"
     - expiresAt: now + 10 minutes

The agent interprets the doctor's natural language response:
  -> "yes save it" / "looks good" / "save" / "ok" / "go ahead"
     => saves to record, status: "confirmed"
  -> "change X to Y" / "remove the saline" / "add ear drops" / "lower the dose"
     => agent modifies proposedData, sends updated proposal, status: "edited"
  -> "no" / "discard" / "never mind" / "skip"
     => status: "cancelled"
  -> "also give me meds" / "suggest labs too" / "what about medication?"
     => triggers next proposal tool, links to same appointment
  -> "who's my next patient?" / completely different topic
     => agent understands the doctor moved on, expires pending action
```

**The agent handles edits naturally — no codes or menus:**
- "remove ibuprofen" -> removes it from the list
- "change azithromycin dose to 10ml" -> updates specific field
- "add amoxicillin 250mg" -> agent catches this: "Jean is allergic to penicillin. Amoxicillin is a penicillin-class antibiotic. Should I suggest an alternative?"
- "swap 1 and 2" -> reorders items
- "the dosage seems high, what do you recommend for his weight?" -> agent recalculates and explains

### Chaining Proposals

The doctor can request everything at once or step by step — the agent adapts:

```
Doctor: "Jean has fever and ear pain, give me the full workup"

ScrybeGPT:
  1. Proposes diagnosis
  "Here's what I'm thinking... want me to save and move on to medications?"
  2. Doctor: "yes go ahead"
  3. Saves diagnosis, proposes medications
  "These are allergy-safe for Jean. Save and check if labs are needed?"
  4. Doctor: "save but I don't need labs"
  5. Saves medications, done.
```

Or the doctor can be more specific:
- "What do you think Jean has?" -> just diagnostic, no meds unless asked
- "Prescribe something for Jean's otitis" -> just medication
- "Do I need labs for this?" -> just lab suggestions
- "The whole thing — diagnose, prescribe, and labs" -> full chain automatically

### Doctor Preference Learning — The AI Gets Smarter Over Time

ScrybeGPT learns each doctor's clinical style and preferences without fine-tuning or RLHF. Instead, it uses **distilled preference rules + RAG** injected into the prompt only when relevant.

**How it learns:**
Every time a doctor edits or rejects a proposal, a nano model extracts a structured preference rule:

```
Doctor edits: "change azithromycin from 7ml to 5ml"
  -> Extracted rule (stored, ~15 tokens):
     { drug: "azithromycin", condition: "otitis_media", pref: "5ml for under 5y" }

Doctor always adds ibuprofen for ear infections:
  -> Extracted rule:
     { condition: "otitis_media", pattern: "always includes ibuprofen PRN" }

Doctor rejects cephalosporins for UTI:
  -> Extracted rule:
     { condition: "UTI", pattern: "prefers nitrofurantoin over cephalosporins" }
```

**Three tiers of context, loaded only when needed:**

| Tier | What | When Loaded | Token Cost |
|------|------|-------------|------------|
| *Always* | Top 10 preferences (most frequent) | Every message | ~200 tokens |
| *On-demand* | Condition-specific preferences | Only for clinical proposals matching that condition | ~100 tokens |
| *RAG* | 1-2 similar past approved cases | Only for clinical proposals, via vector search | ~200 tokens |

**Cost comparison:**

| Message Type | Context Loaded | Extra Tokens |
|-------------|---------------|-------------|
| "Who do I have today?" | None (no clinical decision) | +0 |
| "How's patient Jean?" | None (read-only lookup) | +0 |
| "Prescribe for Jean's otitis" | Top 10 prefs + otitis prefs + 1 past case | +~500 |
| "Full workup for Jean" | Top 10 prefs + condition prefs + 2 past cases | +~500 |

**~500 extra tokens on clinical proposals only.** Casual queries cost nothing extra. A typical AI call is 2000-4000 tokens, so this adds ~15-25% only for the calls that benefit from it.

**How it stays small:**
- Preferences are **distilled rules, not raw conversations** — nano model extracts structured patterns
- **Capped at 20 rules per doctor** — oldest/least-used evicted automatically
- **Condition-indexed** — tagged by condition, only relevant ones loaded
- **RAG returns 1-2 cases max** — most similar past decision, not a history dump
- **Periodic consolidation** — if 5 rules say the same thing, merge them into 1

**New table: `doctorPreferences`**

```
doctorId:           v.id("doctors")
category:           v.string()           // "dosing" | "drug_choice" | "lab_preference" | "general"
condition:          v.optional(v.string()) // "otitis_media" | "anemia" | null (general)
rule:               v.string()           // Compact rule text: "prefers azithromycin 5ml for under 5y"
confidence:         v.number()           // 0-1, increases with repeated confirmations
sourceCount:        v.number()           // How many interactions confirmed this pattern
lastUsedAt:         v.number()
createdAt:          v.number()

Indexes: by_doctorId, by_doctorId_condition, by_doctorId_confidence
```

**New table: `clinicalDecisionLog`**

```
doctorId:           v.id("doctors")
patientId:          v.id("patients")
appointmentId:      v.optional(v.id("appointments"))
decisionType:       v.string()           // "diagnostic" | "medication" | "labExam"
proposed:           v.string()           // JSON: what the AI proposed
final:              v.string()           // JSON: what the doctor approved (after edits)
edits:              v.optional(v.string()) // JSON: list of changes the doctor made
outcome:            v.string()           // "approved" | "edited" | "rejected"
embedding:          v.optional(v.array(v.float64()))  // For RAG vector search
conditionTags:      v.array(v.string())  // ["otitis_media", "fever"] for indexing
createdAt:          v.number()

Indexes: by_doctorId, by_doctorId_decisionType, by_conditionTags
Vector index: by_embedding (for RAG search)
```

### Allergy & Safety Checks

Every medication proposal runs through safety checks:
- **Allergy cross-check:** Flags drugs in the patient's allergy class
- **Weight-based dosing:** Calculates mg/kg for pediatric dosages
- **Age appropriateness:** Flags drugs not recommended for the patient's age group
- **Drug interactions:** Checks against current medications on record
- **Duplicate check:** Warns if a similar drug is already prescribed

```
ScrybeGPT: ⚠️ *Safety alert:* You asked for amoxicillin, but Jean is
allergic to *Penicillin* (amoxicillin is a penicillin-class antibiotic).

Suggested alternative: Azithromycin 200mg/5ml
Reply *A* to use the alternative, or *E* to choose a different drug.
```

---

## AI Integration — Vercel AI SDK Agent + AI Elements

### Core: AI SDK `generateText` with Tool Calling

The agent uses Vercel AI SDK's `generateText` with `tools` and `maxSteps` for multi-step reasoning. This is NOT simple intent classification — the LLM decides which tools to call, can chain them, and reasons across results.

```typescript
// Simplified — actual implementation in convex/whatsappAgent.ts
import { generateText, tool } from "ai";
import { getModel } from "@/lib/ai/providers";
import { z } from "zod";

const result = await generateText({
  model: getModel("balanced"),
  system: WHATSAPP_SYSTEM_PROMPT,
  messages: conversationHistory,
  tools: {
    searchPatients: tool({
      description: "Search doctor's patients by name, age, or condition",
      parameters: z.object({ query: z.string(), ageRange: z.optional(...) }),
      execute: async ({ query }) => {
        // Calls Convex internalQuery scoped to doctorId
        return await ctx.runQuery(internal.whatsappData.searchPatients, { doctorId, query });
      },
    }),
    getPatientSummary: tool({ ... }),
    generatePrescription: tool({ ... }),
    // ... all tools defined here
  },
  maxSteps: 8, // Allow up to 8 tool calls per message
});
```

### AI Elements for Structured Responses

Use Vercel AI SDK's **AI Elements** to return structured, typed data from tools — not just plain text. This lets us format WhatsApp responses precisely.

```typescript
// Tools return structured AI Elements instead of raw text
const generatePrescription = tool({
  description: "Generate prescription for patient",
  parameters: z.object({ patientId: z.string(), condition: z.string() }),
  execute: async ({ patientId, condition }) => {
    const patient = await ctx.runQuery(internal.whatsappData.getPatientSummary, { doctorId, patientId });

    // Return structured element — the agent uses this in its response
    return {
      type: "prescription",
      patient: patient.name,
      medications: [
        { drug: "Azithromycin 200mg/5ml", dose: "5ml", frequency: "once daily", duration: "5 days" },
      ],
      warnings: patient.allergies.length > 0 ? `Avoided: ${patient.allergies.join(", ")}` : null,
    };
  },
});

// The formatter knows how to render each element type for WhatsApp
function formatForWhatsApp(element) {
  switch (element.type) {
    case "prescription":
      return `*Rx for ${element.patient}:*\n${element.medications.map(m =>
        `- ${m.drug} — ${m.dose} ${m.frequency} x ${m.duration}`
      ).join("\n")}${element.warnings ? `\n⚠️ ${element.warnings}` : ""}`;
  }
}
```

### Key Design Decisions

- **`generateText` not `streamText`:** WhatsApp is request-response, no streaming support
- **`maxSteps: 8`:** Agent can chain up to 8 tool calls per message (e.g., search patient -> get data -> generate Rx -> check vaccines)
- **All tools scoped to `doctorId`:** Injected at tool creation time, not exposed to the LLM
- **PII protection:** `omitPII()` applied before any patient data enters the AI prompt
- **Conversation context:** Last 10 message pairs from `whatsappMessages` table loaded as message history
- **Model selection:** `balanced` tier for the orchestrator agent (needs reasoning). Individual tools may use `fast` tier for simple lookups
- **Background jobs:** When a tool needs > 10s (report generation), it schedules a Convex action and returns "working on it..." — the background job sends a follow-up WhatsApp message when done

---

## Response Formatting & UX

### Typing Indicator
WhatsApp Business API supports showing "ScrybeGPT is typing..." while processing. The flow:
1. Message arrives -> **immediately** mark as read + send typing indicator
2. Agent runs tools, generates response (~3-10 seconds)
3. Send the response (typing indicator auto-clears)

```typescript
// In whatsappClient.ts
await markMessageAsRead(messageId);    // Blue checkmarks
await sendTypingIndicator(phoneNumber); // "ScrybeGPT is typing..."
// ... agent processes ...
await sendTextMessage(phoneNumber, response);
```

The doctor sees the typing bubble the entire time the agent is thinking — feels responsive even if it takes a few seconds.

### Chunked Responses (Instead of Streaming)
WhatsApp doesn't support streaming/partial messages. Each message is final. But for long responses, the agent **sends multiple messages** in sequence — which feels natural in WhatsApp (like texting):

```
ScrybeGPT: *Jean Baptiste (3y, M)*           <- sent immediately
ScrybeGPT: *Vitals from last visit:*          <- sent 1s later
           Weight: 14.2kg | Height: 96cm
ScrybeGPT: *Suggested Rx (penicillin-safe):*  <- sent 1s later
           - Azithromycin 200mg/5ml ...
```

This is better than one giant wall of text. The `whatsappFormat.ts` splitter handles this automatically based on content type (separate messages for summary, vitals, prescriptions, recommendations).

### Formatting Rules
WhatsApp supports: `*bold*`, `_italic_`, `~strikethrough~`, ` ```code``` `
No HTML, no markdown headers, no tables. Max 4096 chars per message.

Utility `formatForWhatsApp(text)`:
- `## X` -> `*X*`
- `**X**` -> `*X*`
- Strip HTML
- Split long responses into multiple messages by section

---

## Security

- **Doctor isolation:** Every query is scoped to the linked doctor's ID — a doctor can NEVER access another doctor's patients
- **QR code auth:** Cryptographically random token, single-use, 10-minute expiry, tied to authenticated session
- **Unlinked numbers rejected:** Messages from unknown numbers get "Please scan the QR code in your Pediascrybe settings"
- **Webhook signature:** Kapso webhook signature verification (later: HMAC-SHA256 with Meta app secret)
- **Message dedup:** Check `whatsappMessageId` before processing (webhooks may retry)
- **Rate limiting:** 20 msgs/min per doctor keyed by doctorId (Upstash Redis)
- **PII removal:** Same `omitPII` as existing chat — patient names/emails stripped from AI prompts
- **Phases 1-4 are read-only:** No write operations until Phase 5 (prevents data corruption from misclassified intents)
- **Write confirmation:** All write operations (Phase 5) require explicit YES reply before executing
- **Rollback:** Recent write operations can be undone via "undo last action"
- **Revocation:** Doctor can unlink WhatsApp anytime from Settings — immediately stops all access

---

## File Structure

```
convex/
  whatsapp.ts              -- Webhook handler + message orchestration (internalAction, "use node")
  whatsappAgent.ts         -- AI agent definition: system prompt, tool registration, generateText call
  whatsappTools/
    patientTools.ts        -- searchPatients, getPatientSummary, getPatientAppointments, getVaccinationRecords, getPatientGrowthData
    scheduleTools.ts       -- getTodaySchedule, getWeekSchedule, getAvailableSlots
    medicalTools.ts        -- proposeDiagnostic, proposeMedication, proposeLabExams (propose-review-save cycle)
    clinicalSafety.ts      -- Allergy cross-check, weight-based dosing, age checks, drug interactions
  whatsappPreferences.ts   -- Preference extraction (nano model), storage, retrieval, consolidation
  whatsappDecisionLog.ts   -- Clinical decision audit log + embeddings for RAG
    chartReportTools.ts    -- generateGrowthChart, generateReport, getDailyAnalytics, getMonthlyAnalytics
    writeTools.ts          -- createPatient, createAppointment, addAppointmentNote, recordVitals, logVaccination, undoLastAction
    backgroundTools.ts     -- generateFullReport, generateEndOfDaySummary, batchVaccineCheck
  whatsappData.ts          -- Internal queries/mutations for data access (all scoped to doctorId)
  whatsappLinks.ts         -- Doctor linking (mutations, queries, QR token logic)
  whatsappClient.ts        -- Kapso SDK calls (send message, send template, typing indicator, mark read)
                              Later: swap to Meta Cloud API (single file change)
  whatsappFormat.ts        -- AI Element formatters for WhatsApp (prescription, schedule, chart, etc.)
  whatsappPrompts.ts       -- System prompts (shared base + WhatsApp-specific agent instructions)
  whatsappBackground.ts    -- Background job runner + notification sender
  http.ts                  -- Add webhook route for Kapso (later: Meta GET + POST)
  schema.ts                -- Add whatsappLinks + whatsappMessages + whatsappPendingActions + doctorPreferences + clinicalDecisionLog tables
  subscriptions.ts         -- Add whatsapp_scrybegpt to FEATURE_ACCESS

app/user/settings/
  whatsapp/
    page.tsx               -- Settings page with QR code linking + status + revoke

components/whatsapp/
  WhatsAppQRCode.tsx       -- QR code generator (encodes wa.me link with token)
  WhatsAppLinkStatus.tsx   -- Shows linked/unlinked/pending status
  WhatsAppUnlinkButton.tsx -- Revoke link button with confirmation
```

---

## Critical Existing Files to Modify

- `convex/schema.ts` -- Add 2 new tables
- `convex/http.ts` -- Add WhatsApp webhook route for Kapso
- `convex/subscriptions.ts:8-36` -- Add `whatsapp_scrybegpt` to FEATURE_ACCESS
- `package.json` -- Add `@kapso/whatsapp-cloud-api` + `qrcode.react` (QR code generation)

## Critical Existing Files to Reference/Reuse

- `convex/livekit.ts` -- Pattern for "use node" internal actions + webhook delegation
- `convex/http.ts:14-216` -- Webhook patterns (Stripe signature verification, LiveKit delegation)
- `app/workflows/medical-chat/steps/patient.ts:16-22` -- `omitPII()` function to extract/share
- `app/workflows/medical-chat/steps/patient.ts:69-108` -- Base system prompt to extract/share
- `lib/ai/providers.ts` -- `getModel()`, `getNanoModel()` for AI provider access
- `convex/subscriptions.ts` -- `FEATURE_ACCESS` map and tier checking patterns
- `lib/rate-limit.ts` -- Upstash rate limiting pattern

---

## Implementation Phases

### Phase 0: Web Chat Interface (General ScrybeGPT)
- [x] Create `/api/ai/scrybegpt` route (streaming, tool-calling, auth-gated)
- [x] Create `/user/scrybegpt` page (chat UI with suggestions, markdown rendering)
- [x] Add "Chat" nav item to sidebar under ScrybeGPT section
- [x] Tools: searchPatients, getPatientDetails, getTodaySchedule, getWeekSchedule, getTodayRevenue, getMonthlyRevenue, getVaccineRecords, getPatientCount, createPatient

### Phase 1: Foundation + Kapso + QR Linking
- [x] Set up Kapso account, get phone number, configure webhook URL
- [x] Add `whatsappLinks`, `whatsappMessages`, `whatsappPendingActions` tables to `convex/schema.ts`
- [x] Add `whatsapp_scrybegpt` to FEATURE_ACCESS
- [x] Implement webhook route in `convex/http.ts` (POST for Kapso webhook)
- [x] Implement `convex/whatsappClient.ts` (raw fetch to Kapso API — SDK had breaking bugs)
- [x] Implement `convex/whatsappLinks.ts` (QR token generation, token matching, linking, revocation)
- [x] Build settings UI with QR code (`app/user/settings/whatsapp/page.tsx`)
- [x] Build QR code component (`components/whatsapp/WhatsAppQRCode.tsx`)
- [x] Implement `convex/whatsapp.ts` (webhook handler with multi-format Kapso payload parsing)
- [x] Add `incrementUsageByDoctorId` internal mutation
- [x] Test end-to-end: generate QR -> scan -> link activates -> welcome message sent
- [x] **Bugfix:** `getDoctorByWhatsApp` — `.first()` could return revoked records; switched to `.collect().find(l => l.status === "active")`
- [x] **Bugfix:** Subscription tier check — `subscription.tierName` can be undefined; added fallback to `appUser.plan`
- [x] **Bugfix:** Kapso SDK (`@kapso/whatsapp-cloud-api`) broken — replaced with raw `fetch` to `https://api.kapso.ai/meta/whatsapp/v23.0`
- [x] **Bugfix:** AI Gateway auth — requires `AI_GATEWAY_API_KEY` env var in Convex
- [x] **Bugfix:** Empty agent response (msgLen=0) — added fallback to extract last tool result
- [x] **Bugfix:** Reaction typing indicator (⏳) caused phantom "1 unread message" — removed entirely

### Phase 2: Agent Core + Patient Tools
- [x] Implement `convex/whatsappAgent.ts` (AI SDK `generateText` with tools + `stopWhen: stepCountIs(8)`)
- [x] Implement `convex/whatsappPrompts.ts` (system prompt with agent instructions)
- [x] Implement `convex/whatsappData.ts` (internal queries scoped to doctorId)
- [x] Implement `convex/whatsappFormat.ts` (AI Element -> WhatsApp formatters)
- [x] Build Patient Tools (`convex/whatsappTools/patientTools.ts`):
  - [x] `searchPatients` — fuzzy name search
  - [x] `getPatientSummary` — full profile with recent data
  - [x] `getPatientAppointments` — appointment history
  - [x] `getVaccinationRecords` — vaccine history + due dates
  - [x] `getPatientGrowthData` — growth measurements over time
- [x] Build Schedule Tools (`convex/whatsappTools/scheduleTools.ts`):
  - [x] `getTodaySchedule` — today's appointments
  - [x] `getWeekSchedule` — weekly view
- [x] Wire up full pipeline: webhook -> agent -> tools -> format -> reply
- [x] **Timezone:** Doctor-specific timezone support via `convex/timezone.ts` (IANA timezones, defaults to America/Port-au-Prince)
- [x] **Timezone:** Added `timezone` field to doctors schema, edit profile form, and API route
- [x] **Timezone:** Daily summary cron runs hourly, sends at 7am in each doctor's local timezone
- [x] **Timezone:** `getTodaySchedule`, `getWeekSchedule`, `getDailyAnalytics` all use doctor's timezone
- [ ] Test: "Who do I have today?", "How's patient Jean?", "Vaccines due for Marie?"

### Phase 3: Clinical Decision Tools (Propose -> Review -> Save)
- [x] Build Medical Tools (`convex/whatsappTools/medicalTools.ts`):
  - [x] `proposeDiagnostic` — DDx from symptoms + vitals + demographics + history
  - [x] `proposeMedication` — Rx based on diagnosis, weight-dosed, allergy-safe
  - [x] `proposeLabExams` — age-appropriate labs based on suspected diagnosis
- [x] Build Clinical Safety (`convex/whatsappTools/clinicalSafety.ts`):
  - [x] Allergy cross-check (flag drugs in patient's allergy class)
  - [x] Weight-based dosing calculator (mg/kg for pediatric doses)
  - [x] Age-appropriateness check
  - [x] Drug interaction check (against current medications)
  - [x] Duplicate prescription warning
- [x] Implement propose-review-save cycle:
  - [x] Pending action creation with proposed data
  - [x] A (approve) -> save to appointment record
  - [x] E (edit) -> agent modifies proposal based on natural language instructions
  - [x] X (discard) -> cancel
  - [x] M/L (chain) -> trigger next proposal linked to same appointment (via linkedActionId in tools)
- [x] Implement clinical decision logging (`convex/whatsappDecisionLog.ts`):
  - [x] Log every proposal + edits + final approved version
  - [x] Generate embeddings for RAG retrieval on past decisions
  - [x] Tag decisions with condition labels for indexing
- [x] Implement doctor preference learning (`convex/whatsappPreferences.ts`):
  - [x] After each edit/rejection, run nano model to extract structured preference rule
  - [x] Store in `doctorPreferences` table (capped at 20 per doctor)
  - [x] Increment confidence + sourceCount when pattern is confirmed again
  - [x] Evict lowest-confidence rules when cap reached
  - [x] Consolidate duplicate rules periodically (weekly cron)
- [x] Inject preferences into clinical proposals:
  - [x] Always: top 10 preferences by confidence
  - [x] On-demand: condition-specific preferences when proposing for that condition
  - [x] RAG: 1-2 similar past approved cases via vector search
- [ ] Test full clinical flow: symptoms -> diagnosis -> approve -> medications -> edit -> approve -> save
- [ ] Test preference learning: edit Rx twice for same condition -> verify third proposal matches preference
- [ ] Test safety: propose allergy-conflicting drug -> agent warns + suggests alternative
- [x] Conversation context: rolling 20-message window, 30min session timeout

### Phase 4: Charts, Documents & Analytics
- [x] Build Chart/Report/Document Tools (`convex/whatsappTools/chartReportTools.ts`):
  - [x] `generateGrowthSummary` — text summary of WHO percentile position
  - [ ] `generateGrowthChartPDF` — full growth chart as downloadable PDF (requires canvas, deferred)
  - [x] `generateReport` — medical report / certificate / reference note as PDF
  - [x] `generatePrescriptionPDF` — prescription document as PDF (`whatsappPdf.ts` + `sendPrescriptionPdf`)
  - [x] `generateReceipt` — visit invoice as PDF (`whatsappPdf.ts` + `sendReceiptPdf`)
  - [x] `getReportsForPatient` — fetch existing reports
  - [x] `getReceiptsForPatient` — fetch existing receipts
  - [x] `getMonthlyAnalytics` — trends and summaries
- [x] Server-side PDF generation via jsPDF in Convex Node actions (`convex/whatsappPdf.ts`)
- [x] Store generated PDFs in Convex file storage, send via WhatsApp document API
- [x] PDF tools: `sendPrescriptionPdf`, `sendLabExamPdf`, `sendReceiptPdf`, `sendPatientSummaryPdf`
- [ ] Test multi-step chains: "Check Jean's growth and suggest labs if anything is off"
- [ ] Test PDF delivery: "Send me Marie's prescription as PDF"

### Phase 5: Polish & Production
- [x] Rate limiting per doctor (in-memory, 20 msgs/min)
- [x] Message deduplication (by whatsappMessageId)
- [x] Error handling + graceful fallbacks ("I'm having trouble, please try again")
- [x] Quota exceeded messaging ("You've used X of Y messages this month")
- [x] Tool timeout handling (typing indicator refreshed every 10s during agent execution)
- [x] Monitoring: log tool calls, latencies, errors per doctor (structured console.log per request)
- [ ] Testing with multiple doctors simultaneously

### Phase 6: Write Tools + Confirmation Flow
- [x] Build Write Tools (`convex/whatsappTools/writeTools.ts`):
  - [x] `createPatient` — creates patient record
  - [x] `createAppointment` — schedules appointment
  - [x] `addAppointmentNote` — adds internal notes
  - [x] `recordVitals` — saves vitals to appointment
  - [x] `logVaccination` — records vaccine dose
  - [x] `undoLastAction` — rollback most recent write (patient creation, appointment scheduling, within 5min)
- [x] Add `whatsappPendingActions` table for confirmation state tracking
- [x] Confirmation flow: tool returns preview -> agent asks "Reply YES" -> next message confirms -> executes
- [ ] Test: "New patient Marc Pierre, born 2025-06-10, male" -> confirm -> created

### Phase 7: Background Jobs + Notifications
- [x] Build Background Tools (`convex/whatsappTools/backgroundTools.ts`):
  - [x] `generateFullReport` — comprehensive patient report (async)
  - [x] `generateEndOfDaySummary` — daily wrap-up (async)
  - [x] `batchVaccineCheck` — check vaccines for age range (async)
  - [x] `sendPrescriptionPdf` — prescription PDF generation + delivery
  - [x] `sendLabExamPdf` — lab exam order PDF generation + delivery
  - [x] `sendReceiptPdf` — receipt PDF generation + delivery
  - [x] `sendPatientSummaryPdf` — patient summary PDF generation + delivery
- [x] Implement `convex/whatsappBackground.ts` (job runner + WhatsApp notification on completion)
- [x] Proactive notifications: scheduled Convex cron for daily summary at 7am (convex/crons.ts)
- [ ] Test: "Generate full report for Sophie" -> "Working on it..." -> report arrives 30s later

### Phase 8: Future — Media + Voice + Migration
- [ ] Photo processing (lab result images -> OCR/AI)
- [ ] Voice message transcription (WhatsApp voice notes -> text -> process as message)
- [ ] Migrate from Kapso to Meta Cloud API direct (swap `whatsappClient.ts`)
- [ ] Get dedicated business phone number + Meta verification
- [ ] Appointment reminders via WhatsApp (template messages)

---

## Verification / Testing

1. **Schema:** Run `npx convex dev` -- verify new tables deploy without errors
2. **Kapso webhook:** Send test message to ScrybeGPT number -> verify webhook hits Convex endpoint + returns 200
3. **QR linking:** Generate QR in settings -> scan with phone -> WhatsApp opens -> send token -> verify link activates in real-time
4. **Doctor isolation:** Link two different doctors -> verify each can only see their own patients
5. **Unlinked rejection:** Send message from unlinked number -> verify "scan QR code" response
6. **AI Pipeline:** Send patient-related messages -> verify intent classification -> verify correct data fetched -> verify formatted reply
7. **Feature gating:** Test with free-tier doctor -> should get upgrade prompt; test with pro-tier -> should work
8. **Usage tracking:** Send messages -> verify `scrybegptMessages` increments in usage table
9. **Rate limiting:** Send rapid messages -> verify 429-equivalent response after limit
10. **Dedup:** Resend same webhook payload -> verify message not processed twice
11. **Revoke:** Unlink from settings -> send message -> verify "scan QR code" response
12. **Clinical workflow:** Describe symptoms -> get DDx proposal -> approve -> get Rx proposal -> edit -> approve -> verify all saved to appointment
13. **Safety checks:** Propose penicillin for penicillin-allergic patient -> verify warning + alternative suggestion
14. **Preference learning:** Edit azithromycin dose 3x for otitis -> next otitis proposal should use the doctor's preferred dose
15. **Proposal expiry:** Generate proposal -> wait 10 min -> try to approve -> verify expired message
15. **PDF delivery:** Request prescription/receipt/summary PDF -> verify downloadable documents received via WhatsApp
16. **Migration test:** Swap `whatsappClient.ts` to Meta API -> verify same behavior

---

## Production Environment

### Convex Env Vars (set)
- `KAPSO_API_KEY` — Kapso API key for WhatsApp Cloud API proxy
- `KAPSO_PHONE_NUMBER_ID` — `1074555125732762`
- `KAPSO_WEBHOOK_SECRET` — HMAC-SHA256 webhook verification
- `AI_GATEWAY_API_KEY` — Vercel AI Gateway key (used by `gateway()` in whatsappAgent)

### Webhook
- URL: `https://groovy-crocodile-680.convex.site/whatsapp/webhook`
- Receives Kapso batched format (`{ type: "whatsapp.message.received", data: [...] }`) and single format

### Key Files
- `convex/whatsappClient.ts` — Raw fetch to Kapso API (not SDK)
- `convex/whatsappAgent.ts` — AI agent with Vercel AI SDK `generateText` + tools
- `convex/whatsappPdf.ts` — Server-side PDF generation via jsPDF
- `convex/whatsappBackground.ts` — Background jobs (reports, PDFs, summaries)
- `convex/whatsappData.ts` — All internal queries scoped by doctorId
- `convex/whatsappLinks.ts` — QR linking, doctor lookup
- `convex/whatsapp.ts` — Webhook handler
- `convex/crons.ts` — Daily summary at 12:00 UTC (7am Haiti)
- `app/api/ai/scrybegpt/route.ts` — Web chat API (streaming)
- `app/user/scrybegpt/page.tsx` — Web chat UI
