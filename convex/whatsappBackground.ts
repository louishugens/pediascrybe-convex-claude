"use node";

/**
 * WhatsApp Background Jobs
 *
 * Long-running operations that send follow-up WhatsApp messages
 * when complete. Scheduled via ctx.scheduler.runAfter().
 */
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  sendTextMessage,
  sendChunkedMessages,
  sendDocumentMessage,
} from "./whatsappClient";
import { splitIntoChunks } from "./whatsappFormat";
import {
  generatePrescriptionPdf,
  generateLabExamPdf,
  generateReceiptPdf,
  generatePatientSummaryPdf,
} from "./whatsappPdf";

/**
 * Generate a comprehensive patient report and send via WhatsApp.
 */
export const generateFullReport = internalAction({
  args: {
    doctorId: v.id("doctors"),
    patientId: v.id("patients"),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Fetch all patient data
      const summary = await ctx.runQuery(
        internal.whatsappData.getPatientSummary,
        { doctorId: args.doctorId, patientId: args.patientId }
      );

      const vaccinations = await ctx.runQuery(
        internal.whatsappData.getVaccinationRecords,
        { doctorId: args.doctorId, patientId: args.patientId }
      );

      const growthData = await ctx.runQuery(
        internal.whatsappData.getPatientGrowthData,
        { doctorId: args.doctorId, patientId: args.patientId }
      );

      // Build comprehensive report
      const lines: string[] = [];

      lines.push(`*Comprehensive Report*`);
      lines.push(`*${summary.firstname} ${summary.lastname}* (${summary.age?.label}, ${summary.sex === "male" ? "M" : "F"})`);
      lines.push(`DOB: ${new Date(summary.birthdate).toLocaleDateString()}`);
      lines.push("");

      // Demographics
      if (summary.allergies) lines.push(`⚠️ *Allergies:* ${summary.allergies}`);
      if (summary.bloodtype) lines.push(`*Blood type:* ${summary.bloodtype}`);
      if (summary.history) lines.push(`*History:* ${summary.history}`);
      lines.push("");

      // Latest vitals
      if (summary.lastVitals) {
        lines.push("*Latest Vitals:*");
        const v = summary.lastVitals;
        if (v.weight) lines.push(`  Weight: ${v.weight}kg`);
        if (v.height) lines.push(`  Height: ${v.height}cm`);
        if (v.head) lines.push(`  Head: ${v.head}cm`);
        if (v.temperature) lines.push(`  Temp: ${v.temperature}°C`);
        if (v.pulse) lines.push(`  Pulse: ${v.pulse}bpm`);
        lines.push("");
      }

      // Recent appointments
      if (summary.recentAppointments && summary.recentAppointments.length > 0) {
        lines.push(`*Recent Visits (${summary.recentAppointments.length}):*`);
        for (const appt of summary.recentAppointments.slice(0, 5)) {
          const date = new Date(appt.date).toLocaleDateString();
          lines.push(`  ${date}${appt.motif ? ` — ${appt.motif}` : ""}`);
          if (appt.findings) lines.push(`    Findings: ${appt.findings.slice(0, 100)}`);
          if (appt.medication && appt.medication.length > 0) {
            lines.push(`    Rx: ${appt.medication.map((m: any) => m.drug).join(", ")}`);
          }
        }
        lines.push("");
      }

      // Growth data
      if (growthData.dataPoints.length > 0) {
        const latest = growthData.dataPoints[growthData.dataPoints.length - 1];
        lines.push("*Growth (latest):*");
        if (latest.weight) lines.push(`  Weight: ${latest.weight}kg`);
        if (latest.height) lines.push(`  Height: ${latest.height}cm`);
        lines.push(`  (${growthData.dataPoints.length} data points total)`);
        lines.push("");
      }

      // Vaccinations
      lines.push(`*Vaccinations:* ${vaccinations.totalReceived} doses given`);
      if (vaccinations.possiblyDue.length > 0) {
        lines.push(`  Possibly due: ${vaccinations.possiblyDue.join(", ")}`);
      } else {
        lines.push("  ✅ Up to date");
      }

      const report = lines.join("\n");
      const chunks = splitIntoChunks(report);
      await sendChunkedMessages(args.phoneNumber, chunks);
    } catch (error: any) {
      console.error("[Background] Full report error:", error);
      await sendTextMessage(
        args.phoneNumber,
        "Sorry, I couldn't generate the report. Please try again."
      );
    }
  },
});

