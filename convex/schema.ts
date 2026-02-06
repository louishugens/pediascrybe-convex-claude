import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ==================== Domain Tables ====================

// Doctors table - links to Better Auth user via authUserId
const doctors = defineTable({
  authUserId: v.string(), // Links to Better Auth user._id
  email: v.string(),
  firstname: v.string(),
  lastname: v.string(),
  phone: v.optional(v.string()),
  address: v.optional(v.string()),
  spec: v.optional(v.string()),
  title: v.optional(v.string()),
  summary: v.optional(v.string()),
  experience: v.optional(v.number()),
  cost: v.optional(v.number()),
  duration: v.optional(v.number()),
  isActive: v.boolean(),
  isCompleted: v.boolean(),
  isDoctor: v.boolean(),
  isMedPro: v.boolean(),
  availability: v.optional(v.any()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_authUserId", ["authUserId"])
  .index("by_email", ["email"]);

// Patients table
const patients = defineTable({
  doctorId: v.id("doctors"),
  firstname: v.string(),
  lastname: v.string(),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  birthdate: v.number(), // Unix timestamp
  sex: v.optional(v.union(v.literal("male"), v.literal("female"))),
  mothername: v.optional(v.string()),
  profession: v.optional(v.string()),
  religion: v.optional(v.string()),
  children: v.optional(v.number()),
  allergies: v.optional(v.string()),
  history: v.optional(v.string()),
  bloodtype: v.optional(v.string()),
  electrophoresis: v.optional(v.string()),
  portalEnabled: v.optional(v.boolean()),
  isCompleted: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_doctorId", ["doctorId"])
  .index("by_doctorId_name", ["doctorId", "firstname", "lastname"])
  .searchIndex("search_patients", {
    searchField: "firstname",
    filterFields: ["doctorId"],
  });

// Services table
const services = defineTable({
  doctorId: v.id("doctors"),
  name: v.string(),
  price: v.number(),
  currency: v.string(),
  type: v.union(v.literal("clinical"), v.literal("documentation")),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_doctorId", ["doctorId"]);

// Appointments table
const appointments = defineTable({
  doctorId: v.id("doctors"),
  patientId: v.id("patients"),
  serviceId: v.optional(v.id("services")),
  startDate: v.number(), // Unix timestamp
  endDate: v.optional(v.number()),
  status: v.optional(v.union(v.literal("pending"), v.literal("paid"), v.literal("offline"))),
  cost: v.optional(v.number()),
  motif: v.optional(v.string()),
  findings: v.optional(v.string()),
  recommendation: v.optional(v.string()),
  otherRemarks: v.optional(v.string()),
  // Vitals
  height: v.optional(v.number()),
  weight: v.optional(v.number()),
  head: v.optional(v.number()),
  arm: v.optional(v.number()),
  thorax: v.optional(v.number()),
  sao2: v.optional(v.number()),
  temperature: v.optional(v.number()),
  pulse: v.optional(v.number()),
  respiratory: v.optional(v.number()),
  systolic: v.optional(v.number()),
  diastolic: v.optional(v.number()),
  // Medical data
  exams: v.optional(v.any()),
  medication: v.optional(v.any()),
  // Internal notes (private — never exposed to portal)
  internalNotes: v.optional(v.string()),
  // Transaction
  transactionId: v.optional(v.string()),
  transactionDate: v.optional(v.number()),
})
  .index("by_doctorId", ["doctorId"])
  .index("by_patientId", ["patientId"])
  .index("by_doctorId_startDate", ["doctorId", "startDate"])
  .index("by_patientId_startDate", ["patientId", "startDate"]);

// Files table - attachments to appointments
const files = defineTable({
  appointmentId: v.id("appointments"),
  url: v.string(),
  name: v.string(),
  fileType: v.union(v.literal("IMAGE"), v.literal("PDF"), v.literal("VIDEO")),
})
  .index("by_appointmentId", ["appointmentId"]);

// Reports table
const reports = defineTable({
  patientId: v.id("patients"),
  reportType: v.union(v.literal("Report"), v.literal("Certificate"), v.literal("ReferenceNote")),
  content: v.string(),
  createdAt: v.number(),
})
  .index("by_patientId", ["patientId"]);

// Receipts table
const receipts = defineTable({
  patientId: v.id("patients"),
  services: v.optional(v.any()), // JSON array of service items
  cost: v.optional(v.number()),
  currency: v.optional(v.string()),
  date: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_patientId", ["patientId"]);

// Doctor images
const doctorImages = defineTable({
  doctorId: v.id("doctors"),
  url: v.string(),
  publicId: v.string(),
})
  .index("by_doctorId", ["doctorId"]);

// ==================== Vaccines ====================

// Vaccines tracked by doctor
const vaccins = defineTable({
  doctorId: v.id("doctors"),
  name: v.string(),
})
  .index("by_doctorId", ["doctorId"]);

// Dose definitions for vaccines
const doses = defineTable({
  vaccinId: v.id("vaccins"),
  doseType: v.union(v.literal("regular"), v.literal("annual"), v.literal("booster"), v.literal("unique")),
  doseCount: v.optional(v.number()),
  maxAge: v.optional(v.number()),
})
  .index("by_vaccinId", ["vaccinId"]);

// Vaccination records for patients
const vaccinationRecords = defineTable({
  patientId: v.id("patients"),
  vaccinId: v.id("vaccins"),
  doseId: v.id("doses"),
  date: v.number(),
  notes: v.optional(v.string()),
  manufacturer: v.string(),
  lotNumber: v.string(),
  expiration: v.number(),
  dosage: v.string(),
  route: v.string(),
  site: v.string(),
})
  .index("by_patientId", ["patientId"])
  .index("by_vaccinId", ["vaccinId"]);

// Reference vaccines (global templates)
const vaccinReferences = defineTable({
  name: v.string(),
});

// Reference dose definitions
const vaccinReferenceDoses = defineTable({
  vaccinReferenceId: v.id("vaccinReferences"),
  doseType: v.union(v.literal("regular"), v.literal("annual"), v.literal("booster"), v.literal("unique")),
  doseCount: v.optional(v.number()),
  maxAge: v.optional(v.number()),
})
  .index("by_vaccinReferenceId", ["vaccinReferenceId"]);

// ==================== Charts (Growth Charts) ====================

const charts = defineTable({
  chartId: v.string(), // e.g., "wfa_boys_0_5", "hfa_girls_0_5"
  p03: v.any(),
  p15: v.any(),
  p50: v.any(),
  p85: v.any(),
  p97: v.any(),
  height: v.optional(v.any()),
})
  .index("by_chartId", ["chartId"]);

// ==================== AI Documents (Vector Search) ====================

const documents = defineTable({
  content: v.string(),
  metadata: v.optional(v.any()),
  embedding: v.array(v.float64()),
})
  .vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536, // OpenAI embeddings
    filterFields: [],
  });

// ==================== Stripe (Deferred - keeping structure) ====================

const products = defineTable({
  stripeId: v.string(),
  active: v.optional(v.boolean()),
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  image: v.optional(v.string()),
  metadata: v.optional(v.any()),
})
  .index("by_stripeId", ["stripeId"]);

const prices = defineTable({
  stripeId: v.string(),
  productId: v.id("products"),
  active: v.optional(v.boolean()),
  description: v.optional(v.string()),
  unitAmount: v.optional(v.number()),
  currency: v.optional(v.string()),
  pricingType: v.optional(v.union(v.literal("one_time"), v.literal("recurring"))),
  interval: v.optional(v.union(v.literal("day"), v.literal("week"), v.literal("month"), v.literal("year"))),
  intervalCount: v.optional(v.number()),
  trialPeriodDays: v.optional(v.number()),
  metadata: v.optional(v.any()),
})
  .index("by_stripeId", ["stripeId"])
  .index("by_productId", ["productId"]);

const subscriptions = defineTable({
  stripeId: v.string(),
  doctorId: v.id("doctors"),
  priceId: v.optional(v.id("prices")), // Optional - may not exist in our local DB
  stripePriceId: v.optional(v.string()), // Store the Stripe price ID directly
  tierName: v.optional(v.string()), // Store tier name directly for easy lookup
  status: v.union(
    v.literal("trialing"),
    v.literal("active"),
    v.literal("canceled"),
    v.literal("incomplete"),
    v.literal("incomplete_expired"),
    v.literal("past_due"),
    v.literal("unpaid"),
    v.literal("paused")
  ),
  quantity: v.optional(v.number()),
  cancelAtPeriodEnd: v.optional(v.boolean()),
  metadata: v.optional(v.any()),
  created: v.number(),
  currentPeriodStart: v.number(),
  currentPeriodEnd: v.number(),
  endedAt: v.optional(v.number()),
  cancelAt: v.optional(v.number()),
  canceledAt: v.optional(v.number()),
  trialStart: v.optional(v.number()),
  trialEnd: v.optional(v.number()),
})
  .index("by_stripeId", ["stripeId"])
  .index("by_doctorId", ["doctorId"])
  .index("by_tierName", ["tierName"]);

// ==================== Patient Portal ====================

// Patient invitations - doctor invites parent to portal
const patientInvitations = defineTable({
  doctorId: v.id("doctors"),
  patientId: v.id("patients"),
  email: v.string(),
  token: v.string(),
  status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired"), v.literal("revoked")),
  expiresAt: v.number(),
  acceptedAt: v.optional(v.number()),
  acceptedByAuthUserId: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_token", ["token"])
  .index("by_email", ["email"])
  .index("by_doctorId", ["doctorId"])
  .index("by_patientId", ["patientId"]);

// Patient accounts - links auth users to patient records (one parent can have multiple children)
const patientAccounts = defineTable({
  authUserId: v.string(),
  patientId: v.id("patients"),
  relationship: v.union(v.literal("parent"), v.literal("guardian")),
  isPrimary: v.boolean(),
  createdAt: v.number(),
})
  .index("by_authUserId", ["authUserId"])
  .index("by_patientId", ["patientId"])
  .index("by_authUserId_patientId", ["authUserId", "patientId"]);

// Patient files - parent-uploaded files (separate from doctor's appointment files)
const patientFiles = defineTable({
  patientId: v.id("patients"),
  uploadedByAuthUserId: v.string(),
  url: v.string(),
  name: v.string(),
  fileType: v.union(v.literal("IMAGE"), v.literal("PDF")),
  description: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_patientId", ["patientId"]);

// Portal notifications - tracks notifications sent to parents
const portalNotifications = defineTable({
  patientId: v.id("patients"),
  type: v.union(
    v.literal("new_prescription"),
    v.literal("new_lab_exam"),
    v.literal("appointment_summary"),
    v.literal("new_vaccine_record"),
    v.literal("new_report"),
    v.literal("telehealth_confirmed"),
    v.literal("telehealth_rescheduled"),
    v.literal("telehealth_cancelled"),
    v.literal("telehealth_reminder")
  ),
  appointmentId: v.optional(v.id("appointments")),
  telehealthAppointmentId: v.optional(v.id("telehealthAppointments")),
  message: v.string(),
  isRead: v.boolean(),
  createdAt: v.number(),
})
  .index("by_patientId", ["patientId"]);

// ==================== App Users (Auth link) ====================

const appUsers = defineTable({
  authUserId: v.string(),
  email: v.string(),
  displayName: v.optional(v.string()),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  role: v.union(v.literal("patient"), v.literal("doctor"), v.literal("admin")),
  plan: v.string(),
  stripeCustomerId: v.optional(v.string()),
})
  .index("by_authUserId", ["authUserId"])
  .index("by_email", ["email"])
  .index("by_stripeCustomerId", ["stripeCustomerId"]);

// ==================== Usage Tracking ====================

const usage = defineTable({
  doctorId: v.id("doctors"),
  period: v.string(), // "2026-01" format (YYYY-MM)
  // All usage counters for the period
  scrybegptMessages: v.optional(v.number()),
  aiPrescription: v.optional(v.number()),
  aiLabExam: v.optional(v.number()),
  aiDiagnostic: v.optional(v.number()),
  aiReport: v.optional(v.number()),
  // Legacy fields (kept for backward compatibility)
  aiQueries: v.optional(v.number()),
  documentGeneration: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_doctorId", ["doctorId"])
  .index("by_doctorId_period", ["doctorId", "period"]);

// ==================== Subscription Tiers ====================

const subscriptionTiers = defineTable({
  name: v.string(), // "starter", "pro", "premium"
  displayName: v.string(),
  description: v.string(),
  stripePriceId: v.string(), // Single USD price ID
  priceAmountCents: v.number(), // Price in cents (e.g., 2900 for $29)
  limits: v.object({
    patientCount: v.number(),        // 100, 500, -1 (unlimited)
    recordCount: v.number(),         // 200, 1000, -1 (unlimited)
    scrybegptMessages: v.number(),   // 50, 300, -1 (unlimited)
    aiPrescription: v.number(),      // 20, 100, -1 (unlimited)
    aiLabExam: v.number(),           // 20, 100, -1 (unlimited)
    aiDiagnostic: v.number(),        // 20, 100, -1 (unlimited)
    aiReport: v.number(),            // 0, 50, -1 (unlimited)
  }),
  features: v.array(v.string()),
  trialPeriodDays: v.number(),
  sortOrder: v.number(),
  isPopular: v.boolean(),
  createdAt: v.number(),
})
  .index("by_name", ["name"])
  .index("by_sortOrder", ["sortOrder"])
  .index("by_stripePriceId", ["stripePriceId"]);

// ==================== Patient Portal AI (Scrybe Assist) ====================

// Patient subscriptions for Scrybe Assist ($4.99/mo premium)
const patientSubscriptions = defineTable({
  authUserId: v.string(),
  stripeCustomerId: v.optional(v.string()),
  stripeSubscriptionId: v.optional(v.string()),
  stripePriceId: v.optional(v.string()),
  plan: v.union(v.literal("free"), v.literal("premium")),
  status: v.union(
    v.literal("active"),
    v.literal("trialing"),
    v.literal("canceled"),
    v.literal("incomplete")
  ),
  currentPeriodStart: v.optional(v.number()),
  currentPeriodEnd: v.optional(v.number()),
  trialEnd: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_authUserId", ["authUserId"])
  .index("by_stripeCustomerId", ["stripeCustomerId"])
  .index("by_stripeSubscriptionId", ["stripeSubscriptionId"]);

// Patient AI usage tracking (free tier: 5/month)
const patientUsage = defineTable({
  authUserId: v.string(),
  period: v.string(), // "2026-02"
  aiExplanations: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_authUserId", ["authUserId"])
  .index("by_authUserId_period", ["authUserId", "period"]);

// AI explanation cache (avoids repeated API calls)
const aiExplanations = defineTable({
  type: v.union(
    v.literal("medication"),
    v.literal("diagnostic"),
    v.literal("lab_exam"),
    v.literal("growth"),
    v.literal("vaccination")
  ),
  contextHash: v.string(),
  patientId: v.id("patients"),
  appointmentId: v.optional(v.id("appointments")),
  explanation: v.string(),
  createdAt: v.number(),
})
  .index("by_contextHash", ["contextHash"])
  .index("by_patientId_type", ["patientId", "type"]);

// ==================== Telehealth ====================

// Doctor's weekly recurring schedule
const telehealthAvailability = defineTable({
  doctorId: v.id("doctors"),
  dayOfWeek: v.number(), // 0=Sun ... 6=Sat
  startTime: v.string(), // "09:00" (24h)
  endTime: v.string(), // "17:00"
  slotDurationMinutes: v.number(), // 30
  isActive: v.boolean(),
  createdAt: v.number(),
})
  .index("by_doctorId", ["doctorId"])
  .index("by_doctorId_dayOfWeek", ["doctorId", "dayOfWeek"]);

// Block specific dates (holidays, etc.)
const telehealthExceptions = defineTable({
  doctorId: v.id("doctors"),
  date: v.string(), // "2026-03-15" (ISO date)
  reason: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_doctorId", ["doctorId"]);

// Scheduled video consultations
const telehealthAppointments = defineTable({
  doctorId: v.id("doctors"),
  patientId: v.id("patients"),
  bookedByAuthUserId: v.string(), // parent who booked

  // Scheduling
  date: v.string(), // "2026-03-15" (ISO date)
  startTime: v.string(), // "14:00"
  endTime: v.string(), // "14:30"
  timezone: v.string(), // IANA tz of doctor

  // Status
  status: v.union(
    v.literal("requested"),
    v.literal("confirmed"),
    v.literal("rescheduled"),
    v.literal("completed"),
    v.literal("cancelled"),
    v.literal("no_show")
  ),
  motif: v.optional(v.string()),
  cancelledBy: v.optional(v.union(v.literal("doctor"), v.literal("patient"))),
  cancellationReason: v.optional(v.string()),

  // Reschedule proposal (set when status=rescheduled)
  proposedDate: v.optional(v.string()),
  proposedStartTime: v.optional(v.string()),
  proposedEndTime: v.optional(v.string()),

  // Payment (off-platform, doctor marks)
  paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("waived")),
  paymentMarkedAt: v.optional(v.number()),

  // LiveKit session
  roomName: v.optional(v.string()),
  sessionStartedAt: v.optional(v.number()),
  sessionEndedAt: v.optional(v.number()),
  doctorJoinedAt: v.optional(v.number()),
  patientJoinedAt: v.optional(v.number()),

  // Doctor post-call notes
  appointmentId: v.optional(v.id("appointments")),
  notes: v.optional(v.string()),

  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_doctorId", ["doctorId"])
  .index("by_patientId", ["patientId"])
  .index("by_doctorId_date", ["doctorId", "date"])
  .index("by_doctorId_status", ["doctorId", "status"])
  .index("by_roomName", ["roomName"]);

// ==================== Export Schema ====================

export default defineSchema({
  // App users (auth link)
  appUsers,
  // Domain tables
  doctors,
  patients,
  services,
  appointments,
  files,
  reports,
  receipts,
  doctorImages,
  // Vaccines
  vaccins,
  doses,
  vaccinationRecords,
  vaccinReferences,
  vaccinReferenceDoses,
  // Charts
  charts,
  // AI
  documents,
  // Stripe
  products,
  prices,
  subscriptions,
  // Usage & Subscription Tiers
  usage,
  subscriptionTiers,
  // Patient Portal
  patientInvitations,
  patientAccounts,
  patientFiles,
  portalNotifications,
  // Patient Portal AI (Scrybe Assist)
  patientSubscriptions,
  patientUsage,
  aiExplanations,
  // Telehealth
  telehealthAvailability,
  telehealthExceptions,
  telehealthAppointments,
});

