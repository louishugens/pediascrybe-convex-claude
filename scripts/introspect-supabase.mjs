// Read-only introspection of the source Supabase Postgres.
// Lists tables (public + auth.users), columns, and row counts. No PHI rows are read.
import dotenv from "dotenv";
import pg from "pg";
dotenv.config({ path: ".env.local" });

const url = process.env.KIT_DATABASE_URL;
if (!url) { console.error("KIT_DATABASE_URL missing"); process.exit(1); }

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

const q = (text, params) => client.query(text, params).then((r) => r.rows);

const main = async () => {
  await client.connect();

  // tables in public + auth schemas
  const tables = await q(`
    select table_schema, table_name
    from information_schema.tables
    where table_schema in ('public','auth')
      and table_type = 'BASE TABLE'
    order by table_schema, table_name`);

  console.log("=== TABLES (schema.table : rowcount) ===");
  for (const t of tables) {
    let count = "?";
    try {
      const r = await q(`select count(*)::int as c from "${t.table_schema}"."${t.table_name}"`);
      count = r[0].c;
    } catch (e) { count = "ERR:" + e.code; }
    console.log(`${t.table_schema}.${t.table_name} : ${count}`);
  }

  // columns for every public table + auth.users
  const cols = await q(`
    select table_schema, table_name, column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public'
       or (table_schema = 'auth' and table_name = 'users')
    order by table_schema, table_name, ordinal_position`);

  console.log("\n=== COLUMNS ===");
  let cur = "";
  for (const c of cols) {
    const key = `${c.table_schema}.${c.table_name}`;
    if (key !== cur) { cur = key; console.log(`\n## ${key}`); }
    const nn = c.is_nullable === "NO" ? " NOT NULL" : "";
    const def = c.column_default ? `  default=${String(c.column_default).slice(0, 40)}` : "";
    console.log(`  ${c.column_name} : ${c.data_type}${nn}${def}`);
  }

  await client.end();
};

main().catch((e) => { console.error("FATAL", e.message); process.exit(1); });
