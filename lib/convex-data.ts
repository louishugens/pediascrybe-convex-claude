import { preloadAuthQuery, fetchAuthQuery } from "./auth-server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Preload the current doctor's data for SSR
 * Use in server components, pass result to client components via usePreloadedAuthQuery
 */
export async function preloadCurrentDoctor() {
  return preloadAuthQuery(api.doctors.getCurrent);
}

/**
 * Fetch the current doctor's data directly (for pure server rendering)
 */
export async function fetchCurrentDoctor() {
  return fetchAuthQuery(api.doctors.getCurrent);
}

/**
 * Get the current doctor's data (alias for fetchCurrentDoctor)
 */
export async function getCurrentDoctor() {
  return fetchAuthQuery(api.doctors.getCurrent);
}

/**
 * Get the current doctor's data (alias for fetchCurrentDoctor)
 */
export async function getMyDoctor() {
  return fetchAuthQuery(api.doctors.getCurrent);
}

/**
 * Preload patients for the current doctor
 */
export async function preloadPatients(doctorId: Id<"doctors">) {
  return preloadAuthQuery(api.patients.list, { doctorId });
}

/**
 * Preload patients with search
 */
export async function preloadPatientsWithSearch(doctorId: Id<"doctors">, search?: string) {
  return preloadAuthQuery(api.patients.listWithSearch, { doctorId, search });
}

/**
 * Preload a single patient
 */
export async function preloadPatient(patientId: Id<"patients">) {
  return preloadAuthQuery(api.patients.getById, { patientId });
}

/**
 * Preload patient with appointments
 */
export async function preloadPatientWithAppointments(patientId: Id<"patients">) {
  return preloadAuthQuery(api.patients.getWithAppointments, { patientId });
}

/**
 * Preload appointments for a doctor
 */
export async function preloadAppointmentsByDoctor(doctorId: Id<"doctors">) {
  return preloadAuthQuery(api.appointments.listByDoctor, { doctorId });
}

/**
 * Preload appointments for a patient
 */
export async function preloadAppointmentsByPatient(patientId: Id<"patients">) {
  return preloadAuthQuery(api.appointments.listByPatient, { patientId });
}

/**
 * Preload a single appointment with related data
 */
export async function preloadAppointment(appointmentId: Id<"appointments">) {
  return preloadAuthQuery(api.appointments.getById, { appointmentId });
}

/**
 * Preload services for a doctor
 */
export async function preloadServices(doctorId: Id<"doctors">) {
  return preloadAuthQuery(api.services.list, { doctorId });
}

/**
 * Preload today's revenue
 */
export async function preloadTodayRevenue(doctorId: Id<"doctors">) {
  return preloadAuthQuery(api.appointments.getTodayRevenue, { doctorId });
}

/**
 * Preload monthly revenue
 */
export async function preloadMonthlyRevenue(doctorId: Id<"doctors">) {
  return preloadAuthQuery(api.appointments.getMonthlyRevenue, { doctorId });
}

/**
 * Preload today's patient count
 */
export async function preloadTodayPatientCount(doctorId: Id<"doctors">) {
  return preloadAuthQuery(api.appointments.getTodayPatientCount, { doctorId });
}

/**
 * Preload vaccination records for a patient
 */
export async function preloadVaccinationRecords(patientId: Id<"patients">) {
  return preloadAuthQuery(api.vaccines.getPatientRecords, { patientId });
}

/**
 * Preload doctor's tracked vaccines
 */
export async function preloadDoctorVaccines(doctorId: Id<"doctors">) {
  return preloadAuthQuery(api.vaccines.listByDoctor, { doctorId });
}

/**
 * Preload reports for a patient
 */
export async function preloadReports(patientId: Id<"patients">) {
  return preloadAuthQuery(api.reports.listByPatient, { patientId });
}

/**
 * Preload receipts for a patient
 */
export async function preloadReceipts(patientId: Id<"patients">) {
  return preloadAuthQuery(api.receipts.listByPatient, { patientId });
}