/**
 * Generate end-of-day summary and send via WhatsApp.
 */
export const generateEndOfDaySummary = internalAction({
  args: {
    doctorId: v.id("doctors"),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const schedule = await ctx.runQuery(
        internal.whatsappData.getTodaySchedule,
        { doctorId: args.doctorId }
      );

      const analytics = await ctx.runQuery(
        internal.whatsappData.getDailyAnalytics,
        { doctorId: args.doctorId }
      );

      const lines: string[] = [];
      lines.push(`*End of Day Summary — ${analytics.date}*\n`);
      lines.push(`*Patients seen:* ${analytics.totalAppointments}`);
      lines.push(`*Paid:* ${analytics.paidAppointments}`);
      lines.push(`*Revenue:* ${analytics.totalRevenue.toLocaleString()}`);
      lines.push("");

      if (schedule.length > 0) {
        lines.push("*Today's patients:*");
        for (const appt of schedule) {
          const time = new Date(appt.time).toLocaleTimeString("en-US", {
            hour: "2-digit", minute: "2-digit", hour12: false,
          });
          const age = appt.patientAge ? ` (${appt.patientAge.label})` : "";
          const motif = appt.motif ? ` — ${appt.motif}` : "";
          const status = appt.status === "paid" ? " ✅" : "";
          lines.push(`  ${time} ${appt.patientName}${age}${motif}${status}`);
        }
      }

      const summary = lines.join("\n");
      const chunks = splitIntoChunks(summary);
      await sendChunkedMessages(args.phoneNumber, chunks);
    } catch (error: any) {
      console.error("[Background] Daily summary error:", error);
      await sendTextMessage(
        args.phoneNumber,
        "Sorry, I couldn't generate the daily summary. Please try again."
      );
    }
  },
});

/**
 * Batch check vaccine status for patients in an age range.
 */
export const batchVaccineCheck = internalAction({
  args: {
    doctorId: v.id("doctors"),
    phoneNumber: v.string(),
    minAgeMonths: v.number(),
    maxAgeMonths: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // Get all patients for this doctor
      const patients: any[] = await ctx.runQuery(
        internal.whatsappData.getAllPatientsInAgeRange,
        {
          doctorId: args.doctorId,
          minAgeMonths: args.minAgeMonths,
          maxAgeMonths: args.maxAgeMonths,
        }
      );

      if (patients.length === 0) {
        await sendTextMessage(
          args.phoneNumber,
          `No patients found in the ${args.minAgeMonths}-${args.maxAgeMonths} month age range.`
        );
        return;
      }

      // Check each patient's vaccines
      const patientsWithOverdue: { name: string; age: string; due: string[] }[] = [];

      for (const patient of patients) {
        const vaccinations = await ctx.runQuery(
          internal.whatsappData.getVaccinationRecords,
          { doctorId: args.doctorId, patientId: patient._id }
        );

        if (vaccinations.possiblyDue.length > 0) {
          patientsWithOverdue.push({
            name: `${patient.firstname} ${patient.lastname}`,
            age: patient.ageLabel,
            due: vaccinations.possiblyDue,
          });
        }
      }

      const lines: string[] = [];
      lines.push(`*Vaccine Check Results*`);
      lines.push(`Age range: ${args.minAgeMonths}-${args.maxAgeMonths} months`);
      lines.push(`Patients checked: ${patients.length}`);
      lines.push(`With overdue vaccines: ${patientsWithOverdue.length}\n`);

      if (patientsWithOverdue.length === 0) {
        lines.push("✅ All patients in this age range are up to date!");
      } else {
        for (const p of patientsWithOverdue.slice(0, 20)) {
          lines.push(`*${p.name}* (${p.age})`);
          lines.push(`  Due: ${p.due.join(", ")}`);
        }
        if (patientsWithOverdue.length > 20) {
          lines.push(`\n...and ${patientsWithOverdue.length - 20} more`);
        }
      }

      const report = lines.join("\n");
      const chunks = splitIntoChunks(report);
      await sendChunkedMessages(args.phoneNumber, chunks);
    } catch (error: any) {
      console.error("[Background] Batch vaccine check error:", error);
      await sendTextMessage(
        args.phoneNumber,
        "Sorry, I couldn't complete the vaccine check. Please try again."
      );
    }
  },
});

