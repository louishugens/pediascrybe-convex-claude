"use node";

/**
 * WhatsApp PDF Generation
 *
 * Server-side PDF generation using jsPDF for WhatsApp delivery.
 * Generates prescriptions, lab exam orders, receipts, patient summaries,
 * and WHO growth charts.
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

/** Write wrapped text and return the new y position. */
function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number = 4.5
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight + 1;
}

/** Check if we need a new page, add one if so. */
function checkPage(doc: jsPDF, y: number, needed: number = 20): number {
  if (y + needed > 275) {
    doc.addPage();
    return 20;
  }
  return y;
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
  y = checkPage(doc, y, 25);
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

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Medical Prescription", 105, y, { align: "center" });
  y += 10;

  y = addPatientLine(doc, patient, appointment.date, y);

  y += 5;
  for (const med of appointment.medication) {
    y = checkPage(doc, y);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const drugLine = `- ${med.drug}${med.count ? `, ${med.count} ${med.unit || "flacon"}` : ""}`;
    doc.text(drugLine, 25, y);
    y += 6;

    if (med.posology) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      y = addWrappedText(doc, med.posology, 30, y, 155, 5);
      y += 2;
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
    y = checkPage(doc, y);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const examText = exam.urgency ? `- ${exam.exam} (${exam.urgency})` : `- ${exam.exam}`;
    doc.text(examText, 25, y);
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
    y = checkPage(doc, y);

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
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`DOB: ${formatDate(patient.birthdate)}`, 20, y);
  if (patient.sex) {
    doc.text(`Sex: ${patient.sex === "male" ? "M" : "F"}`, 80, y);
  }
  y += 7;

  if (patient.allergies) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(200, 0, 0);
    doc.setFontSize(10);
    y = addWrappedText(doc, `Allergies: ${patient.allergies}`, 20, y, 165, 5);
    doc.setTextColor(0, 0, 0);
    y += 1;
  }

  if (patient.bloodtype) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Blood type: ${patient.bloodtype}`, 20, y);
    y += 7;
  }

  if (patient.history) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    y = addWrappedText(doc, `History: ${patient.history}`, 20, y, 165, 4);
    y += 2;
  }

  // Vitals
  if (data.lastVitals) {
    y = checkPage(doc, y, 20);
    y += 3;
    doc.setFontSize(10);
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
    y = checkPage(doc, y, 15);
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Recent Visits (${data.recentAppointments.length}):`, 20, y);
    y += 7;

    for (const appt of data.recentAppointments.slice(0, 5)) {
      y = checkPage(doc, y, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`${formatDate(appt.date)}${appt.motif ? ` — ${appt.motif}` : ""}`, 25, y);
      y += 6;

      if (appt.findings) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        y = addWrappedText(doc, appt.findings.slice(0, 300), 30, y, 155, 4);
        y += 1;
      }

      if (appt.medication && appt.medication.length > 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        const rxText = `Rx: ${appt.medication.map((m: any) => m.drug).join(", ")}`;
        y = addWrappedText(doc, rxText, 30, y, 155, 4);
      }

      y += 3;
    }
  }

  // Vaccinations
  y = checkPage(doc, y, 15);
  y += 3;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Vaccinations: ${data.vaccinationCount || 0} doses given`, 20, y);
  y += 6;

  if (data.possiblyDueVaccines && data.possiblyDueVaccines.length > 0) {
    doc.setFont("helvetica", "normal");
    y = addWrappedText(doc, `Possibly due: ${data.possiblyDueVaccines.join(", ")}`, 25, y, 160, 4);
  } else {
    doc.setFont("helvetica", "normal");
    doc.text("Up to date", 25, y);
  }

  return doc.output("arraybuffer");
}

// ==================== Growth Chart PDF ====================

/** Chart type configuration */
const CHART_CONFIGS: Record<
  string,
  {
    title: string;
    yLabel: string;
    xLabel: string;
    chartIdPrefix: { male: string; female: string };
    measureKey: "weight" | "height" | "head";
  }
> = {
  wfa: {
    title: "Weight for Age",
    yLabel: "Weight (kg)",
    xLabel: "Age (days)",
    chartIdPrefix: { male: "bwfa", female: "gwfa" },
    measureKey: "weight",
  },
  hfa: {
    title: "Height for Age",
    yLabel: "Height (cm)",
    xLabel: "Age (days)",
    chartIdPrefix: { male: "bhfa", female: "ghfa" },
    measureKey: "height",
  },
  hcfa: {
    title: "Head Circumference for Age",
    yLabel: "Head (cm)",
    xLabel: "Age (days)",
    chartIdPrefix: { male: "bhcfa", female: "ghcfa" },
    measureKey: "head",
  },
  bfa: {
    title: "BMI for Age",
    yLabel: "BMI (kg/m²)",
    xLabel: "Age (days)",
    chartIdPrefix: { male: "bbfa", female: "gbfa" },
    measureKey: "weight", // BMI calculated from weight+height
  },
};

export type GrowthChartType = keyof typeof CHART_CONFIGS;

export function getAvailableChartTypes(): string[] {
  return Object.keys(CHART_CONFIGS);
}

/**
 * Generate a WHO growth chart as PDF.
 * Draws percentile curves (3rd, 15th, 50th, 85th, 97th) with patient data points.
 */
export function generateGrowthChartPdf(
  doctor: DoctorInfo,
  patient: PatientInfo,
  chartType: string,
  referenceData: {
    p03: number[];
    p15: number[];
    p50: number[];
    p85: number[];
    p97: number[];
  },
  dataPoints: Array<{
    ageInDays: number;
    weight?: number;
    height?: number;
    head?: number;
  }>
): ArrayBuffer {
  const config = CHART_CONFIGS[chartType];
  if (!config) throw new Error(`Unknown chart type: ${chartType}`);

  const doc = new jsPDF("landscape");

  // Header
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Dr. ${doctor.firstname} ${doctor.lastname}`, 148, 10, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${patient.firstname} ${patient.lastname} — ${patient.sex === "male" ? "Male" : "Female"} — DOB: ${formatDate(patient.birthdate)}`,
    148,
    15,
    { align: "center" }
  );

  // Title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(config.title, 148, 22, { align: "center" });

  // Determine data range
  const relevantPoints = dataPoints.filter((dp) => {
    if (chartType === "bfa") return dp.weight && dp.height;
    return dp[config.measureKey] !== undefined && dp[config.measureKey] !== null;
  });

  if (relevantPoints.length === 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("No data points available for this chart type.", 148, 100, { align: "center" });
    return doc.output("arraybuffer");
  }

  // Get value for a data point based on chart type
  const getValue = (dp: typeof relevantPoints[0]): number => {
    if (chartType === "bfa" && dp.weight && dp.height) {
      const hm = dp.height! / 100;
      return dp.weight! / (hm * hm);
    }
    return dp[config.measureKey] as number;
  };

  // Percentile styles
  const percentileStyles: Array<{
    data: number[];
    color: [number, number, number];
    label: string;
  }> = [
    { data: referenceData.p15, color: [255, 165, 0], label: "15th" },
    { data: referenceData.p03, color: [255, 80, 80], label: "3rd" },
    { data: referenceData.p50, color: [0, 180, 0], label: "50th" },
    { data: referenceData.p85, color: [255, 105, 180], label: "85th" },
    { data: referenceData.p97, color: [138, 43, 226], label: "97th" },
  ];

  // Horizontal legend on top
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const legendY = 28;
  const legendItems = [
    ...percentileStyles.map((p) => ({ label: p.label, color: p.color, isPatient: false })),
    { label: patient.firstname, color: [0, 100, 255] as [number, number, number], isPatient: true },
  ];
  // Calculate total legend width for centering
  let totalLegendWidth = 0;
  for (const item of legendItems) {
    totalLegendWidth += 8 + doc.getTextWidth(item.label) + 8; // circle/line + text + gap
  }
  let legendX = 148 - totalLegendWidth / 2;
  for (const item of legendItems) {
    // Draw small colored circle with dash
    doc.setDrawColor(item.color[0], item.color[1], item.color[2]);
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.circle(legendX + 2, legendY, 1.2, "F");
    doc.setLineWidth(0.8);
    doc.line(legendX + 4, legendY, legendX + 8, legendY);
    doc.setTextColor(item.color[0], item.color[1], item.color[2]);
    doc.text(item.label, legendX + 10, legendY + 1);
    legendX += 10 + doc.getTextWidth(item.label) + 8;
  }
  doc.setTextColor(0, 0, 0);

  // Full age range — use all reference data (0 to end)
  const maxAge = referenceData.p50.length - 1;
  const minAge = 0;

  // Y-axis range from full reference data, starting at 0
  const allRefValues = [
    ...referenceData.p03.filter((v) => v !== undefined),
    ...referenceData.p97.filter((v) => v !== undefined),
  ];
  const patientValues = relevantPoints.map(getValue);
  const allValues = [...allRefValues, ...patientValues];
  const minY = 0;
  const maxY = Math.ceil(Math.max(...allValues) * 1.05);

  // Chart area
  const chartLeft = 35;
  const chartRight = 280;
  const chartTop = 35;
  const chartBottom = 175;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  // Coordinate transforms
  const toX = (age: number) => chartLeft + ((age - minAge) / (maxAge - minAge)) * chartWidth;
  const toY = (val: number) => chartBottom - ((val - minY) / (maxY - minY)) * chartHeight;

  // Draw grid
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.15);

  // Y grid lines + labels
  const yStep = maxY <= 30 ? 7 : 14;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  for (let val = 0; val <= maxY; val += yStep) {
    const py = toY(val);
    if (py >= chartTop && py <= chartBottom) {
      doc.line(chartLeft, py, chartRight, py);
      doc.text(val.toString(), chartLeft - 2, py + 1, { align: "right" });
    }
  }

  // X grid lines + labels — show age in days with reasonable step
  const xStep = maxAge <= 400 ? 30 : maxAge <= 800 ? 60 : 80;
  for (let age = xStep; age <= maxAge; age += xStep) {
    const px = toX(age);
    doc.line(px, chartTop, px, chartBottom);
    doc.text(age.toString(), px, chartBottom + 4, { align: "center" });
  }

  doc.setTextColor(0, 0, 0);

  // Axis labels
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(config.xLabel, chartLeft + chartWidth / 2, chartBottom + 11, { align: "center" });

  // Y label (rotated)
  doc.text(config.yLabel, 10, chartTop + chartHeight / 2, { angle: 90 });

  // Chart border (left + bottom axes only for cleaner look)
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.4);
  doc.line(chartLeft, chartTop, chartLeft, chartBottom); // left
  doc.line(chartLeft, chartBottom, chartRight, chartBottom); // bottom

  // Draw percentile curves — solid lines, no dashes
  const sampleStep = Math.max(1, Math.floor(maxAge / 300));

  // Draw order: 3rd, 15th, 50th, 85th, 97th (reorder for drawing)
  const drawOrder = [
    percentileStyles[1], // 3rd
    percentileStyles[0], // 15th
    percentileStyles[2], // 50th
    percentileStyles[3], // 85th
    percentileStyles[4], // 97th
  ];

  for (const pStyle of drawOrder) {
    doc.setDrawColor(...pStyle.color);
    doc.setLineWidth(1);

    let started = false;
    let prevX = 0;
    let prevPY = 0;

    for (let age = minAge; age <= maxAge; age += sampleStep) {
      const idx = Math.round(age);
      if (idx >= pStyle.data.length) break;
      const val = pStyle.data[idx];
      if (val === undefined) continue;

      const px = toX(age);
      const py = toY(val);

      if (started) {
        doc.line(prevX, prevPY, px, py);
      }

      prevX = px;
      prevPY = py;
      started = true;
    }
  }

  // Draw patient data points
  doc.setDrawColor(0, 50, 150);
  doc.setFillColor(0, 100, 255);
  doc.setLineWidth(0.4);

  for (const dp of relevantPoints) {
    const val = getValue(dp);
    const px = toX(dp.ageInDays);
    const py = toY(val);
    doc.circle(px, py, 1.5, "FD");
  }

  // Footer — measurement summary
  let summaryY = chartBottom + 16;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Measurements:", chartLeft, summaryY);
  summaryY += 4;

  doc.setFont("helvetica", "normal");
  for (const dp of relevantPoints) {
    const val = getValue(dp);
    const ageMonths = (dp.ageInDays / 30.44).toFixed(1);
    const unit = config.yLabel.split("(")[1]?.replace(")", "") || "";
    doc.text(`Age ${dp.ageInDays}d (${ageMonths}mo): ${val.toFixed(1)} ${unit}`, chartLeft, summaryY);
    summaryY += 4;
    if (summaryY > 200) break;
  }

  return doc.output("arraybuffer");
}
