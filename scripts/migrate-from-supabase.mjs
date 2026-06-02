/**
 * Supabase (Prisma + GoTrue) -> Convex data migration runner.
 *
 * Reads from KIT_DATABASE_URL (read-only) and calls the token-guarded
 * `api.migration.*` public mutations on the chosen Convex deployment.
 *
 * Usage:
 *   node scripts/migrate-from-supabase.mjs --target dev --doctor-email you@x.com   # test subset
 *   node scripts/migrate-from-supabase.mjs --target dev                            # full dev import
 *   node scripts/migrate-from-supabase.mjs --target prod                           # full prod import
 *
 * Requires in .env.local: KIT_DATABASE_URL, MIGRATION_TOKEN, CONVEX_DEPLOY_KEY (dev),
 * CONVEX_DEPLOY_KEY_Prod (prod). The same MIGRATION_TOKEN must be set on the Convex
 * deployment (npx convex env set MIGRATION_TOKEN ...).
 */
import dotenv from "dotenv";
import pg from "pg";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
dotenv.config({ path: ".env.local" });

// ---- args ----
const argv = process.argv.slice(2);
const flag = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };
const TARGET = flag("target") ?? "dev";
const DOCTOR_EMAIL = flag("doctor-email");           // optional test subset
const DRY = argv.includes("--dry-run");

const TOKEN = process.env.MIGRATION_TOKEN;
if (!TOKEN) throw new Error("MIGRATION_TOKEN missing in .env.local");
const deployKey = TARGET === "prod" ? process.env.CONVEX_DEPLOY_KEY_Prod : process.env.CONVEX_DEPLOY_KEY;
if (!deployKey) throw new Error(`Missing deploy key for target ${TARGET}`);
const convexUrl = `https://${deployKey.split("|")[0].split(":")[1]}.convex.cloud`;

const pgc = new pg.Client({ connectionString: process.env.KIT_DATABASE_URL, ssl: { rejectUnauthorized: false } });
const convex = new ConvexHttpClient(convexUrl);
const q = (t, p) => pgc.query(t, p).then((r) => r.rows);

// chunk an array
const chunk = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };
const num = (x) => (x === null || x === undefined ? undefined : Number(x));

// doctor-filter SQL fragments (empty when no subset)
let DID = null; // legacy doctor id for subset
const wDoctor = (col = `"doctorId"`) => (DID ? `where ${col} = '${DID}'` : "");
const wPatientOfDoctor = (col = `"patientId"`) =>
  DID ? `where ${col} in (select id from "Patient" where "doctorId" = '${DID}')` : "";

async function runBatches(label, rows, fn, size) {
  if (DRY) { console.log(`  [dry] ${label}: ${rows.length} rows`); return; }
  let agg = {};
  for (const part of chunk(rows, size)) {
    const res = await fn(part);
    for (const k of Object.keys(res || {})) agg[k] = (agg[k] || 0) + (typeof res[k] === "number" ? res[k] : 0);
  }
  console.log(`  ${label}: ${JSON.stringify(agg)} (${rows.length} input rows)`);
}

