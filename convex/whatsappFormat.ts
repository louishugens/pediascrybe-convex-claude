/**
 * WhatsApp Response Formatters
 *
 * Converts structured tool results into WhatsApp-friendly text.
 * WhatsApp supports: *bold*, _italic_, ~strikethrough~, ```code```
 * No HTML, no markdown headers, no tables. Max 4096 chars per message.
 */

const MAX_MESSAGE_LENGTH = 4096;

/**
 * Convert markdown to WhatsApp format.
 */
export function markdownToWhatsApp(text: string): string {
  return text
    // Headers -> bold
    .replace(/^#{1,6}\s+(.+)$/gm, "*$1*")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    // Strip HTML tags
    .replace(/<[^>]+>/g, "")
    // Clean up multiple newlines
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * Format a patient summary for WhatsApp.
 */
export function formatPatientSummary(patient: any): string {
  const lines: string[] = [];

  lines.push(`*${patient.firstname} ${patient.lastname}* (${patient.age?.label}, ${patient.sex === "male" ? "M" : "F"})`);

  if (patient.allergies) {
    lines.push(`⚠️ _Allergies: ${patient.allergies}_`);
  }

  if (patient.lastVitals) {
    const v = patient.lastVitals;
    const vitals: string[] = [];
    if (v.weight) vitals.push(`Weight: ${v.weight}kg`);
    if (v.height) vitals.push(`Height: ${v.height}cm`);
    if (v.head) vitals.push(`Head: ${v.head}cm`);
    if (v.temperature) vitals.push(`Temp: ${v.temperature}°C`);
    if (vitals.length > 0) {
      lines.push(`\n*Last vitals:*`);
      lines.push(vitals.join(" | "));
    }
  }

  if (patient.lastMedication && patient.lastMedication.length > 0) {
    lines.push(`\n*Last Rx:*`);
    for (const med of patient.lastMedication) {
      lines.push(`- ${med.drug} ${med.count}${med.unit} ${med.posology}`);
    }
  }

  if (patient.history) {
    lines.push(`\n*History:* ${patient.history}`);
  }

  return lines.join("\n");
}

/**
 * Format a schedule list for WhatsApp.
 */
export function formatSchedule(appointments: any[], label: string): string {
  if (appointments.length === 0) {
    return `No appointments ${label}.`;
  }

  const lines: string[] = [`*${label}* (${appointments.length} patients):\n`];

  for (const appt of appointments) {
    const time = new Date(appt.time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const age = appt.patientAge ? ` (${appt.patientAge.label}, ${appt.patientSex === "male" ? "M" : "F"})` : "";
    const motif = appt.motif ? ` — ${appt.motif}` : "";
    lines.push(`${time} ${appt.patientName}${age}${motif}`);
  }

  return lines.join("\n");
}

/**
 * Format vaccination records for WhatsApp.
 */
export function formatVaccinations(data: any): string {
  const lines: string[] = [];

  lines.push(`*Vaccination Records* (${data.totalReceived} doses given)\n`);

  if (data.records.length > 0) {
    lines.push("*Given:*");
    for (const r of data.records) {
      const date = new Date(r.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      lines.push(`- ${r.vaccineName} (${r.doseType}) — ${date}`);
    }
  }

  if (data.possiblyDue.length > 0) {
    lines.push(`\n*Possibly due:*`);
    for (const v of data.possiblyDue) {
      lines.push(`- ${v}`);
    }
  } else {
    lines.push("\n✅ All tracked vaccines up to date");
  }

  return lines.join("\n");
}

/**
 * Format growth data for WhatsApp.
 */
export function formatGrowthData(data: any): string {
  const lines: string[] = [];

  lines.push(`*Growth Data — ${data.patientName}* (${data.age?.label}, ${data.sex === "male" ? "M" : "F"})\n`);

  if (data.dataPoints.length === 0) {
    lines.push("No growth measurements recorded.");
    return lines.join("\n");
  }

  const latest = data.dataPoints[data.dataPoints.length - 1];
  const earliest = data.dataPoints[0];

  lines.push("*Latest measurements:*");
  if (latest.weight) lines.push(`- Weight: ${latest.weight}kg`);
  if (latest.height) lines.push(`- Height: ${latest.height}cm`);
  if (latest.head) lines.push(`- Head: ${latest.head}cm`);

  if (data.dataPoints.length > 1) {
    lines.push(`\n*Trend (${data.dataPoints.length} data points):*`);
    if (earliest.weight && latest.weight) {
      const gain = (latest.weight - earliest.weight).toFixed(1);
      lines.push(`- Weight gain: ${gain}kg`);
    }
    if (earliest.height && latest.height) {
      const gain = (latest.height - earliest.height).toFixed(1);
      lines.push(`- Height gain: ${gain}cm`);
    }
  }

  return lines.join("\n");
}

/**
 * Format daily analytics for WhatsApp.
 */
export function formatDailyAnalytics(data: any): string {
  const lines: string[] = [];

  lines.push(`*Today's Summary* (${data.date})\n`);
  lines.push(`Patients: ${data.totalAppointments}`);
  lines.push(`Paid: ${data.paidAppointments}`);
  lines.push(`Revenue: ${data.totalRevenue.toLocaleString()}`);

  return lines.join("\n");
}

/**
 * Format a clinical proposal (diagnosis/medication/labs) for WhatsApp.
 */
export function formatProposal(
  type: "diagnostic" | "medication" | "labExam",
  patientName: string,
  data: any
): string {
  const lines: string[] = [];

  switch (type) {
    case "diagnostic":
      lines.push(`*Proposed Diagnosis for ${patientName}*\n`);
      if (Array.isArray(data.diagnoses)) {
        data.diagnoses.forEach((d: any, i: number) => {
          lines.push(`${i + 1}. ${d.name}${d.likelihood ? ` (${d.likelihood})` : ""}`);
          if (d.reasoning) lines.push(`   _${d.reasoning}_`);
        });
      }
      break;

    case "medication":
      lines.push(`*Proposed Medications for ${patientName}*\n`);
      if (data.context) lines.push(`_${data.context}_\n`);
      if (Array.isArray(data.medications)) {
        data.medications.forEach((m: any, i: number) => {
          lines.push(`${i + 1}. ${m.drug} — ${m.dose} ${m.frequency} x ${m.duration}`);
        });
      }
      if (data.warnings) lines.push(`\n⚠️ ${data.warnings}`);
      break;

    case "labExam":
      lines.push(`*Suggested Lab Exams for ${patientName}*\n`);
      if (Array.isArray(data.exams)) {
        data.exams.forEach((e: any, i: number) => {
          lines.push(`${i + 1}. ${e.name}${e.reason ? ` — _${e.reason}_` : ""}`);
        });
      }
      break;
  }

  lines.push("\nWould you like to save this to the record? You can also ask me to adjust anything.");

  return lines.join("\n");
}

/**
 * Split a long response into multiple WhatsApp messages.
 * Splits on double newlines (section breaks) to keep content coherent.
 */
export function splitIntoChunks(text: string): string[] {
  if (text.length <= MAX_MESSAGE_LENGTH) return [text];

  const sections = text.split("\n\n");
  const chunks: string[] = [];
  let current = "";

  for (const section of sections) {
    if (current.length + section.length + 2 > MAX_MESSAGE_LENGTH) {
      if (current) chunks.push(current.trim());
      current = section;
    } else {
      current += (current ? "\n\n" : "") + section;
    }
  }

  if (current) chunks.push(current.trim());

  return chunks;
}
