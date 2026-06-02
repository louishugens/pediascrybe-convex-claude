/**
 * One-time Supabase (Prisma + GoTrue) → Convex data import.
 *
 * Public mutations guarded by a token (process.env.MIGRATION_TOKEN). They are
 * idempotent per row via the `migrationMap` table (skip if the legacy id is
 * already imported), so the runner can be re-run safely.
 *
 * Auth: per the Better Auth Supabase migration guide, we insert the `user` and a
 * `credential` `account` (providerId "credential", accountId = userId, password =
 * the original bcrypt hash) directly into the Better Auth component, then create
 * the app-level `appUsers` + `doctors` rows ourselves (no onCreate trigger — fully
 * deterministic). Delete this file + the migrationMap table after cutover.
 */
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ---- guard ------------------------------------------------------------
function assertToken(token: string) {
  const expected = process.env.MIGRATION_TOKEN;
  if (!expected || token !== expected) {
    throw new Error("Migration not authorized (bad or missing MIGRATION_TOKEN).");
  }
}

// ---- migrationMap helpers --------------------------------------------
async function getMapped(ctx: MutationCtx, entity: string, legacyId: string) {
  const row = await ctx.db
    .query("migrationMap")
    .withIndex("by_entity_legacy", (q) => q.eq("entity", entity).eq("legacyId", legacyId))
    .first();
  return row?.convexId as string | undefined;
}
async function putMapped(ctx: MutationCtx, entity: string, legacyId: string, convexId: string) {
  await ctx.db.insert("migrationMap", { entity, legacyId, convexId });
}
// Returns the mapped convexId, or undefined if the parent wasn't imported (dangling
// FK in the source, or excluded by a subset filter). Callers skip such rows.

// ============================ VERIFY (read-only) ============================
export const verifyMigration = query({
  args: { token: v.string(), email: v.string() },
  handler: async (ctx, { token, email }) => {
    assertToken(token);
    const user: any = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: "user", where: [{ field: "email", value: email }],
    });
    let acct: any = null;
    if (user) {
      acct = await ctx.runQuery(components.betterAuth.adapter.findOne, {
        model: "account",
        where: [{ field: "userId", value: String(user._id ?? user.id) }, { field: "providerId", value: "credential" }],
      });
    }
    const doctor = user
      ? await ctx.db.query("doctors").withIndex("by_authUserId", (q) => q.eq("authUserId", String(user._id ?? user.id))).first()
      : null;
    const patients = doctor
      ? (await ctx.db.query("patients").withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id)).collect()).length
      : 0;
    return {
      userFound: !!user,
      emailVerified: user?.emailVerified ?? null,
      role: user?.role ?? null,
      accountFound: !!acct,
      hashPrefix: acct?.password ? String(acct.password).slice(0, 4) : null,
      doctorFound: !!doctor,
      doctorName: doctor ? `${doctor.firstname} ${doctor.lastname}` : null,
      patientsForDoctor: patients,
      totals: {
        doctors: (await ctx.db.query("doctors").collect()).length,
        patients: (await ctx.db.query("patients").collect()).length,
        appointments: (await ctx.db.query("appointments").collect()).length,
        prescriptions: (await ctx.db.query("prescriptions").collect()).length,
        labOrders: (await ctx.db.query("labOrders").collect()).length,
        reports: (await ctx.db.query("reports").collect()).length,
        receipts: (await ctx.db.query("receipts").collect()).length,
      },
    };
  },
});

