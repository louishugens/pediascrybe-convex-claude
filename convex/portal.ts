import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

// ==================== Authorization Helpers ====================

async function getAuthorizedPatientIds(ctx: QueryCtx | MutationCtx): Promise<Id<"patients">[]> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  // Verify user has patient role
  const appUser = await ctx.db
    .query("appUsers")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
    .first();

  if (!appUser || appUser.role !== "patient") {
    throw new Error("Not authorized — patient role required");
  }

  // Get all patient links for this user
  const patientAccounts = await ctx.db
    .query("patientAccounts")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
    .collect();

  return patientAccounts.map((pa) => pa.patientId);
}

async function verifyPatientAccess(ctx: QueryCtx | MutationCtx, patientId: Id<"patients">): Promise<void> {
  const authorizedIds = await getAuthorizedPatientIds(ctx);
  if (!authorizedIds.includes(patientId)) {
    throw new Error("Not authorized to access this patient");
  }
}

// ==================== Portal Queries ====================

// Get all children linked to the current parent
export const getMyPatients = query({
  args: {},
  handler: async (ctx) => {
    const patientIds = await getAuthorizedPatientIds(ctx);

    const patients = await Promise.all(
      patientIds.map(async (patientId) => {
        const patient = await ctx.db.get(patientId);
        if (!patient) return null;

        // Get doctor info for multi-doctor clarity
        const doctor = await ctx.db.get(patient.doctorId);

        // Get next upcoming appointment
        const appointments = await ctx.db
          .query("appointments")
          .withIndex("by_patientId_startDate", (q) => q.eq("patientId", patientId))
          .order("desc")
          .collect();

        const now = Date.now();
        const nextAppointment = appointments.find((a) => a.startDate > now);

        // Get vaccine compliance data for percentage
        const vaccins = await ctx.db
          .query("vaccins")
          .withIndex("by_doctorId", (q) => q.eq("doctorId", patient.doctorId))
          .collect();

        const records = await ctx.db
          .query("vaccinationRecords")
          .withIndex("by_patientId", (q) => q.eq("patientId", patientId))
          .collect();

        let totalDoses = 0;
        let completedDoses = 0;

        for (const vaccin of vaccins) {
          const doses = await ctx.db
            .query("doses")
            .withIndex("by_vaccinId", (q) => q.eq("vaccinId", vaccin._id))
            .collect();

          for (const dose of doses) {
            if (dose.doseType === "regular" && dose.doseCount) {
              totalDoses += dose.doseCount;
            } else {
              totalDoses += 1;
            }
          }
        }

        completedDoses = records.length;
        const compliancePercent = totalDoses > 0 ? Math.round((completedDoses / totalDoses) * 100) : 0;

        return {
          _id: patient._id,
          firstname: patient.firstname,
          lastname: patient.lastname,
          birthdate: patient.birthdate,
          sex: patient.sex,
          doctorName: doctor
            ? `${doctor.title ? doctor.title + " " : ""}${doctor.firstname} ${doctor.lastname}`
            : "Unknown",
          doctorSpec: doctor?.spec || null,
          nextAppointment: nextAppointment
            ? { _id: nextAppointment._id, startDate: nextAppointment.startDate, motif: nextAppointment.motif }
            : null,
          vaccineCompliancePercent: Math.min(compliancePercent, 100),
        };
      })
    );

    return patients.filter(Boolean);
  },
});

// Get details for a single child
export const getPatientDetails = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyPatientAccess(ctx, args.patientId);

    const patient = await ctx.db.get(args.patientId);
    if (!patient) throw new Error("Patient not found");

    return {
      _id: patient._id,
      firstname: patient.firstname,
      lastname: patient.lastname,
      birthdate: patient.birthdate,
      sex: patient.sex,
      bloodtype: patient.bloodtype,
      allergies: patient.allergies,
      history: patient.history,
      electrophoresis: patient.electrophoresis,
      mothername: patient.mothername,
      doctorId: patient.doctorId,
    };
  },
});