// ==================== PDF Generation Actions ====================

/**
 * Generate and send a prescription PDF via WhatsApp.
 */
export const sendPrescriptionPdf = internalAction({
  args: {
    doctorId: v.id("doctors"),
    appointmentId: v.id("appointments"),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const doctor = await ctx.runQuery(internal.whatsappData.getDoctorById, {
        doctorId: args.doctorId,
      });
      if (!doctor) throw new Error("Doctor not found");

      const data = await ctx.runQuery(
        internal.whatsappData.getAppointmentForPdf,
        { doctorId: args.doctorId, appointmentId: args.appointmentId }
      );

      if (!data.appointment.medication || data.appointment.medication.length === 0) {
        await sendTextMessage(
          args.phoneNumber,
          "This appointment has no prescriptions to generate a PDF for."
        );
        return;
      }

      const pdfBuffer = generatePrescriptionPdf(
        {
          firstname: doctor.firstname,
          lastname: doctor.lastname,
          spec: doctor.spec,
          phone: doctor.phone,
          email: doctor.email,
          address: doctor.address,
        },
        data.patient,
        {
          date: data.appointment.date,
          medication: data.appointment.medication as any[],
        }
      );

      // Store in Convex file storage
      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const storageId = await ctx.storage.store(blob);
      const url = await ctx.storage.getUrl(storageId);

      if (!url) throw new Error("Failed to get storage URL");

      const filename = `Prescription_${data.patient.firstname}_${data.patient.lastname}.pdf`;
      await sendDocumentMessage(args.phoneNumber, url, filename, "Prescription");

      console.log(`[Background] Sent prescription PDF for appointment ${args.appointmentId}`);
    } catch (error: any) {
      console.error("[Background] Prescription PDF error:", error);
      await sendTextMessage(
        args.phoneNumber,
        "Sorry, I couldn't generate the prescription PDF. Please try again."
      );
    }
  },
});

/**
 * Generate and send a lab exam order PDF via WhatsApp.
 */
export const sendLabExamPdf = internalAction({
  args: {
    doctorId: v.id("doctors"),
    appointmentId: v.id("appointments"),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const doctor = await ctx.runQuery(internal.whatsappData.getDoctorById, {
        doctorId: args.doctorId,
      });
      if (!doctor) throw new Error("Doctor not found");

      const data = await ctx.runQuery(
        internal.whatsappData.getAppointmentForPdf,
        { doctorId: args.doctorId, appointmentId: args.appointmentId }
      );

      if (!data.appointment.exams || data.appointment.exams.length === 0) {
        await sendTextMessage(
          args.phoneNumber,
          "This appointment has no lab exams to generate a PDF for."
        );
        return;
      }

      const pdfBuffer = generateLabExamPdf(
        {
          firstname: doctor.firstname,
          lastname: doctor.lastname,
          spec: doctor.spec,
          phone: doctor.phone,
          email: doctor.email,
          address: doctor.address,
        },
        data.patient,
        {
          date: data.appointment.date,
          exams: data.appointment.exams as any[],
        }
      );

      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const storageId = await ctx.storage.store(blob);
      const url = await ctx.storage.getUrl(storageId);

      if (!url) throw new Error("Failed to get storage URL");

      const filename = `LabExams_${data.patient.firstname}_${data.patient.lastname}.pdf`;
      await sendDocumentMessage(args.phoneNumber, url, filename, "Lab Exams");

      console.log(`[Background] Sent lab exam PDF for appointment ${args.appointmentId}`);
    } catch (error: any) {
      console.error("[Background] Lab exam PDF error:", error);
      await sendTextMessage(
        args.phoneNumber,
        "Sorry, I couldn't generate the lab exam PDF. Please try again."
      );
    }
  },
});

