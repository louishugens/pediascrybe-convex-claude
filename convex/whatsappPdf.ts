"use node";

/**
 * WhatsApp PDF Generation
 *
 * Server-side PDF generation using jsPDF for WhatsApp delivery.
 * Generates prescriptions, lab exam orders, receipts, and patient summaries.
 */
import { jsPDF } from "jspdf";

interface DoctorInfo {
  firstname: string;
  lastname: string;
  spec?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface PatientInfo {
  firstname: string;
  lastname: string;
  sex?: string;
  birthdate: number;
  allergies?: string;
}

// ==================== Helpers ====================

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function addHeader(doc: jsPDF, doctor: DoctorInfo): number {
  let y = 20;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Dr. ${doctor.firstname} ${doctor.lastname}`, 105, y, {
    align: "center",
  });
  y += 7;

  if (doctor.spec) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    doc.text(doctor.spec, 105, y, { align: "center" });
    y += 6;
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const contactParts: string[] = [];
  if (doctor.phone) contactParts.push(`Tel: ${doctor.phone}`);
  if (doctor.email) contactParts.push(`Email: ${doctor.email}`);
  if (contactParts.length > 0) {
    doc.text(contactParts.join("  |  "), 105, y, { align: "center" });
    y += 5;
  }

  if (doctor.address) {
    doc.text(doctor.address, 105, y, { align: "center" });
    y += 5;
  }

  // Separator line
  y += 3;
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  y += 8;

  return y;
}

function addPatientLine(
  doc: jsPDF,
  patient: PatientInfo,
  date: number,
  y: number
): number {
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Patient: ", 20, y);
  doc.setFont("helvetica", "bold");
  doc.text(
    `${patient.firstname} ${patient.lastname}`,
    20 + doc.getTextWidth("Patient: "),
    y
  );

  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${formatDate(date)}`, 190, y, { align: "right" });
  y += 8;

  return y;
}

function addSignatureLine(doc: jsPDF, y: number): number {
  y += 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Signature:", 120, y);
  doc.line(145, y, 190, y);
  return y + 10;
}

// ==================== PDF Generators ====================

/**
 * Generate a prescription PDF.
 */
export function generatePrescriptionPdf(
  doctor: DoctorInfo,
  patient: PatientInfo,
  appointment: {
    date: number;
    medication: Array<{
      drug: string;
      count?: number;
      unit?: string;
      posology?: string;
    }>;
  }
): ArrayBuffer {
  const doc = new jsPDF();
  let y = addHeader(doc, doctor);

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Medical Prescription", 105, y, { align: "center" });
  y += 10;

  y = addPatientLine(doc, patient, appointment.date, y);

  // Medications
  y += 5;
  for (const med of appointment.medication) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const drugLine = `- ${med.drug}${med.count ? `, ${med.count} ${med.unit || "flacon"}` : ""}`;
    doc.text(drugLine, 25, y);
    y += 6;

    if (med.posology) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(med.posology, 155);
      doc.text(lines, 30, y);
      y += lines.length * 5 + 3;
    }
  }

  addSignatureLine(doc, y);

  return doc.output("arraybuffer");
}

/**
 * Generate a lab exam order PDF.
 */
export function generateLabExamPdf(
  doctor: DoctorInfo,
  patient: PatientInfo,
  appointment: {
    date: number;
    exams: Array<{ exam: string; urgency?: string }>;
  }
): ArrayBuffer {
  const doc = new jsPDF();
  let y = addHeader(doc, doctor);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Laboratory Tests", 105, y, { align: "center" });
  y += 10;

  y = addPatientLine(doc, patient, appointment.date, y);

  y += 5;
  for (const exam of appointment.exams) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`- ${exam.exam}`, 25, y);
    if (exam.urgency) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text(` (${exam.urgency})`, 25 + doc.getTextWidth(`- ${exam.exam} `), y);
    }
    y += 7;
  }

  addSignatureLine(doc, y);

  return doc.output("arraybuffer");
}

/**
 * Generate a receipt PDF.
 */