// Get all appointments for a child
export const getPatientAppointments = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyPatientAccess(ctx, args.patientId);

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patientId_startDate", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();

    // Return appointments without financial data
    return appointments.map((apt) => ({
      _id: apt._id,
      startDate: apt.startDate,
      endDate: apt.endDate,
      motif: apt.motif,
      findings: apt.findings,
      recommendation: apt.recommendation,
      otherRemarks: apt.otherRemarks,
      height: apt.height,
      weight: apt.weight,
      head: apt.head,
      arm: apt.arm,
      thorax: apt.thorax,
      sao2: apt.sao2,
      temperature: apt.temperature,
      pulse: apt.pulse,
      respiratory: apt.respiratory,
      systolic: apt.systolic,
      diastolic: apt.diastolic,
      exams: apt.exams,
      medication: apt.medication,
    }));
  },
});

// Get upcoming appointments
export const getUpcomingAppointments = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyPatientAccess(ctx, args.patientId);

    const now = Date.now();
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patientId_startDate", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();

    const upcoming = appointments
      .filter((a) => a.startDate > now)
      .sort((a, b) => a.startDate - b.startDate)
      .slice(0, 5);

    const patient = await ctx.db.get(args.patientId);
    if (!patient) return [];

    const doctor = await ctx.db.get(patient.doctorId);

    return upcoming.map((apt) => ({
      _id: apt._id,
      startDate: apt.startDate,
      motif: apt.motif,
      doctorName: doctor
        ? `${doctor.title ? doctor.title + " " : ""}${doctor.firstname} ${doctor.lastname}`
        : "Unknown",
    }));
  },
});

// Get a full appointment detail with files
export const getAppointmentDetail = query({
  args: {
    patientId: v.id("patients"),
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    await verifyPatientAccess(ctx, args.patientId);

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment || appointment.patientId !== args.patientId) {
      throw new Error("Appointment not found");
    }

    const files = await ctx.db
      .query("files")
      .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.appointmentId))
      .collect();

    // Return without financial data
    return {
      _id: appointment._id,
      startDate: appointment.startDate,
      endDate: appointment.endDate,
      motif: appointment.motif,
      findings: appointment.findings,
      recommendation: appointment.recommendation,
      otherRemarks: appointment.otherRemarks,
      height: appointment.height,
      weight: appointment.weight,
      head: appointment.head,
      arm: appointment.arm,
      thorax: appointment.thorax,
      sao2: appointment.sao2,
      temperature: appointment.temperature,
      pulse: appointment.pulse,
      respiratory: appointment.respiratory,
      systolic: appointment.systolic,
      diastolic: appointment.diastolic,
      exams: appointment.exams,
      medication: appointment.medication,
      files,
    };
  },
});

// Get patient vaccination records
export const getPatientVaccinations = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyPatientAccess(ctx, args.patientId);

    const records = await ctx.db
      .query("vaccinationRecords")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();

    const enrichedRecords = await Promise.all(
      records.map(async (record) => {
        const [vaccin, dose] = await Promise.all([
          ctx.db.get(record.vaccinId),
          ctx.db.get(record.doseId),
        ]);
        return { ...record, vaccin, dose };
      })
    );

    return enrichedRecords;
  },
});

// Get vaccine compliance data (reuses logic from vaccines.ts)
export const getPatientVaccineCompliance = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyPatientAccess(ctx, args.patientId);

    const patient = await ctx.db.get(args.patientId);
    if (!patient) throw new Error("Patient not found");

    const vaccins = await ctx.db
      .query("vaccins")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", patient.doctorId))
      .collect();

    const vaccinesWithDoses = await Promise.all(
      vaccins.map(async (vaccin) => {
        const doses = await ctx.db
          .query("doses")
          .withIndex("by_vaccinId", (q) => q.eq("vaccinId", vaccin._id))
          .collect();
        return { ...vaccin, doses };
      })
    );

    const records = await ctx.db
      .query("vaccinationRecords")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .collect();

    return {
      patient: {
        _id: patient._id,
        birthdate: patient.birthdate,
        firstname: patient.firstname,
        lastname: patient.lastname,
      },
      vaccines: vaccinesWithDoses,
      records,
    };
  },
});

// Get growth data from appointments
export const getPatientGrowthData = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyPatientAccess(ctx, args.patientId);

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patientId_startDate", (q) => q.eq("patientId", args.patientId))
      .order("asc")
      .collect();

    // Only return appointments that have at least one measurement
    return appointments
      .filter(
        (apt) =>
          apt.height !== undefined ||
          apt.weight !== undefined ||
          apt.head !== undefined
      )
      .map((apt) => ({
        _id: apt._id,
        startDate: apt.startDate,
        height: apt.height,
        weight: apt.weight,
        head: apt.head,
        arm: apt.arm,
        thorax: apt.thorax,
      }));
  },
});

