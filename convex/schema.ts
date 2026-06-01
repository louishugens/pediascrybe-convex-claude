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
  timezone: v.optional(v.string()), // IANA timezone e.g. "America/Port-au-Prince", "Africa/Lagos"
  isActive: v.boolean(),
  isCompleted: v.boolean(),
  isDoctor: v.boolean(),
  isMedPro: v.boolean(),
  availability: v.optional(v.array(v.object({
    day: v.number(),
    startTime: v.string(),
    endTime: v.string(),
  }))),
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
  birthWeight: v.optional(v.number()), // grams
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

// ==================== Prescriptions & Lab Orders ====================

// Prescriptions — one row per prescribed drug
const prescriptions = defineTable({
  doctorId: v.id("doctors"),
  patientId: v.id("patients"),
  // Originating visit. Optional so renewals/telephone scripts can exist without one.
  appointmentId: v.optional(v.id("appointments")),
  // Drug + posology. Field names preserved from the previous embedded shape:
  // count + unit = dispense quantity (e.g. 30 + "tablets"); posology = instructions.
  drug: v.string(),
  count: v.number(),
  unit: v.string(),
  posology: v.string(),
  // Optional clinical detail — added now so code paths are status- and lifecycle-aware from day one.
  dose: v.optional(v.string()), // e.g. "500mg" — drug strength, distinct from dispense quantity
  route: v.optional(v.string()), // "PO" | "IV" | "topical" | etc.
  startDate: v.optional(v.number()),
  endDate: v.optional(v.number()),
  refillsRemaining: v.optional(v.number()),
  status: v.union(
    v.literal("active"),
    v.literal("completed"),
    v.literal("discontinued"),
    v.literal("cancelled"),
  ),
  discontinuedReason: v.optional(v.string()),
  // For renewals: link to the prescription this one was cloned from.
  renewedFromId: v.optional(v.id("prescriptions")),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_appointmentId", ["appointmentId"])
  .index("by_patientId", ["patientId"])
  .index("by_patientId_status", ["patientId", "status"])
  .index("by_doctorId_createdAt", ["doctorId", "createdAt"])
  .index("by_doctorId_status", ["doctorId", "status"]);

// Lab orders — one row per ordered exam
const labOrders = defineTable({
  doctorId: v.id("doctors"),
  patientId: v.id("patients"),
  appointmentId: v.optional(v.id("appointments")),
  // examName preserves the previous "exam" string. Add examCode later for LOINC mapping.
  examName: v.string(),
  clinicalContext: v.optional(v.string()), // why it was ordered — useful for the lab and for AI
  urgency: v.optional(v.union(
    v.literal("routine"),
    v.literal("urgent"),
    v.literal("stat"),
  )),
  status: v.union(
    v.literal("ordered"),
    v.literal("collected"),
    v.literal("resulted"),
    v.literal("reviewed"),
    v.literal("cancelled"),
  ),
  orderedAt: v.optional(v.number()),
  collectedAt: v.optional(v.number()),
  resultedAt: v.optional(v.number()),
  reviewedAt: v.optional(v.number()),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_appointmentId", ["appointmentId"])
  .index("by_patientId", ["patientId"])
  .index("by_patientId_status", ["patientId", "status"])
  .index("by_doctorId_status", ["doctorId", "status"])
  .index("by_doctorId_orderedAt", ["doctorId", "orderedAt"]);

// Lab results — one row per result tied to a labOrder
const labResults = defineTable({
  labOrderId: v.id("labOrders"),
  patientId: v.id("patients"), // denormalized for fast patient-level queries
  value: v.string(), // string supports numeric, qualitative, ranges
  unit: v.optional(v.string()),
  referenceRange: v.optional(v.string()),
  abnormalFlag: v.optional(v.union(
    v.literal("normal"),
    v.literal("low"),
    v.literal("high"),
    v.literal("critical"),
  )),
  fileId: v.optional(v.id("files")), // scanned PDF/image of result
  enteredBy: v.union(
    v.literal("doctor"),
    v.literal("lab_import"),
    v.literal("portal_upload"),
  ),
  enteredAt: v.number(),
  notes: v.optional(v.string()),
})
  .index("by_labOrderId", ["labOrderId"])
  .index("by_patientId", ["patientId"]);

// Files table - attachments to appointments
const files = defineTable({
  appointmentId: v.id("appointments"),
  url: v.string(),
  name: v.string(),
  fileType: v.union(v.literal("IMAGE"), v.literal("PDF"), v.literal("VIDEO")),
  sizeBytes: v.optional(v.number()),
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
  services: v.optional(v.array(v.object({
    service: v.string(),
    name: v.optional(v.string()),
    quantity: v.optional(v.number()),
    price: v.optional(v.number()),
  }))),
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
  p03: v.array(v.number()),
  p15: v.array(v.number()),
  p50: v.array(v.number()),
  p85: v.array(v.number()),
  p97: v.array(v.number()),
  height: v.optional(v.array(v.number())),
})
  .index("by_chartId", ["chartId"]);

// ==================== AI Documents (Vector Search) ====================

const documents = defineTable({
  content: v.string(),
  metadata: v.optional(v.record(v.string(), v.string())),
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
  metadata: v.optional(v.record(v.string(), v.string())),
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
  metadata: v.optional(v.record(v.string(), v.string())),
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
  billingInterval: v.optional(v.union(v.literal("month"), v.literal("year"))),
  metadata: v.optional(v.record(v.string(), v.string())),
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
    v.literal("telehealth_reminder"),
    // Prescription/lab lifecycle events not covered by new_prescription / new_lab_exam
    v.literal("prescription_discontinued"),
    v.literal("lab_result_available")
  ),
  prescriptionId: v.optional(v.id("prescriptions")),
  labOrderId: v.optional(v.id("labOrders")),
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
  // Unified AI credit pool (monthly)
  aiCreditsUsed: v.optional(v.number()),
  // Purchased pack credits — consumed after included pool, reset monthly
  packCreditsRemaining: v.optional(v.number()),
  // WhatsApp trial counter for Essentials (10/month, separate from AI pool)
  whatsappTrialUsed: v.optional(v.number()),
  // WhatsApp sub-cap counter for Pro/Complete (300/900, independent of AI pool)
  whatsappMessagesUsed: v.optional(v.number()),
  // Telehealth minutes counter (for overage billing)
  telehealthMinutesUsed: v.optional(v.number()),
  // File storage running total in bytes
  storageUsedBytes: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_doctorId", ["doctorId"])
  .index("by_doctorId_period", ["doctorId", "period"]);

// ==================== Subscription Tiers ====================

const subscriptionTiers = defineTable({
  name: v.string(), // "essentials" | "professional" | "complete" | "institution"
  displayName: v.string(),
  description: v.string(),
  // Stripe price IDs — one row per tier, both intervals on the same row
  stripeMonthlyPriceId: v.string(),
  stripeAnnualPriceId: v.optional(v.string()), // Institution has none
  priceAmountCents: v.number(), // Monthly price in cents (2900/5900/11900)
  annualPriceAmountCents: v.optional(v.number()), // Annual total in cents (28800/58800/118800)
  isCustom: v.optional(v.boolean()), // true for Institution (no checkout)
  limits: v.object({
    // Hard caps — NO -1, NO Infinity, every resource has a concrete number
    patientCount: v.number(),           // lifetime cap
    recordCount: v.number(),            // monthly cap
    aiCredits: v.number(),              // monthly unified pool
    whatsappTrial: v.number(),          // monthly trial cap (essentials only, else 0)
    whatsappMessages: v.number(),       // monthly WhatsApp sub-cap (0 for essentials)
    fileStorageMB: v.number(),          // storage cap
    services: v.number(),               // service catalog entries
    staffSeats: v.number(),             // 0/0/3
    auditRetentionDays: v.number(),     // 30/90/365
    telehealthMinutes: v.number(),      // included minutes (0 if feature disabled)
    telehealthOverageRate: v.number(),  // dollars per minute past included
    patientPortal: v.boolean(),
    telehealth: v.boolean(),
    dashboardTier: v.union(v.literal("basic"), v.literal("standard"), v.literal("full")),
    growthCharts: v.union(v.literal("all")),
  }),
  features: v.array(v.string()),
  trialPeriodDays: v.number(),
  sortOrder: v.number(),
  isPopular: v.boolean(),
  createdAt: v.number(),
})
  .index("by_name", ["name"])
  .index("by_sortOrder", ["sortOrder"])
  .index("by_stripeMonthlyPriceId", ["stripeMonthlyPriceId"])
  .index("by_stripeAnnualPriceId", ["stripeAnnualPriceId"]);

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

// ==================== WhatsApp ScrybeGPT ====================

// Maps WhatsApp numbers to doctor accounts
const whatsappLinks = defineTable({
  doctorId: v.id("doctors"),
  phoneNumber: v.optional(v.string()), // E.164 format, set after QR scan
  whatsappId: v.optional(v.string()), // WhatsApp user ID from webhook
  status: v.union(v.literal("pending"), v.literal("active"), v.literal("revoked")),
  linkToken: v.string(), // Unique token embedded in QR code
  linkTokenExpiresAt: v.number(), // Token expiry (10 min)
  linkedAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_phoneNumber", ["phoneNumber"])
  .index("by_whatsappId", ["whatsappId"])
  .index("by_doctorId", ["doctorId"])
  .index("by_linkToken", ["linkToken"]);

// Conversation history
const whatsappMessages = defineTable({
  doctorId: v.id("doctors"),
  whatsappMessageId: v.string(), // Meta's msg ID (dedup)
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
  toolCalls: v.optional(v.string()), // JSON array of tool calls made
  patientId: v.optional(v.id("patients")),
  createdAt: v.number(),
})
  .index("by_doctorId", ["doctorId"])
  .index("by_doctorId_createdAt", ["doctorId", "createdAt"])
  .index("by_whatsappMessageId", ["whatsappMessageId"]);

// Clinical proposals + write operations awaiting doctor review
const whatsappPendingActions = defineTable({
  doctorId: v.id("doctors"),
  action: v.string(), // "diagnostic" | "medication" | "labExam" | "createPatient" | etc.
  patientId: v.optional(v.id("patients")),
  appointmentId: v.optional(v.id("appointments")),
  proposedData: v.string(), // JSON
  preview: v.string(), // Human-readable summary
  status: v.union(
    v.literal("pending"),
    v.literal("confirmed"),
    v.literal("edited"),
    v.literal("cancelled"),
    v.literal("expired")
  ),
  editHistory: v.optional(v.string()), // JSON array of edit instructions
  resultEntityId: v.optional(v.string()), // ID of created/updated record
  linkedActionId: v.optional(v.id("whatsappPendingActions")), // Chain: diagnostic -> medication -> labs
  expiresAt: v.number(), // Auto-expire after 10 min
  createdAt: v.number(),
})
  .index("by_doctorId_status", ["doctorId", "status"])
  .index("by_doctorId_createdAt", ["doctorId", "createdAt"]);

// Doctor preference learning from clinical edits
const doctorPreferences = defineTable({
  doctorId: v.id("doctors"),
  category: v.string(), // "dosing" | "drug_choice" | "lab_preference" | "general"
  condition: v.optional(v.string()), // "otitis_media" | "anemia" | null
  rule: v.string(), // Compact rule text
  confidence: v.number(), // 0-1
  sourceCount: v.number(), // How many interactions confirmed this
  lastUsedAt: v.number(),
  createdAt: v.number(),
})
  .index("by_doctorId", ["doctorId"])
  .index("by_doctorId_condition", ["doctorId", "condition"])
  .index("by_doctorId_confidence", ["doctorId", "confidence"]);

// Clinical decision audit log + embeddings for RAG
const clinicalDecisionLog = defineTable({
  doctorId: v.id("doctors"),
  patientId: v.id("patients"),
  appointmentId: v.optional(v.id("appointments")),
  decisionType: v.string(), // "diagnostic" | "medication" | "labExam"
  proposed: v.string(), // JSON
  final: v.string(), // JSON
  edits: v.optional(v.string()), // JSON
  outcome: v.string(), // "approved" | "edited" | "rejected"
  embedding: v.optional(v.array(v.float64())),
  conditionTags: v.array(v.string()),
  createdAt: v.number(),
})
  .index("by_doctorId", ["doctorId"])
  .index("by_doctorId_decisionType", ["doctorId", "decisionType"])
  .vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
    filterFields: ["doctorId"],
  });

// ==================== Audit Logging ====================

const auditLogs = defineTable({
  actorAuthUserId: v.string(), // Who performed the action
  actorRole: v.union(v.literal("patient"), v.literal("doctor"), v.literal("admin"), v.literal("system")),
  action: v.union(
    // Patient data mutations
    v.literal("patient.create"),
    v.literal("patient.update"),
    v.literal("patient.delete"),
    // Appointment mutations
    v.literal("appointment.create"),
    v.literal("appointment.update"),
    v.literal("appointment.delete"),
    // Prescription mutations
    v.literal("prescription.create"),
    v.literal("prescription.update"),
    v.literal("prescription.discontinue"),
    v.literal("prescription.renew"),
    v.literal("prescription.delete"),
    // Lab order mutations
    v.literal("labOrder.create"),
    v.literal("labOrder.update"),
    v.literal("labOrder.cancel"),
    v.literal("labOrder.delete"),
    // Lab result mutations
    v.literal("labResult.create"),
    v.literal("labResult.update"),
    v.literal("labResult.delete"),
    // Medical data mutations
    v.literal("vaccine.create"),
    v.literal("vaccine.update"),
    v.literal("report.create"),
    v.literal("report.update"),
    v.literal("report.delete"),
    v.literal("receipt.create"),
    v.literal("receipt.update"),
    v.literal("receipt.delete"),
    v.literal("file.create"),
    v.literal("file.delete"),
    // Portal actions
    v.literal("invitation.create"),
    v.literal("invitation.accept"),
    v.literal("portal.file_upload"),
    // Telehealth actions
    v.literal("telehealth.book"),
    v.literal("telehealth.confirm"),
    v.literal("telehealth.cancel"),
    v.literal("telehealth.join"),
    // Auth/admin actions
    v.literal("subscription.change"),
    v.literal("doctor.update")
  ),
  entityType: v.string(), // e.g., "patients", "appointments"
  entityId: v.string(), // ID of the affected record
  details: v.optional(v.string()), // JSON summary of what changed (no PHI)
  timestamp: v.number(),
})
  .index("by_actorAuthUserId", ["actorAuthUserId"])
  .index("by_entityType_entityId", ["entityType", "entityId"])
  .index("by_action", ["action"])
  .index("by_timestamp", ["timestamp"]);

// ==================== Export Schema ====================

export default defineSchema({
  // App users (auth link)
  appUsers,
  // Domain tables
  doctors,
  patients,
  services,
  appointments,
  prescriptions,
  labOrders,
  labResults,
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
  // WhatsApp ScrybeGPT
  whatsappLinks,
  whatsappMessages,
  whatsappPendingActions,
  doctorPreferences,
  clinicalDecisionLog,
  // Audit
  auditLogs,
});