export function generateReceiptPdf(
  doctor: DoctorInfo,
  patient: PatientInfo,
  receipt: {
    date: number;
    services: Array<{ service: string; price: number }>;
    currency: string;
  }
): ArrayBuffer {
  const doc = new jsPDF();
  let y = addHeader(doc, doctor);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Receipt", 105, y, { align: "center" });
  y += 10;

  y = addPatientLine(doc, patient, receipt.date, y);

  // Table header
  y += 5;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y - 4, 170, 8, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Service", 25, y);
  doc.text("Cost", 170, y, { align: "right" });
  y += 10;

  // Services
  let total = 0;
  doc.setFont("helvetica", "normal");
  for (const svc of receipt.services) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.text(svc.service, 25, y);
    const formatted = new Intl.NumberFormat("en", {
      style: "currency",
      currency: receipt.currency,
    }).format(svc.price);
    doc.text(formatted, 170, y, { align: "right" });
    total += svc.price;
    y += 7;
  }

  // Total
  y += 5;
  doc.setFillColor(240, 240, 240);
  doc.rect(100, y - 4, 90, 8, "F");
  doc.setFont("helvetica", "bold");
  const totalFormatted = new Intl.NumberFormat("en", {
    style: "currency",
    currency: receipt.currency,
  }).format(total);
  doc.text(`Total: ${totalFormatted}`, 170, y, { align: "right" });

  addSignatureLine(doc, y);

  return doc.output("arraybuffer");
}

/**
 * Generate a patient summary PDF.
 */
export function generatePatientSummaryPdf(
  doctor: DoctorInfo,
  patient: PatientInfo & {
    history?: string;
    bloodtype?: string;
    phone?: string;
    mothername?: string;
  },
  data: {
    lastVitals?: {
      weight?: number;
      height?: number;
      head?: number;
      temperature?: number;
      pulse?: number;
    } | null;
    recentAppointments?: Array<{
      date: number;
      motif?: string;
      findings?: string;
      medication?: any[];
    }>;
    vaccinationCount?: number;
    possiblyDueVaccines?: string[];
  }
): ArrayBuffer {
  const doc = new jsPDF();
  let y = addHeader(doc, doctor);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Patient Summary", 105, y, { align: "center" });
  y += 10;

  // Demographics
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${patient.firstname} ${patient.lastname}`, 20, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`DOB: ${formatDate(patient.birthdate)}`, 20, y);
  if (patient.sex) {
    doc.text(`Sex: ${patient.sex === "male" ? "M" : "F"}`, 80, y);
  }
  y += 6;

  if (patient.allergies) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(200, 0, 0);
    doc.text(`Allergies: ${patient.allergies}`, 20, y);
    doc.setTextColor(0, 0, 0);
    y += 6;
  }

  if (patient.bloodtype) {
    doc.setFont("helvetica", "normal");
    doc.text(`Blood type: ${patient.bloodtype}`, 20, y);
    y += 6;
  }

  if (patient.history) {
    doc.text(`History: ${patient.history}`, 20, y);
    y += 6;
  }

  // Vitals
  if (data.lastVitals) {
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Latest Vitals:", 20, y);
    y += 6;
    doc.setFont("helvetica", "normal");

    const vitals = data.lastVitals;
    const vParts: string[] = [];
    if (vitals.weight) vParts.push(`Weight: ${vitals.weight}kg`);
    if (vitals.height) vParts.push(`Height: ${vitals.height}cm`);
    if (vitals.head) vParts.push(`Head: ${vitals.head}cm`);
    if (vitals.temperature) vParts.push(`Temp: ${vitals.temperature}°C`);
    if (vitals.pulse) vParts.push(`Pulse: ${vitals.pulse}bpm`);

    doc.text(vParts.join("  |  "), 25, y);
    y += 8;
  }

  // Recent appointments
  if (data.recentAppointments && data.recentAppointments.length > 0) {
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text(`Recent Visits (${data.recentAppointments.length}):`, 20, y);
    y += 7;

    for (const appt of data.recentAppointments.slice(0, 5)) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`${formatDate(appt.date)}${appt.motif ? ` — ${appt.motif}` : ""}`, 25, y);
      y += 5;

      if (appt.findings) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(appt.findings.slice(0, 200), 155);
        doc.text(lines, 30, y);
        y += lines.length * 4 + 2;
      }

      if (appt.medication && appt.medication.length > 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.text(
          `Rx: ${appt.medication.map((m: any) => m.drug).join(", ")}`,
          30,
          y
        );
        y += 5;
      }

      y += 3;
    }
  }

  // Vaccinations
  y += 3;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Vaccinations: ${data.vaccinationCount || 0} doses given`, 20, y);
  y += 6;

  if (data.possiblyDueVaccines && data.possiblyDueVaccines.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.text(`Possibly due: ${data.possiblyDueVaccines.join(", ")}`, 25, y);
  } else {
    doc.setFont("helvetica", "normal");
    doc.text("Up to date", 25, y);
  }

  return doc.output("arraybuffer");
}