// Get the patient's doctor info
export const getPatientDoctor = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyPatientAccess(ctx, args.patientId);

    const patient = await ctx.db.get(args.patientId);
    if (!patient) throw new Error("Patient not found");

    const doctor = await ctx.db.get(patient.doctorId);
    if (!doctor) throw new Error("Doctor not found");

    return {
      _id: doctor._id,
      firstname: doctor.firstname,
      lastname: doctor.lastname,
      title: doctor.title,
      spec: doctor.spec,
      phone: doctor.phone,
      address: doctor.address,
      email: doctor.email,
    };
  },
});

// Get parent-uploaded files for a patient
export const getPatientFiles = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyPatientAccess(ctx, args.patientId);

    return await ctx.db
      .query("patientFiles")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();
  },
});

// Get notifications for the current parent
export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const patientIds = await getAuthorizedPatientIds(ctx);

    const allNotifications: Array<{
      _id: Id<"portalNotifications">;
      _creationTime: number;
      patientId: Id<"patients">;
      type: "new_prescription" | "new_lab_exam" | "appointment_summary" | "new_vaccine_record" | "new_report";
      appointmentId?: Id<"appointments">;
      message: string;
      isRead: boolean;
      createdAt: number;
      patientName: string;
    }> = [];
    for (const patientId of patientIds) {
      const notifications = await ctx.db
        .query("portalNotifications")
        .withIndex("by_patientId", (q) => q.eq("patientId", patientId))
        .order("desc")
        .collect();

      // Enrich with patient name
      const patient = await ctx.db.get(patientId);
      for (const notif of notifications) {
        allNotifications.push({
          ...notif,
          patientName: patient ? `${patient.firstname} ${patient.lastname}` : "Unknown",
        });
      }
    }

    // Sort by createdAt desc
    allNotifications.sort((a, b) => b.createdAt - a.createdAt);
    return allNotifications;
  },
});

// Get unread notification count
export const getUnreadNotificationCount = query({
  args: {},
  handler: async (ctx) => {
    const patientIds = await getAuthorizedPatientIds(ctx);

    let count = 0;
    for (const patientId of patientIds) {
      const notifications = await ctx.db
        .query("portalNotifications")
        .withIndex("by_patientId", (q) => q.eq("patientId", patientId))
        .collect();
      count += notifications.filter((n) => !n.isRead).length;
    }

    return count;
  },
});

// ==================== Portal Mutations ====================

// Upload a file (store metadata after uploadthing upload)
export const uploadPatientFile = mutation({
  args: {
    patientId: v.id("patients"),
    url: v.string(),
    name: v.string(),
    fileType: v.union(v.literal("IMAGE"), v.literal("PDF")),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyPatientAccess(ctx, args.patientId);

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("patientFiles", {
      patientId: args.patientId,
      uploadedByAuthUserId: identity.subject,
      url: args.url,
      name: args.name,
      fileType: args.fileType,
      description: args.description,
      createdAt: Date.now(),
    });
  },
});

// Delete own uploaded file
export const deletePatientFile = mutation({
  args: { fileId: v.id("patientFiles") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.fileId);
    if (!file) throw new Error("File not found");

    // Verify ownership
    if (file.uploadedByAuthUserId !== identity.subject) {
      throw new Error("Not authorized to delete this file");
    }

    await verifyPatientAccess(ctx, file.patientId);
    await ctx.db.delete(args.fileId);
  },
});

// Mark a notification as read
export const markNotificationRead = mutation({
  args: { notificationId: v.id("portalNotifications") },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");

    await verifyPatientAccess(ctx, notification.patientId);
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

// Mark all notifications as read
export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const patientIds = await getAuthorizedPatientIds(ctx);

    for (const patientId of patientIds) {
      const notifications = await ctx.db
        .query("portalNotifications")
        .withIndex("by_patientId", (q) => q.eq("patientId", patientId))
        .collect();

      for (const notif of notifications) {
        if (!notif.isRead) {
          await ctx.db.patch(notif._id, { isRead: true });
        }
      }
    }
  },
});