// ============================ DOCTORS + AUTH ============================
const doctorRow = v.object({
  legacyId: v.string(),
  email: v.string(),
  firstname: v.string(),
  lastname: v.string(),
  bcryptHash: v.string(),
  emailVerified: v.boolean(),
  phone: v.optional(v.string()),
  address: v.optional(v.string()),
  spec: v.optional(v.string()),
  title: v.optional(v.string()),
  summary: v.optional(v.string()),
  experience: v.optional(v.number()),
  cost: v.optional(v.number()),
  duration: v.optional(v.number()),
  availability: v.optional(v.array(v.object({ day: v.number(), startTime: v.string(), endTime: v.string() }))),
  isActive: v.boolean(),
  isCompleted: v.boolean(),
  isDoctor: v.boolean(),
  isMedPro: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const importDoctors = mutation({
  args: { token: v.string(), rows: v.array(doctorRow) },
  handler: async (ctx, { token, rows }) => {
    assertToken(token);
    const out: { legacyId: string; userId: string; doctorId: string; skipped: boolean }[] = [];
    for (const r of rows) {
      const mapped = await getMapped(ctx, "Doctor", r.legacyId);
      if (mapped) { out.push({ legacyId: r.legacyId, userId: "", doctorId: mapped, skipped: true }); continue; }

      const now = Date.now();
      const name = `${r.firstname} ${r.lastname}`.trim() || r.email;

      // 1) Better Auth user — find-or-create. IMPORTANT: component writes commit
      // independently and are NOT rolled back when Convex retries this mutation, so
      // every step must be idempotent (reuse if it already exists).
      const findUser = (): Promise<any> => ctx.runQuery(components.betterAuth.adapter.findOne, {
        model: "user", where: [{ field: "email", value: r.email }],
      });
      let userDoc: any = await findUser();
      if (!userDoc) {
        await ctx.runMutation(components.betterAuth.adapter.create, {
          input: { model: "user", data: {
            email: r.email, name, emailVerified: r.emailVerified, role: "doctor",
            firstName: r.firstname, lastName: r.lastname, createdAt: now, updatedAt: now,
          } },
        });
        userDoc = await findUser();
      }
      const userId = String(userDoc?._id ?? userDoc?.id);
      if (!userId || userId === "undefined") throw new Error(`User upsert failed for ${r.email}`);

      // 2) credential account with the original bcrypt hash — find-or-create
      const acct: any = await ctx.runQuery(components.betterAuth.adapter.findOne, {
        model: "account",
        where: [{ field: "userId", value: userId }, { field: "providerId", value: "credential" }],
      });
      if (!acct) {
        await ctx.runMutation(components.betterAuth.adapter.create, {
          input: { model: "account", data: {
            userId, accountId: userId, providerId: "credential",
            password: r.bcryptHash, createdAt: now, updatedAt: now,
          } },
        });
      }

      // 3) appUsers — find-or-insert
      const existingAppUser = await ctx.db
        .query("appUsers").withIndex("by_authUserId", (q) => q.eq("authUserId", userId)).first();
      if (!existingAppUser) {
        await ctx.db.insert("appUsers", {
          authUserId: userId, email: r.email, role: "doctor", plan: "free",
          firstName: r.firstname, lastName: r.lastname, displayName: name,
        });
      }

      // 4) doctors — find-or-insert
      const existingDoctor = await ctx.db
        .query("doctors").withIndex("by_authUserId", (q) => q.eq("authUserId", userId)).first();
      const doctorId = existingDoctor?._id ?? await ctx.db.insert("doctors", {
        authUserId: userId, email: r.email, firstname: r.firstname, lastname: r.lastname,
        phone: r.phone, address: r.address, spec: r.spec, title: r.title, summary: r.summary,
        experience: r.experience, cost: r.cost, duration: r.duration,
        availability: r.availability && r.availability.length ? r.availability : undefined,
        isActive: r.isActive, isCompleted: r.isCompleted, isDoctor: r.isDoctor, isMedPro: r.isMedPro,
        createdAt: r.createdAt, updatedAt: r.updatedAt,
      });
      await putMapped(ctx, "Doctor", r.legacyId, doctorId as string);
      out.push({ legacyId: r.legacyId, userId, doctorId: doctorId as string, skipped: false });
    }
    return { inserted: out.filter((o) => !o.skipped).length, skipped: out.filter((o) => o.skipped).length };
  },
});

// ============================ PATIENTS ============================
export const importPatients = mutation({
  args: {
    token: v.string(),
    rows: v.array(v.object({
      legacyId: v.string(),
      legacyDoctorId: v.string(),
      firstname: v.string(),
      lastname: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      birthdate: v.number(),
      sex: v.optional(v.union(v.literal("male"), v.literal("female"))),
      mothername: v.optional(v.string()),
      profession: v.optional(v.string()),
      religion: v.optional(v.string()),
      children: v.optional(v.number()),
      allergies: v.optional(v.string()),
      history: v.optional(v.string()),
      bloodtype: v.optional(v.string()),
      electrophoresis: v.optional(v.string()),
      isCompleted: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
  },
  handler: async (ctx, { token, rows }) => {
    assertToken(token);
    let inserted = 0, skipped = 0, orphaned = 0;
    for (const r of rows) {
      if (await getMapped(ctx, "Patient", r.legacyId)) { skipped++; continue; }
      const doctorId = (await getMapped(ctx, "Doctor", r.legacyDoctorId)) as Id<"doctors"> | undefined;
      if (!doctorId) { orphaned++; continue; }
      const id = await ctx.db.insert("patients", {
        doctorId,
        firstname: r.firstname,
        lastname: r.lastname,
        email: r.email,
        phone: r.phone,
        birthdate: r.birthdate,
        sex: r.sex,
        mothername: r.mothername,
        profession: r.profession,
        religion: r.religion,
        children: r.children,
        allergies: r.allergies,
        history: r.history,
        bloodtype: r.bloodtype,
        electrophoresis: r.electrophoresis,
        isCompleted: r.isCompleted,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      });
      await putMapped(ctx, "Patient", r.legacyId, id);
      inserted++;
    }
    return { inserted, skipped, orphaned };
  },
});

// ============================ SERVICES ============================
export const importServices = mutation({
  args: {
    token: v.string(),
    rows: v.array(v.object({
      legacyId: v.string(),
      legacyDoctorId: v.string(),
      name: v.string(),
      price: v.number(),
      currency: v.string(),
      type: v.union(v.literal("clinical"), v.literal("documentation")),
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
  },
  handler: async (ctx, { token, rows }) => {
    assertToken(token);
    let inserted = 0, skipped = 0, orphaned = 0;
    for (const r of rows) {
      if (await getMapped(ctx, "Service", r.legacyId)) { skipped++; continue; }
      const doctorId = (await getMapped(ctx, "Doctor", r.legacyDoctorId)) as Id<"doctors"> | undefined;
      if (!doctorId) { orphaned++; continue; }
      const id = await ctx.db.insert("services", {
        doctorId, name: r.name, price: r.price, currency: r.currency, type: r.type,
        createdAt: r.createdAt, updatedAt: r.updatedAt,
      });
      await putMapped(ctx, "Service", r.legacyId, id);
      inserted++;
    }
    return { inserted, skipped, orphaned };
  },
});

// ============================ VACCINS + DOSES ============================
export const importVaccins = mutation({
  args: { token: v.string(), rows: v.array(v.object({ legacyId: v.string(), legacyDoctorId: v.string(), name: v.string() })) },
  handler: async (ctx, { token, rows }) => {
    assertToken(token);
    let inserted = 0, skipped = 0, orphaned = 0;
    for (const r of rows) {
      if (await getMapped(ctx, "Vaccin", r.legacyId)) { skipped++; continue; }
      const doctorId = (await getMapped(ctx, "Doctor", r.legacyDoctorId)) as Id<"doctors"> | undefined;
      if (!doctorId) { orphaned++; continue; }
      const id = await ctx.db.insert("vaccins", { doctorId, name: r.name });
      await putMapped(ctx, "Vaccin", r.legacyId, id);
      inserted++;
    }
    return { inserted, skipped, orphaned };
  },
});

export const importDoses = mutation({
  args: {
    token: v.string(),
    rows: v.array(v.object({
      legacyId: v.string(),
      legacyVaccinId: v.string(),
      doseType: v.union(v.literal("regular"), v.literal("annual"), v.literal("booster"), v.literal("unique")),
      doseCount: v.optional(v.number()),
      maxAge: v.optional(v.number()),
    })),
  },
  handler: async (ctx, { token, rows }) => {
    assertToken(token);
    let inserted = 0, skipped = 0, orphaned = 0;
    for (const r of rows) {
      if (await getMapped(ctx, "Dose", r.legacyId)) { skipped++; continue; }
      const vaccinId = (await getMapped(ctx, "Vaccin", r.legacyVaccinId)) as Id<"vaccins"> | undefined;
      if (!vaccinId) { orphaned++; continue; }
      const id = await ctx.db.insert("doses", { vaccinId, doseType: r.doseType, doseCount: r.doseCount, maxAge: r.maxAge });
      await putMapped(ctx, "Dose", r.legacyId, id);
      inserted++;
    }
    return { inserted, skipped, orphaned };
  },
});

// ============================ APPOINTMENTS (+split) ============================
export const importAppointments = mutation({
  args: {
    token: v.string(),
    rows: v.array(v.object({
      legacyId: v.string(),
      legacyDoctorId: v.string(),
      legacyPatientId: v.string(),
      legacyServiceId: v.optional(v.string()),
      startDate: v.number(),
      endDate: v.optional(v.number()),
      status: v.optional(v.union(v.literal("pending"), v.literal("paid"), v.literal("offline"))),
      cost: v.optional(v.number()),
      motif: v.optional(v.string()),
      findings: v.optional(v.string()),
      recommendation: v.optional(v.string()),
      otherRemarks: v.optional(v.string()),
      height: v.optional(v.number()), weight: v.optional(v.number()), head: v.optional(v.number()),
      arm: v.optional(v.number()), thorax: v.optional(v.number()), sao2: v.optional(v.number()),
      temperature: v.optional(v.number()), pulse: v.optional(v.number()), respiratory: v.optional(v.number()),
      systolic: v.optional(v.number()), diastolic: v.optional(v.number()),
      transactionId: v.optional(v.string()), transactionDate: v.optional(v.number()),
      meds: v.array(v.object({ drug: v.string(), count: v.number(), unit: v.string(), posology: v.string() })),
      exams: v.array(v.object({ examName: v.string() })),
    })),
  },
  handler: async (ctx, { token, rows }) => {
    assertToken(token);
    let inserted = 0, skipped = 0, orphaned = 0, presc = 0, labs = 0;
    for (const r of rows) {
      if (await getMapped(ctx, "Appointment", r.legacyId)) { skipped++; continue; }
      const doctorId = (await getMapped(ctx, "Doctor", r.legacyDoctorId)) as Id<"doctors"> | undefined;
      const patientId = (await getMapped(ctx, "Patient", r.legacyPatientId)) as Id<"patients"> | undefined;
      if (!doctorId || !patientId) { orphaned++; continue; }
      const serviceId = r.legacyServiceId
        ? ((await getMapped(ctx, "Service", r.legacyServiceId)) as Id<"services"> | undefined)
        : undefined;

      const apptId = await ctx.db.insert("appointments", {
        doctorId, patientId, serviceId,
        startDate: r.startDate, endDate: r.endDate, status: r.status, cost: r.cost,
        motif: r.motif, findings: r.findings, recommendation: r.recommendation, otherRemarks: r.otherRemarks,
        height: r.height, weight: r.weight, head: r.head, arm: r.arm, thorax: r.thorax, sao2: r.sao2,
        temperature: r.temperature, pulse: r.pulse, respiratory: r.respiratory, systolic: r.systolic, diastolic: r.diastolic,
        transactionId: r.transactionId, transactionDate: r.transactionDate,
      });
      await putMapped(ctx, "Appointment", r.legacyId, apptId);

      for (const m of r.meds) {
        await ctx.db.insert("prescriptions", {
          doctorId, patientId, appointmentId: apptId,
          drug: m.drug, count: m.count, unit: m.unit, posology: m.posology,
          status: "active", createdAt: r.startDate, updatedAt: r.startDate,
        });
        presc++;
      }
      for (const e of r.exams) {
        await ctx.db.insert("labOrders", {
          doctorId, patientId, appointmentId: apptId,
          examName: e.examName, status: "reviewed",
          orderedAt: r.startDate, createdAt: r.startDate, updatedAt: r.startDate,
        });
        labs++;
      }
      inserted++;
    }
    return { inserted, skipped, orphaned, prescriptions: presc, labOrders: labs };
  },
});

// ============================ FILES ============================
export const importFiles = mutation({
  args: {
    token: v.string(),
    rows: v.array(v.object({
      legacyId: v.string(),
      legacyAppointmentId: v.string(),
      url: v.string(),
      name: v.string(),
      fileType: v.union(v.literal("IMAGE"), v.literal("PDF"), v.literal("VIDEO")),
    })),
  },
  handler: async (ctx, { token, rows }) => {
    assertToken(token);
    let inserted = 0, skipped = 0, orphaned = 0;
    for (const r of rows) {
      if (await getMapped(ctx, "File", r.legacyId)) { skipped++; continue; }
      const appointmentId = (await getMapped(ctx, "Appointment", r.legacyAppointmentId)) as Id<"appointments"> | undefined;
      if (!appointmentId) { orphaned++; continue; }
      const id = await ctx.db.insert("files", { appointmentId, url: r.url, name: r.name, fileType: r.fileType });
      await putMapped(ctx, "File", r.legacyId, id);
      inserted++;
    }
    return { inserted, skipped, orphaned };
  },
});

// ============================ VACCINATION RECORDS ============================
export const importVaccinationRecords = mutation({
  args: {
    token: v.string(),
    rows: v.array(v.object({
      legacyId: v.string(),
      legacyPatientId: v.string(),
      legacyVaccinId: v.string(),
      legacyDoseId: v.string(),
      date: v.number(),
      notes: v.optional(v.string()),
      manufacturer: v.string(),
      lotNumber: v.string(),
      expiration: v.number(),
      dosage: v.string(),
      route: v.string(),
      site: v.string(),
    })),
  },
  handler: async (ctx, { token, rows }) => {
    assertToken(token);
    let inserted = 0, skipped = 0, orphaned = 0;
    for (const r of rows) {
      if (await getMapped(ctx, "VaccinationRecord", r.legacyId)) { skipped++; continue; }
      const patientId = (await getMapped(ctx, "Patient", r.legacyPatientId)) as Id<"patients"> | undefined;
      const vaccinId = (await getMapped(ctx, "Vaccin", r.legacyVaccinId)) as Id<"vaccins"> | undefined;
      const doseId = (await getMapped(ctx, "Dose", r.legacyDoseId)) as Id<"doses"> | undefined;
      if (!patientId || !vaccinId || !doseId) { orphaned++; continue; }
      const id = await ctx.db.insert("vaccinationRecords", {
        patientId, vaccinId, doseId, date: r.date, notes: r.notes,
        manufacturer: r.manufacturer, lotNumber: r.lotNumber, expiration: r.expiration,
        dosage: r.dosage, route: r.route, site: r.site,
      });
      await putMapped(ctx, "VaccinationRecord", r.legacyId, id);
      inserted++;
    }
    return { inserted, skipped, orphaned };
  },
});

// ============================ REPORTS ============================
export const importReports = mutation({
  args: {
    token: v.string(),
    rows: v.array(v.object({
      legacyId: v.string(),
      legacyPatientId: v.string(),
      reportType: v.union(v.literal("Report"), v.literal("Certificate"), v.literal("ReferenceNote")),
      content: v.string(),
      createdAt: v.number(),
    })),
  },
  handler: async (ctx, { token, rows }) => {
    assertToken(token);
    let inserted = 0, skipped = 0, orphaned = 0;
    for (const r of rows) {
      if (await getMapped(ctx, "Report", r.legacyId)) { skipped++; continue; }
      const patientId = (await getMapped(ctx, "Patient", r.legacyPatientId)) as Id<"patients"> | undefined;
      if (!patientId) { orphaned++; continue; }
      const id = await ctx.db.insert("reports", { patientId, reportType: r.reportType, content: r.content, createdAt: r.createdAt });
      await putMapped(ctx, "Report", r.legacyId, id);
      inserted++;
    }
    return { inserted, skipped, orphaned };
  },
});

// ============================ RECEIPTS ============================
export const importReceipts = mutation({
  args: {
    token: v.string(),
    rows: v.array(v.object({
      legacyId: v.string(),
      legacyPatientId: v.string(),
      services: v.optional(v.array(v.object({
        service: v.string(), name: v.optional(v.string()),
        quantity: v.optional(v.number()), price: v.optional(v.number()),
      }))),
      cost: v.optional(v.number()),
      currency: v.optional(v.string()),
      date: v.optional(v.number()),
      createdAt: v.number(),
    })),
  },
  handler: async (ctx, { token, rows }) => {
    assertToken(token);
    let inserted = 0, skipped = 0, orphaned = 0;
    for (const r of rows) {
      if (await getMapped(ctx, "Receipt", r.legacyId)) { skipped++; continue; }
      const patientId = (await getMapped(ctx, "Patient", r.legacyPatientId)) as Id<"patients"> | undefined;
      if (!patientId) { orphaned++; continue; }
      const id = await ctx.db.insert("receipts", {
        patientId, services: r.services, cost: r.cost, currency: r.currency, date: r.date, createdAt: r.createdAt,
      });
      await putMapped(ctx, "Receipt", r.legacyId, id);
      inserted++;
    }
    return { inserted, skipped, orphaned };
  },
});