/**
 * Generate and send a receipt PDF via WhatsApp.
 */
export const sendReceiptPdf = internalAction({
  args: {
    doctorId: v.id("doctors"),
    receiptId: v.id("receipts"),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const doctor = await ctx.runQuery(internal.whatsappData.getDoctorById, {
        doctorId: args.doctorId,
      });
      if (!doctor) throw new Error("Doctor not found");

      const data = await ctx.runQuery(
        internal.whatsappData.getReceiptForPdf,
        { doctorId: args.doctorId, receiptId: args.receiptId }
      );

      const pdfBuffer = generateReceiptPdf(
        {
          firstname: doctor.firstname,
          lastname: doctor.lastname,
          spec: doctor.spec,
          phone: doctor.phone,
          email: doctor.email,
          address: doctor.address,
        },
        data.patient,
        {
          date: data.receipt.date,
          services: data.receipt.services as any[],
          currency: data.receipt.currency,
        }
      );

      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const storageId = await ctx.storage.store(blob);
      const url = await ctx.storage.getUrl(storageId);

      if (!url) throw new Error("Failed to get storage URL");

      const filename = `Receipt_${data.patient.firstname}_${data.patient.lastname}.pdf`;
      await sendDocumentMessage(args.phoneNumber, url, filename, "Receipt");

      console.log(`[Background] Sent receipt PDF for receipt ${args.receiptId}`);
    } catch (error: any) {
      console.error("[Background] Receipt PDF error:", error);
      await sendTextMessage(
        args.phoneNumber,
        "Sorry, I couldn't generate the receipt PDF. Please try again."
      );
    }
  },
});

/**
 * Generate and send a patient summary PDF via WhatsApp.
 */
export const sendPatientSummaryPdf = internalAction({
  args: {
    doctorId: v.id("doctors"),
    patientId: v.id("patients"),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const doctor = await ctx.runQuery(internal.whatsappData.getDoctorById, {
        doctorId: args.doctorId,
      });
      if (!doctor) throw new Error("Doctor not found");

      const summary = await ctx.runQuery(
        internal.whatsappData.getPatientSummary,
        { doctorId: args.doctorId, patientId: args.patientId }
      );

      const vaccinations = await ctx.runQuery(
        internal.whatsappData.getVaccinationRecords,
        { doctorId: args.doctorId, patientId: args.patientId }
      );

      const pdfBuffer = generatePatientSummaryPdf(
        {
          firstname: doctor.firstname,
          lastname: doctor.lastname,
          spec: doctor.spec,
          phone: doctor.phone,
          email: doctor.email,
          address: doctor.address,
        },
        {
          firstname: summary.firstname,
          lastname: summary.lastname,
          sex: summary.sex,
          birthdate: summary.birthdate,
          allergies: summary.allergies,
          history: summary.history,
          bloodtype: summary.bloodtype,
          phone: summary.phone,
          mothername: summary.mothername,
        },
        {
          lastVitals: summary.lastVitals,
          recentAppointments: summary.recentAppointments,
          vaccinationCount: vaccinations.totalReceived,
          possiblyDueVaccines: vaccinations.possiblyDue,
        }
      );

      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const storageId = await ctx.storage.store(blob);
      const url = await ctx.storage.getUrl(storageId);

      if (!url) throw new Error("Failed to get storage URL");

      const filename = `Summary_${summary.firstname}_${summary.lastname}.pdf`;
      await sendDocumentMessage(
        args.phoneNumber,
        url,
        filename,
        `Patient Summary: ${summary.firstname} ${summary.lastname}`
      );

      console.log(`[Background] Sent patient summary PDF for ${args.patientId}`);
    } catch (error: any) {
      console.error("[Background] Patient summary PDF error:", error);
      await sendTextMessage(
        args.phoneNumber,
        "Sorry, I couldn't generate the patient summary PDF. Please try again."
      );
    }
  },
});