async function main() {
  await pgc.connect();
  console.log(`Migrating  source=KIT_DATABASE_URL  ->  ${TARGET} (${convexUrl})${DOCTOR_EMAIL ? `  [subset doctor=${DOCTOR_EMAIL}]` : "  [FULL]"}`);

  if (DOCTOR_EMAIL) {
    const d = await q(`select id from "Doctor" where lower(email)=lower($1)`, [DOCTOR_EMAIL]);
    if (!d.length) throw new Error(`No Doctor with email ${DOCTOR_EMAIL}`);
    DID = d[0].id;
  }

  // 1) DOCTORS (+auth). Always import all 6 so every account can log in.
  const doctors = await q(`
    select d.id, d.email, d.firstname, d.lastname, d.phone, d.address, d.spec, d.title, d.summary,
           d.experience, d.cost, d.duration, d.availability,
           d."isActive", d."isCompleted", d."isDoctor", d."isMedPro",
           (extract(epoch from d."createdAt")*1000)::bigint as created,
           (extract(epoch from d."updatedAt")*1000)::bigint as updated,
           u.encrypted_password as hash
    from "Doctor" d join auth.users u on lower(u.email)=lower(d.email)`);
  const okAvail = (a) => Array.isArray(a) && a.length > 0 && a.every((x) => x && "day" in x && "startTime" in x && "endTime" in x);
  await runBatches("doctors", doctors.map((d) => ({
    legacyId: d.id, email: d.email, firstname: d.firstname, lastname: d.lastname,
    bcryptHash: d.hash, emailVerified: true,
    phone: d.phone ?? undefined, address: d.address ?? undefined, spec: d.spec ?? undefined,
    title: d.title ?? undefined, summary: d.summary ?? undefined,
    experience: num(d.experience), cost: num(d.cost), duration: num(d.duration),
    availability: okAvail(d.availability) ? d.availability : undefined,
    isActive: d.isActive, isCompleted: d.isCompleted, isDoctor: d.isDoctor, isMedPro: d.isMedPro,
    createdAt: num(d.created), updatedAt: num(d.updated),
  })), (rows) => convex.mutation(api.migration.importDoctors, { token: TOKEN, rows }), 1);

  // 2) SERVICES
  const services = await q(`
    select id, "doctorId", name, price, currency, type,
           (extract(epoch from "createdAt")*1000)::bigint created,
           (extract(epoch from "updatedAt")*1000)::bigint updated
    from "Service" ${wDoctor()}`);
  await runBatches("services", services.filter((s) => s.doctorId).map((s) => ({
    legacyId: s.id, legacyDoctorId: s.doctorId, name: s.name, price: num(s.price), currency: s.currency,
    type: s.type, createdAt: num(s.created), updatedAt: num(s.updated),
  })), (rows) => convex.mutation(api.migration.importServices, { token: TOKEN, rows }), 200);

  // 3) VACCINS + DOSES
  const vaccins = await q(`select id, "doctorId", name from "Vaccin" ${wDoctor()}`);
  await runBatches("vaccins", vaccins.filter((x) => x.doctorId).map((x) => ({
    legacyId: x.id, legacyDoctorId: x.doctorId, name: x.name,
  })), (rows) => convex.mutation(api.migration.importVaccins, { token: TOKEN, rows }), 200);

  const vaccinFilter = DID ? `where "vaccinId" in (select id from "Vaccin" where "doctorId"='${DID}')` : "";
  const doses = await q(`select id, "vaccinId", "doseType", "doseCount", "maxAge" from "Dose" ${vaccinFilter}`);
  await runBatches("doses", doses.filter((x) => x.vaccinId).map((x) => ({
    legacyId: x.id, legacyVaccinId: x.vaccinId, doseType: x.doseType,
    doseCount: num(x.doseCount), maxAge: num(x.maxAge),
  })), (rows) => convex.mutation(api.migration.importDoses, { token: TOKEN, rows }), 200);

  // 4) PATIENTS
  const patients = await q(`
    select id, "doctorId", firstname, lastname, email, phone,
           (extract(epoch from birthdate)*1000)::bigint birthdate, sex, mothername, profession, religion,
           children, allergies, history, bloodtype, electrophoresis, "isCompleted",
           (extract(epoch from "createdAt")*1000)::bigint created,
           (extract(epoch from "updatedAt")*1000)::bigint updated
    from "Patient" ${wDoctor()}`);
  await runBatches("patients", patients.filter((p) => p.doctorId).map((p) => ({
    legacyId: p.id, legacyDoctorId: p.doctorId, firstname: p.firstname, lastname: p.lastname,
    email: p.email ?? undefined, phone: p.phone ?? undefined, birthdate: num(p.birthdate),
    sex: p.sex ?? undefined, mothername: p.mothername ?? undefined, profession: p.profession ?? undefined,
    religion: p.religion ?? undefined, children: num(p.children), allergies: p.allergies ?? undefined,
    history: p.history ?? undefined, bloodtype: p.bloodtype ?? undefined, electrophoresis: p.electrophoresis ?? undefined,
    isCompleted: p.isCompleted, createdAt: num(p.created), updatedAt: num(p.updated),
  })), (rows) => convex.mutation(api.migration.importPatients, { token: TOKEN, rows }), 200);

  // 5) APPOINTMENTS (+ split meds/exams)
  const appts = await q(`
    select id, "doctorId", "patientId", "serviceId",
           (extract(epoch from "startDate")*1000)::bigint startd,
           (extract(epoch from "endDate")*1000)::bigint endd,
           status, cost, motif, findings, recommendation, "otherRemarks",
           height, weight, head, arm, thorax, sao2, temperature, pulse, respiratory, systolic, diastolic,
           "transactionId", (extract(epoch from "transactionDate")*1000)::bigint txnd,
           medication, exams
    from "Appointment" ${wDoctor()}`);
  const mapMeds = (m) => Array.isArray(m) ? m.filter((x) => x && x.drug).map((x) => ({
    drug: String(x.drug), count: num(x.count) ?? 0, unit: String(x.unit ?? ""), posology: String(x.posology ?? ""),
  })) : [];
  const mapExams = (e) => Array.isArray(e) ? e.filter((x) => x && x.exam).map((x) => ({ examName: String(x.exam) })) : [];
  await runBatches("appointments", appts.filter((a) => a.doctorId && a.patientId).map((a) => ({
    legacyId: a.id, legacyDoctorId: a.doctorId, legacyPatientId: a.patientId,
    legacyServiceId: a.serviceId ?? undefined,
    startDate: num(a.startd), endDate: num(a.endd), status: a.status ?? undefined, cost: num(a.cost),
    motif: a.motif ?? undefined, findings: a.findings ?? undefined, recommendation: a.recommendation ?? undefined,
    otherRemarks: a.otherRemarks ?? undefined,
    height: num(a.height), weight: num(a.weight), head: num(a.head), arm: num(a.arm), thorax: num(a.thorax),
    sao2: num(a.sao2), temperature: num(a.temperature), pulse: num(a.pulse), respiratory: num(a.respiratory),
    systolic: num(a.systolic), diastolic: num(a.diastolic),
    transactionId: a.transactionId ?? undefined, transactionDate: num(a.txnd),
    meds: mapMeds(a.medication), exams: mapExams(a.exams),
  })), (rows) => convex.mutation(api.migration.importAppointments, { token: TOKEN, rows }), 50);

  // 6) FILES (link to appointment)
  const fileFilter = DID ? `where "appointmentId" in (select id from "Appointment" where "doctorId"='${DID}')` : "";
  const files = await q(`select id, "appointmentId", url, name, "fileType" from "File" ${fileFilter}`);
  await runBatches("files", files.map((f) => ({
    legacyId: f.id, legacyAppointmentId: f.appointmentId, url: f.url, name: f.name, fileType: f.fileType,
  })), (rows) => convex.mutation(api.migration.importFiles, { token: TOKEN, rows }), 200);

  // 7) VACCINATION RECORDS
  const vrFilter = DID ? wPatientOfDoctor() : "";
  const vrecs = await q(`
    select id, "patientId", "vaccinId", "doseId",
           (extract(epoch from date)*1000)::bigint dt, notes, manufacturer, "lotNumber",
           (extract(epoch from expiration)*1000)::bigint exp, dosage, route, site
    from "VaccinationRecord" ${vrFilter}`);
  await runBatches("vaccinationRecords", vrecs.map((r) => ({
    legacyId: r.id, legacyPatientId: r.patientId, legacyVaccinId: r.vaccinId, legacyDoseId: r.doseId,
    date: num(r.dt), notes: r.notes ?? undefined, manufacturer: r.manufacturer, lotNumber: r.lotNumber,
    expiration: num(r.exp), dosage: r.dosage, route: r.route, site: r.site,
  })), (rows) => convex.mutation(api.migration.importVaccinationRecords, { token: TOKEN, rows }), 200);

  // 8) REPORTS
  const reports = await q(`
    select id, "patientId", "reportType", content, (extract(epoch from "createdAt")*1000)::bigint created
    from "Report" ${wPatientOfDoctor()}`);
  await runBatches("reports", reports.filter((r) => r.patientId).map((r) => ({
    legacyId: r.id, legacyPatientId: r.patientId, reportType: r.reportType, content: r.content, createdAt: num(r.created),
  })), (rows) => convex.mutation(api.migration.importReports, { token: TOKEN, rows }), 200);

  // 9) RECEIPTS
  const receipts = await q(`
    select id, "patientId", services, cost, currency,
           (extract(epoch from date)*1000)::bigint dt, (extract(epoch from "createdAt")*1000)::bigint created
    from "Receipt" ${wPatientOfDoctor()}`);
  const mapRcptServices = (s) => Array.isArray(s) ? s.map((x) => ({
    service: String(x.service ?? ""), name: x.name != null ? String(x.name) : undefined,
    quantity: num(x.quantity), price: num(x.price),
  })) : undefined;
  await runBatches("receipts", receipts.filter((r) => r.patientId).map((r) => ({
    legacyId: r.id, legacyPatientId: r.patientId, services: mapRcptServices(r.services),
    cost: num(r.cost), currency: r.currency ?? undefined, date: num(r.dt), createdAt: num(r.created),
  })), (rows) => convex.mutation(api.migration.importReceipts, { token: TOKEN, rows }), 200);

  await pgc.end();
  console.log("\nDone.");
}
main().catch((e) => { console.error("FATAL", e); process.exit(1); });
