import { offlineDb } from "./db";
import type { CachedAppUser } from "./types";

// Cache a single document
export async function cacheDocument(
  table: "doctors" | "patients" | "appointments" | "vaccins" | "doses" | "vaccinationRecords" | "services" | "charts" | "files" | "appUsers",
  doc: Record<string, unknown>
) {
  const cached = { ...doc, _cachedAt: Date.now() };
  const t = offlineDb[table] as any;
  await t.put(cached);
}

// Cache an array of documents
export async function cacheDocuments(
  table: "doctors" | "patients" | "appointments" | "vaccins" | "doses" | "vaccinationRecords" | "services" | "charts" | "files" | "appUsers",
  docs: Record<string, unknown>[]
) {
  const now = Date.now();
  const cached = docs.map((doc) => ({ ...doc, _cachedAt: now }));
  const t = offlineDb[table] as any;
  await t.bulkPut(cached);
}

// Get cached appUser for offline auth
export async function getCachedAppUser(authUserId: string): Promise<CachedAppUser | undefined> {
  return offlineDb.appUsers.where("authUserId").equals(authUserId).first();
}

// Clear all cached data for a doctor (e.g., on logout)
export async function clearDoctorCache(doctorId: string) {
  await Promise.all([
    offlineDb.patients.where("doctorId").equals(doctorId).delete(),
    offlineDb.appointments.where("doctorId").equals(doctorId).delete(),
    offlineDb.services.where("doctorId").equals(doctorId).delete(),
    offlineDb.vaccins.where("doctorId").equals(doctorId).delete(),
    offlineDb.queryCache.where("doctorId").equals(doctorId).delete(),
  ]);
}

// Check if a table has any cached data
export async function hasCachedData(table: "doctors" | "patients" | "appointments" | "services" | "vaccins"): Promise<boolean> {
  const count = await offlineDb[table].count();
  return count > 0;
}
