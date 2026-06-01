# Pediascrybe - Features & Capabilities Report

**Date:** March 30, 2026
**Platform:** Next.js + Convex | Full-Stack Pediatric EMR

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Electronic Medical Records (EMR)](#2-electronic-medical-records-emr)
3. [WHO Growth Charts](#3-who-growth-charts)
4. [Vaccination Management](#4-vaccination-management)
5. [AI-Powered Clinical Support (ScrybeGPT)](#5-ai-powered-clinical-support-scrybegpt)
6. [WhatsApp ScrybeGPT Integration](#6-whatsapp-scrybegpt-integration)
7. [Patient Portal (Parent Access)](#7-patient-portal-parent-access)
8. [Telehealth & Video Consultations](#8-telehealth--video-consultations)
9. [Billing, Receipts & Subscriptions](#9-billing-receipts--subscriptions)
10. [Dashboard & Analytics](#10-dashboard--analytics)
11. [Email & Notification System](#11-email--notification-system)
12. [Offline Support & PWA](#12-offline-support--pwa)
13. [PDF & Print Exports](#13-pdf--print-exports)
14. [Security, Audit & Compliance](#14-security-audit--compliance)
15. [Subscription Tiers & Feature Gating](#15-subscription-tiers--feature-gating)
16. [Technical Architecture](#16-technical-architecture)

---

## 1. Platform Overview

Pediascrybe is a full-featured pediatric electronic medical records platform built for doctors practicing in resource-varied settings. It combines clinical record-keeping with AI-powered decision support, parent engagement tools, telehealth capabilities, and a WhatsApp-based AI assistant.

**Key Stats:**
- 80+ application pages across doctor, portal, and public routes
- 32 database tables
- 67 backend modules (11,400+ lines of server logic)
- 222 React components
- 38 API route handlers

---

## 2. Electronic Medical Records (EMR)

### Patient Management
- **Patient profiles** with demographics (name, DOB, gender, blood type, address, guardian info)
- **Medical history** tracking (allergies, chronic conditions, surgical history, family history)
- **Patient search** with real-time filtering across doctor's patient roster
- **Age calculation** with display in years/months/days depending on patient age

### Appointments & Clinical Visits
- **Appointment creation** with date, reason for visit, and clinical notes
- **Vitals recording**: weight, height, head circumference, temperature, heart rate, blood pressure, respiratory rate, oxygen saturation
- **Clinical findings**: symptoms, physical examination, diagnosis (with ICD-compatible coding)
- **Medications/Prescriptions**: drug name, dosage, frequency, duration, route of administration
- **Lab exams**: exam type, results, reference ranges, interpretation
- **Clinical recommendations**: follow-up instructions, specialist referrals, lifestyle advice
- **File attachments**: images, PDFs, videos linked to appointments (via UploadThing)
- **Appointment history**: complete chronological visit timeline per patient

### Medical Reports
- **Custom report generation**: create structured medical reports from appointment data
- **AI-assisted report writing**: generate professional clinical reports with AI
- **Report editing and versioning**
- **Print-ready report views**

### Billing Receipts
- **Receipt creation**: link to appointments, list billable services with costs
- **Service catalog**: define and manage standard service pricing
- **Receipt editing and print views**
- **Transaction history** tracking

---

## 3. WHO Growth Charts

Full implementation of World Health Organization growth standards with interactive charting.

### Chart Types
| Chart | Age Range | Description |
|-------|-----------|-------------|
| Weight-for-Age (WFA) | 0-5 years, 5-19 years | Tracks weight against age norms |
| Height-for-Age (HFA) | 0-5 years, 5-19 years | Tracks height/length against age norms |
| Head Circumference-for-Age (HCFA) | 0-5 years | Tracks head growth |
| BMI-for-Age (BFA) | 0-5 years, 5-19 years | Body mass index tracking |
| Weight-for-Length (WFL) | 0-2 years | Weight relative to length |

### Features
- **Percentile overlays**: 3rd, 15th, 50th, 85th, 97th percentile curves
- **Gender-specific charts**: separate male/female reference data
- **Longitudinal plotting**: all patient measurements plotted over time
- **Interactive tooltips**: hover for exact values and percentile placement
- **Print-ready versions**: formatted for medical records
- **WHO reference data**: seeded from official WHO datasets

---

## 4. Vaccination Management

### Vaccine Tracking
- **Custom vaccine definitions**: doctors define which vaccines they track
- **Dose scheduling**: supports regular, annual, booster, and unique dose types
- **Vaccination records**: record date administered, lot number, site, administrator
- **Compliance tracking**: monitor completion status across patients
- **Global vaccine templates**: pre-built vaccine reference data for quick setup

### Vaccination Cards
- **Print-ready vaccination cards**: formatted cards with complete vaccination history
- **Per-patient vaccine timeline**: chronological view of all immunizations
- **Due/overdue alerts**: identify patients needing vaccinations

---

## 5. AI-Powered Clinical Support (ScrybeGPT)

### In-App AI Assistant
- **Doctor-wide ScrybeGPT**: general medical AI chat accessible from dashboard
- **Patient-specific AI chat**: context-aware conversations with full patient record access
- **Streaming responses**: real-time AI output with conversation history

### AI-Assisted Clinical Features
| Feature | Description |
|---------|-------------|
| **Diagnostic Suggestions** | AI-generated differential diagnosis based on symptoms, vitals, and patient history |
| **Medication Recommendations** | Age/weight-appropriate dosing with drug interaction awareness |
| **Lab Exam Suggestions** | Recommended diagnostics based on clinical presentation |
| **Report Generation** | AI-drafted medical reports from appointment data |
| **Text Completion** | AI-assisted writing for clinical notes |
| **Condition Classification** | Automated ICD-compatible diagnostic coding |

### Portal AI (Scrybe Assist)
- **Medical term explanations**: plain-language explanations of diagnoses, medications, and lab results for parents
- **Growth interpretation**: AI explains growth chart trends to parents
- **Vaccine education**: context-aware vaccination information
- **Cached explanations**: reusable AI explanations to reduce costs

---

## 6. WhatsApp ScrybeGPT Integration

The largest subsystem (15 modules, 4,400+ lines) providing a full AI medical assistant accessible via WhatsApp messaging.

### Architecture
```
Doctor sends WhatsApp message
  -> Webhook receives (Kapso/Meta format)
  -> Signature verification + rate limiting
  -> AI Agent with tool calling (Vercel AI SDK)
  -> Safety checks (medication interactions, age-appropriateness)
  -> Doctor reviews proposals
  -> Decision logged + preferences learned
```

### Tool Categories

**Patient Tools**
- Search and lookup patients by name
- Get comprehensive patient summaries (demographics, allergies, vitals history)

**Schedule Tools**
- View today's appointment schedule
- Check available appointment slots

**Medical Tools**
- Generate differential diagnosis proposals
- Suggest medications with dosing and safety checks
- Recommend lab exams

**Chart & Report Tools**
- Generate WHO growth charts as images
- Create medical reports and patient summaries
- Export PDFs (patient summary, growth charts)

**Write Tools** (require doctor confirmation)
- Create new patients
- Create appointments and record vitals
- Add clinical notes

**Background Tools**
- Batch vaccination compliance checks
- Bulk PDF generation
- Data cleanup operations

### Safety & Quality
- **Medication interaction checking**: cross-references current medications before suggesting new ones
- **Age-appropriateness validation**: dosing adjusted for pediatric patients
- **Duplicate detection**: prevents creating duplicate patient records
- **Confirmation workflow**: write operations require explicit doctor approval
- **Undo capability**: rollback recent patient creation or appointment changes

### Intelligence Features
- **Preference learning**: tracks doctor's preferred dosing protocols and drug choices
- **Clinical decision logging**: audit trail with vector embeddings for RAG retrieval
- **Multi-language support**: auto-detects doctor's language (French, English, Creole)
- **Conversation history**: maintains context across messages
- **Pending action management**: proposals expire after 10 minutes if unreviewed

### Automation
- **Daily summaries**: sent at 7am in doctor's timezone with appointment overview
- **Expiry cleanup**: auto-expire stale pending actions
- **Rate limiting**: 20 messages/minute per doctor
- **Message deduplication**: by WhatsApp message ID

### Doctor Linking
- **QR code linking**: scan to connect WhatsApp number to Pediascrybe account
- **Secure phone verification**: validates doctor identity before enabling WhatsApp access
- **Unlink capability**: disconnect WhatsApp at any time

---

## 7. Patient Portal (Parent Access)

A dedicated portal for parents/guardians to access their children's medical records.

### Invitation & Onboarding
- Doctor invites parent via email with a 7-day expiry token
- Parent signs up through invitation link
- Auto-accepts pending invitations on signup
- Multiple children can be linked to one parent account

### Parent Features
| Feature | Description |
|---------|-------------|
| **Child Overview** | Demographics, medical summary, recent visits |
| **Appointment History** | Chronological timeline of all clinical visits |
| **Appointment Details** | Read-only view of vitals, findings, medications, labs |
| **Prescription View** | Formatted prescription display with print option |
| **Lab Exam Results** | View lab results with reference ranges |
| **Vaccination Records** | Complete immunization history |
| **Growth Charts** | Interactive WHO growth charts with child's data plotted |
| **Document Upload** | Parents can upload relevant medical documents |
| **Notifications** | Real-time alerts for new prescriptions, labs, vaccines, appointments |
| **Telehealth Booking** | Schedule and join video consultations |
| **AI Explanations** | Scrybe Assist for plain-language medical term explanations |

### Access Control
- Role-based guard (`PortalRoleGuard`) verifies patient role
- 3-step auth: authenticated -> patient role -> patientAccounts link
- Parents only see children linked to their account
- All data is read-only (except document upload)

---

## 8. Telehealth & Video Consultations

### Doctor Side
- **Availability management**: set weekly recurring time slots (Monday-Sunday)
- **Exception dates**: block specific dates for holidays or unavailability
- **Appointment list**: view all scheduled telehealth consultations
- **Payment tracking**: mark appointments as paid or waived
- **Rescheduling**: propose new times to parents

### Parent Side
- **Slot picker**: browse available dates and times
- **Booking**: select slot and provide reason for visit
- **Appointment management**: view upcoming and past telehealth visits
- **Accept/decline reschedules**: respond to doctor-proposed changes

### Video Calls
- **LiveKit integration**: WebRTC-based video and audio
- **Waiting room**: pre-call staging area
- **Session tracking**: record start/end times
- **Token-based access**: secure room entry via LiveKit tokens

### Notifications
- Booking confirmation emails to both doctor and parent
- Reminder notifications before scheduled calls
- Reschedule and cancellation alerts

---

## 9. Billing, Receipts & Subscriptions

### Doctor Subscriptions (Stripe)
- **Three tiers**: Starter, Pro, Premium
- **Monthly and annual billing**: via Stripe Checkout
- **Billing portal**: self-service subscription management
- **Webhook integration**: real-time subscription lifecycle events
- **Usage tracking**: monthly quotas per feature per tier
- **Trial period**: 7-day free trial on signup

### Patient Subscriptions (Scrybe Assist)
- **Optional parent add-on**: $4.99/month for AI explanations
- **Free tier**: 5 AI explanations per month
- **Separate Stripe integration**: independent from doctor billing

### Service Billing
- **Service catalog**: define standard services with pricing
- **Receipt generation**: itemized billing per appointment
- **Transaction history**: complete payment log

---

## 10. Dashboard & Analytics

### Doctor Dashboard
- **Daily revenue chart**: revenue trends over time (Recharts)
- **Monthly revenue stat**: total income for current month
- **Today's revenue**: current day earnings
- **Total patients**: lifetime patient count
- **Today's patients**: appointments scheduled today
- **Recent patients**: new patients this month
- **Gender distribution chart**: male/female patient breakdown
- **Common conditions chart**: top diagnoses by frequency
- **Immunization status chart**: vaccination completion percentages across patients

---

## 11. Email & Notification System

### Technology
- **Resend** for email delivery
- **React Email** for template rendering
- **Convex actions** for server-side sending

### Email Templates
| Template | Purpose |
|----------|---------|
| **Email Verification** | Verify email during signup |
| **Magic Link** | Passwordless login |
| **OTP Verification** | One-time password codes |
| **Password Reset** | Secure password reset link |
| **Welcome** | Post-signup onboarding (7-day trial intro) |
| **Portal Invitation** | Parent portal invite with token link |
| **Portal Notification** | New prescription, lab, vaccine, or appointment summary |
| **Telehealth Notification** | Booking confirmation, reminders, reschedule/cancellation |

### Portal Notifications (In-App)
Parents receive real-time notifications for:
- New prescription added
- New lab exam results
- Appointment summary published
- Vaccination record added
- Telehealth booking, reschedule, or cancellation

---

## 12. Offline Support & PWA

### Progressive Web App
- **Installable**: native app-like install prompts on mobile and desktop
- **Service worker**: powered by Serwist (Turbopack-compatible)
- **Caching**: default cache strategies for assets and API responses

### Offline Data (IndexedDB via Dexie)
- **Cached tables**: patients, appointments, vaccines, growth charts
- **Offline dashboard**: functional dashboard view when disconnected
- **Offline patient list**: browse cached patients
- **Offline patient detail**: view cached patient data
- **Offline appointment detail**: view cached appointment records
- **Offline vaccination view**: browse cached vaccine records
- **Offline patient editing**: modify patient data while disconnected

### Sync System
- **Sync queue**: pending mutations queued for upload on reconnect
- **Conflict resolution**: dialog for resolving merge conflicts when server and local data diverge
- **Network status banner**: visual online/offline indicator
- **Auto-sync**: automatic queue processing on reconnection
- **Sync queue panel**: UI to view and manage pending sync operations

### Offline Auth
- **Cached auth**: `DoctorRoleGuard` checks IndexedDB for cached user data when offline

---

## 13. PDF & Print Exports

### Printable Views
- **Appointment summary**: formatted clinical visit printout
- **Prescriptions**: professional prescription layout
- **Lab exams**: formatted lab results with reference ranges
- **Growth charts**: all WHO chart types in print-ready format
- **Vaccination cards**: complete immunization history cards
- **Medical reports**: structured clinical reports
- **Billing receipts**: itemized receipt printouts

### PDF Generation
- **jsPDF**: server-side PDF generation for WhatsApp exports
- **react-to-print**: browser-based print formatting
- **WhatsApp PDF exports**: patient summaries and growth charts sent as PDF attachments

---

## 14. Security, Audit & Compliance

### Authentication
- **Better Auth**: industry-standard auth framework
- **Email/password login**: traditional credentials
- **Magic link**: passwordless email login
- **OTP verification**: one-time password support
- **Email verification**: mandatory email confirmation
- **Password reset**: secure reset flow
- **Session management**: Convex-backed auth tokens

### Authorization
- **Role-based access control**: doctor, patient, admin roles
- **Data ownership verification**: doctors can only access their own patients
- **Portal access control**: parents only see linked children
- **Subscription-based feature gating**: features restricted by tier
- **API authentication**: all routes require valid auth tokens

### Audit & Compliance
- **Audit logging**: all patient data mutations recorded (create, update, delete)
- **Clinical decision log**: WhatsApp AI proposals vs. final decisions tracked
- **No PHI in logs**: sensitive data excluded from audit entries
- **Webhook signature verification**: Stripe and WhatsApp webhooks validated

### Infrastructure Security
- **Rate limiting**: Upstash Redis for API routes, in-memory for WhatsApp
- **Security headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **HTTPS only**: enforced via security headers
- **Input validation**: Zod and Yup schema validation on all inputs

---

## 15. Subscription Tiers & Feature Gating

### Doctor Tiers

| Feature | Starter | Pro | Premium |
|---------|---------|-----|---------|
| **EMR (patients, appointments, vitals)** | 100 patients | 500 patients | Unlimited |
| **Records** | 200 | 1,000 | Unlimited |
| **Growth Charts** | Basic | All types | All types |
| **Vaccination Management** | - | Yes | Yes |
| **AI ScrybeGPT Messages** | 50/month | 300/month | Unlimited |
| **AI Clinical Features** | 20/month | 100/month | Unlimited |
| **AI Reports** | - | 50/month | Unlimited |
| **Patient Portal** | - | Yes | Yes |
| **WhatsApp ScrybeGPT** | - | Yes | Yes |
| **Telehealth** | - | - | Yes |
| **Receipts & Billing** | Basic | Full | Full |
| **Staff Accounts** | - | - | Coming Soon |
| **Priority Support** | - | - | Yes |

### Patient (Parent) Tier
| Feature | Free | Scrybe Assist ($4.99/mo) |
|---------|------|--------------------------|
| **View medical records** | Yes | Yes |
| **Notifications** | Yes | Yes |
| **Document upload** | Yes | Yes |
| **Telehealth** | Yes | Yes |
| **AI Explanations** | 5/month | Unlimited |

---

## 16. Technical Architecture

### Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16+ (Turbopack), React 19, TypeScript |
| **Backend** | Convex (real-time database + serverless functions) |
| **Auth** | Better Auth (Convex adapter) |
| **UI** | shadcn/ui, Tailwind CSS, Radix UI primitives |
| **Animations** | motion/react (Framer Motion) |
| **Charts** | Recharts |
| **AI** | OpenAI API, Vercel AI SDK |
| **Video** | LiveKit (WebRTC) |
| **Payments** | Stripe |
| **Email** | Resend + React Email |
| **File Upload** | UploadThing |
| **Offline** | Dexie (IndexedDB), Serwist (Service Workers) |
| **PDF** | jsPDF, react-to-print |
| **Rate Limiting** | Upstash Redis |
| **Analytics** | PostHog, Vercel Analytics |
| **Rich Text** | Lexical editor |
| **Hosting** | Vercel (frontend), Convex Cloud (backend) |

### Database (32 Tables)
- **Core**: doctors, patients, appointments, services, files, reports, receipts, doctorImages
- **Vaccines**: vaccins, doses, vaccinationRecords, vaccinReferences, vaccinReferenceDoses
- **Growth**: charts (WHO reference data)
- **Subscriptions**: products, prices, subscriptions, subscriptionTiers, usage
- **Portal**: patientInvitations, patientAccounts, patientFiles, portalNotifications
- **Patient Subscriptions**: patientSubscriptions, patientUsage, aiExplanations
- **Telehealth**: telehealthAvailability, telehealthExceptions, telehealthAppointments
- **WhatsApp**: whatsappLinks, whatsappMessages, whatsappPendingActions, doctorPreferences, clinicalDecisionLog
- **System**: documents (vector search), appUsers, auditLogs

### Key Integrations
- **Stripe**: subscription management, checkout, webhooks, billing portal
- **OpenAI**: GPT models for clinical AI features and ScrybeGPT
- **LiveKit**: real-time video/audio for telehealth
- **Resend**: transactional email delivery
- **UploadThing**: secure file upload and storage
- **Upstash Redis**: distributed rate limiting
- **PostHog**: product analytics and event tracking
- **Kapso/Meta**: WhatsApp Business API messaging
