// Vaccination compliance calculation utilities
// Compares patient age against doctor's tracked vaccine schedule

import { Id } from "@/convex/_generated/dataModel";

// ==================== Types ====================

export type DoseStatusType = "completed" | "due" | "overdue" | "upcoming" | "not_applicable";
export type VaccineStatusType = "completed" | "due" | "overdue" | "upcoming";

export interface Dose {
  _id: Id<"doses">;
  vaccinId: Id<"vaccins">;
  doseType: "regular" | "annual" | "booster" | "unique";
  doseCount?: number;
  maxAge?: number; // in months
}

export interface Vaccine {
  _id: Id<"vaccins">;
  doctorId: Id<"doctors">;
  name: string;
  doses: Dose[];
}

export interface VaccinationRecord {
  _id: Id<"vaccinationRecords">;
  patientId: Id<"patients">;
  vaccinId: Id<"vaccins">;
  doseId: Id<"doses">;
  date: number;
}

export interface DoseStatus {
  dose: Dose;
  status: DoseStatusType;
  recordDate?: number;
  /** Positive = months until due. Negative = months overdue. */
  monthsDelta?: number;
}

export interface VaccineCompliance {
  vaccine: Vaccine;
  doseStatuses: DoseStatus[];
  overallStatus: VaccineStatusType;
  completedCount: number;
  /** Doses that should have been given by now (completed + due + overdue) */
  expectedCount: number;
  applicableCount: number;
  completionPercentage: number;
}

export interface OverallCompliance {
  vaccines: VaccineCompliance[];
  totalDoses: number;
  /** Doses that should have been given by now (completed + due + overdue) */
  expectedDoses: number;
  completedDoses: number;
  dueDoses: number;
  overdueDoses: number;
  upcomingDoses: number;
  completionPercentage: number;
}

// ==================== Calculations ====================

const AVERAGE_DAYS_PER_MONTH = 30.4375;
const GRACE_PERIOD_MONTHS = 1;

export function calculatePatientAgeInMonths(birthdate: number): number {
  const ageInMs = Date.now() - birthdate;
  return ageInMs / (1000 * 60 * 60 * 24 * AVERAGE_DAYS_PER_MONTH);
}

export function calculateDoseStatus(
  dose: Dose,
  patientAgeInMonths: number,
  records: VaccinationRecord[]
): DoseStatus {
  // Check if this dose has been administered
  const record = records.find((r) => r.doseId === dose._id);
  if (record) {
    return { dose, status: "completed", recordDate: record.date };
  }

  // No maxAge defined — can't determine schedule
  if (dose.maxAge === undefined || dose.maxAge === null) {
    return { dose, status: "not_applicable" };
  }

  const dueThreshold = Math.max(0, dose.maxAge - GRACE_PERIOD_MONTHS);

  if (patientAgeInMonths < dueThreshold) {
    return {
      dose,
      status: "upcoming",
      monthsDelta: dueThreshold - patientAgeInMonths,
    };
  }

  if (patientAgeInMonths <= dose.maxAge) {
    return {
      dose,
      status: "due",
      monthsDelta: dose.maxAge - patientAgeInMonths,
    };
  }

  // Patient age exceeds maxAge
  return {
    dose,
    status: "overdue",
    monthsDelta: dose.maxAge - patientAgeInMonths, // negative
  };
}

export function calculateVaccineCompliance(
  vaccine: Vaccine,
  patientAgeInMonths: number,
  records: VaccinationRecord[]
): VaccineCompliance {
  const vaccineRecords = records.filter((r) => r.vaccinId === vaccine._id);

  const doseStatuses = vaccine.doses.map((dose) =>
    calculateDoseStatus(dose, patientAgeInMonths, vaccineRecords)
  );

  const applicable = doseStatuses.filter((d) => d.status !== "not_applicable");
  const completed = applicable.filter((d) => d.status === "completed");
  const expected = applicable.filter(
    (d) => d.status === "completed" || d.status === "due" || d.status === "overdue"
  );
  const hasOverdue = applicable.some((d) => d.status === "overdue");
  const hasDue = applicable.some((d) => d.status === "due");

  let overallStatus: VaccineStatusType;
  if (hasOverdue) overallStatus = "overdue";
  else if (hasDue) overallStatus = "due";
  else if (completed.length === expected.length && expected.length > 0)
    overallStatus = "completed";
  else overallStatus = "upcoming";

  return {
    vaccine,
    doseStatuses,
    overallStatus,
    completedCount: completed.length,
    expectedCount: expected.length,
    applicableCount: applicable.length,
    completionPercentage:
      expected.length > 0 ? (completed.length / expected.length) * 100 : 0,
  };
}

export function calculateOverallCompliance(
  vaccines: Vaccine[],
  patientAgeInMonths: number,
  records: VaccinationRecord[]
): OverallCompliance {
  const vaccineCompliances = vaccines.map((v) =>
    calculateVaccineCompliance(v, patientAgeInMonths, records)
  );

  let totalDoses = 0;
  let completedDoses = 0;
  let dueDoses = 0;
  let overdueDoses = 0;
  let upcomingDoses = 0;

  for (const vc of vaccineCompliances) {
    for (const ds of vc.doseStatuses) {
      if (ds.status === "not_applicable") continue;
      totalDoses++;
      if (ds.status === "completed") completedDoses++;
      else if (ds.status === "due") dueDoses++;
      else if (ds.status === "overdue") overdueDoses++;
      else if (ds.status === "upcoming") upcomingDoses++;
    }
  }

  // Expected = doses that should have been given by now
  const expectedDoses = completedDoses + dueDoses + overdueDoses;

  return {
    vaccines: vaccineCompliances,
    totalDoses,
    expectedDoses,
    completedDoses,
    dueDoses,
    overdueDoses,
    upcomingDoses,
    completionPercentage:
      expectedDoses > 0 ? (completedDoses / expectedDoses) * 100 : 0,
  };
}
