import type { Id } from "@/convex/_generated/dataModel";

// Base type for all cached documents
export interface CachedDocument {
  _cachedAt: number;
}

// Sync queue entry
export interface SyncQueueEntry {
  id?: number; // auto-incremented
  apiRoute: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  payload: Record<string, unknown>;
  authToken?: string; // Auth token captured at enqueue time
  status: "pending" | "processing" | "failed" | "conflict";
  retryCount: number;
  maxRetries: number;
  serverError?: string;
  // For conflict resolution
  entityType?: string;
  entityId?: string;
  localSnapshot?: Record<string, unknown>;
  serverSnapshot?: Record<string, unknown>;
  createdAt: number;
  lastAttemptAt?: number;
}

// Query cache metadata
export interface QueryCacheEntry {
  queryKey: string;
  doctorId: string;
  lastUpdated: number;
}

// Cached versions of Convex documents (matching schema.ts shapes)
export interface CachedDoctor extends CachedDocument {
  _id: string;
  authUserId: string;
  email: string;
  firstname: string;
  lastname: string;
  phone?: string;
  address?: string;
  spec?: string;
  title?: string;
  summary?: string;
  experience?: number;
  cost?: number;
  duration?: number;
  isActive: boolean;
  isCompleted: boolean;
  isDoctor: boolean;
  isMedPro: boolean;
  availability?: unknown;
  createdAt: number;
  updatedAt: number;
}

export interface CachedPatient extends CachedDocument {
  _id: string;
  doctorId: string;
  firstname: string;
  lastname: string;
  email?: string;
  phone?: string;
  birthdate: number;
  birthWeight?: number;
  sex?: "male" | "female";
  mothername?: string;
  profession?: string;
  religion?: string;
  children?: number;
  allergies?: string;
  history?: string;
  bloodtype?: string;
  electrophoresis?: string;
  portalEnabled?: boolean;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CachedAppointment extends CachedDocument {
  _id: string;
  doctorId: string;
  patientId: string;
  serviceId?: string;
  startDate: number;
  endDate?: number;
  status?: "pending" | "paid" | "offline";
  cost?: number;
  motif?: string;
  findings?: string;
  recommendation?: string;
  otherRemarks?: string;
  height?: number;
  weight?: number;
  head?: number;
  arm?: number;
  thorax?: number;
  sao2?: number;
  temperature?: number;
  pulse?: number;
  respiratory?: number;
  systolic?: number;
  diastolic?: number;
  internalNotes?: string;
  transactionId?: string;
  transactionDate?: number;
  // Conflict resolution
  _serverVersion?: string;
}

export interface CachedVaccin extends CachedDocument {
  _id: string;
  doctorId: string;
  name: string;
}

export interface CachedDose extends CachedDocument {
  _id: string;
  vaccinId: string;
  doseType: "regular" | "annual" | "booster" | "unique";
  doseCount?: number;
  maxAge?: number;
}

export interface CachedVaccinationRecord extends CachedDocument {
  _id: string;
  patientId: string;
  vaccinId: string;
  doseId: string;
  date: number;
  notes?: string;
  manufacturer: string;
  lotNumber: string;
  expiration: number;
  dosage: string;
  route: string;
  site: string;
}

export interface CachedService extends CachedDocument {
  _id: string;
  doctorId: string;
  name: string;
  price: number;
  currency: string;
  type: "clinical" | "documentation";
  createdAt: number;
  updatedAt: number;
}

export interface CachedChart extends CachedDocument {
  _id: string;
  chartId: string;
  p03: unknown;
  p15: unknown;
  p50: unknown;
  p85: unknown;
  p97: unknown;
  height?: unknown;
}

export interface CachedPrescription extends CachedDocument {
  _id: string;
  doctorId: string;
  patientId: string;
  appointmentId?: string;
  drug: string;
  count: number;
  unit: string;
  posology: string;
  dose?: string;
  route?: string;
  startDate?: number;
  endDate?: number;
  refillsRemaining?: number;
  status: "active" | "completed" | "discontinued" | "cancelled";
  discontinuedReason?: string;
  renewedFromId?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CachedLabOrder extends CachedDocument {
  _id: string;
  doctorId: string;
  patientId: string;
  appointmentId?: string;
  examName: string;
  clinicalContext?: string;
  urgency?: "routine" | "urgent" | "stat";
  status: "ordered" | "collected" | "resulted" | "reviewed" | "cancelled";
  orderedAt?: number;
  collectedAt?: number;
  resultedAt?: number;
  reviewedAt?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CachedLabResult extends CachedDocument {
  _id: string;
  labOrderId: string;
  patientId: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  abnormalFlag?: "normal" | "low" | "high" | "critical";
  fileId?: string;
  enteredBy: "doctor" | "lab_import" | "portal_upload";
  enteredAt: number;
  notes?: string;
}

export interface CachedFile extends CachedDocument {
  _id: string;
  appointmentId: string;
  url: string;
  name: string;
  fileType: "IMAGE" | "PDF" | "VIDEO";
}

export interface CachedAppUser extends CachedDocument {
  _id: string;
  authUserId: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role: "patient" | "doctor" | "admin";
  plan: string;
  stripeCustomerId?: string;
}

// Sync status
export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  failedCount: number;
  conflictCount: number;
  isSyncing: boolean;
}
