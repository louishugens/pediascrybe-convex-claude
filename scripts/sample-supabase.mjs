// Read-only structural sampling to build the field mapping. Minimal rows.
import dotenv from "dotenv";
import pg from "pg";
dotenv.config({ path: ".env.local" });

const client = new pg.Client({ connectionString: process.env.KIT_DATABASE_URL, ssl: { rejectUnauthorized: false } });
const q = (t, p) => client.query(t, p).then((r) => r.rows);
const show = (label, rows) => { console.log(`\n## ${label}`); console.log(JSON.stringify(rows, null, 2)); };

const main = async () => {
  await client.connect();

  // --- doctor <-> auth.users join ---
  const joinByEmail = await q(`select count(*)::int c from "Doctor" d join auth.users u on lower(u.email)=lower(d.email)`);
  const joinById = await q(`select count(*)::int c from "Doctor" d join auth.users u on u.id::text = d.id`);
  console.log(`Doctor↔auth.users by email: ${joinByEmail[0].c}/6 ;  by id: ${joinById[0].c}/6`);

  // auth.users meta shape (keys + role only, avoid dumping all PII)
  show("auth.users (id, email, role-ish, meta keys)", await q(`
    select id, email,
           raw_user_meta_data->>'role' as meta_role,
           raw_app_meta_data->>'role' as app_role,
           (select array_agg(k) from jsonb_object_keys(coalesce(raw_user_meta_data,'{}'::jsonb)) k) as meta_keys,
           encrypted_password is not null as has_pw,
           left(encrypted_password, 4) as pw_prefix,
           email_confirmed_at is not null as confirmed
    from auth.users order by created_at limit 6`));

  // enums
  show("distinct Patient.sex", await q(`select distinct sex from "Patient"`));
  show("distinct Appointment.status", await q(`select distinct status from "Appointment"`));
  show("distinct File.fileType", await q(`select distinct "fileType" from "File"`));
  show("distinct Report.reportType", await q(`select distinct "reportType" from "Report"`));
  show("distinct Dose.doseType", await q(`select distinct "doseType" from "Dose"`));
  show("distinct Service.type", await q(`select distinct type from "Service"`));

  // jsonb shapes
  show("Doctor.availability sample", await q(`select availability from "Doctor" where availability is not null limit 2`));
  show("Appointment.medication sample", await q(`select id, medication from "Appointment" where medication is not null and jsonb_array_length(medication) > 0 limit 2`));
  show("Appointment.exams sample", await q(`select id, exams from "Appointment" where exams is not null and jsonb_array_length(exams) > 0 limit 2`));
  show("Appointment.files sample", await q(`select id, files from "Appointment" where files is not null and array_length(files,1) > 0 limit 2`));
  show("Receipt.services sample", await q(`select services from "Receipt" where services is not null limit 2`));

  // how many appts have embedded meds/exams (to size the split)
  show("appt embedded counts", await q(`
    select
      count(*) filter (where medication is not null and jsonb_array_length(medication) > 0) as with_meds,
      count(*) filter (where exams is not null and jsonb_array_length(exams) > 0) as with_exams,
      count(*) filter (where files is not null and array_length(files,1) > 0) as with_files
    from "Appointment"`));

  await client.end();
};
main().catch((e) => { console.error("FATAL", e.message); process.exit(1); });
