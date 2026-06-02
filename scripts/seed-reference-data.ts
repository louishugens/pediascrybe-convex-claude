/**
 * Seed global reference data (WHO growth charts + vaccine schedule) into BOTH
 * the dev and prod Convex deployments in one pass.
 *
 * Source: a `npx convex export` snapshot taken from the OLD Convex project that
 * still has the data. Unzip it; this script reads the per-table JSONL files:
 *   <EXPORT_DIR>/charts/documents.jsonl
 *   <EXPORT_DIR>/vaccinReferences/documents.jsonl
 *   <EXPORT_DIR>/vaccinReferenceDoses/documents.jsonl
 *
 * Targets (URL derived from each deploy key's deployment name):
 *   dev  ← CONVEX_DEPLOY_KEY        (dev:knowing-partridge-62|...)
 *   prod ← CONVEX_DEPLOY_KEY_Prod   (prod:doting-dogfish-499|...)
 *
 * FK-safe: re-seeds through the idempotent `seedChart` / `seedVaccinReference`
 * mutations, which rebuild the vaccinReferences→doses link under fresh Convex
 * _ids — so cross-deployment _id differences don't matter.
 *
 * Usage:
 *   npx tsx scripts/seed-reference-data.ts --export ./reference-export
 *   npx tsx scripts/seed-reference-data.ts --export ./reference-export --only dev
 *   npx tsx scripts/seed-reference-data.ts --export ./reference-export --dry-run
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

dotenv.config({ path: ".env.local" });

// ---- args -------------------------------------------------------------
const argv = process.argv.slice(2);
const getFlag = (name: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const EXPORT_DIR = getFlag("export") ?? process.env.EXPORT_DIR ?? "./reference-export";
const ONLY = getFlag("only"); // "dev" | "prod" | undefined (=both)
const DRY = argv.includes("--dry-run");

// ---- targets ----------------------------------------------------------
type Target = { name: "dev" | "prod"; url: string; key: string };

function urlFromDeployKey(key: string): string {
  // key format: "<env>:<deployment-name>|<secret>"
  const name = key.split("|")[0].split(":")[1];
  if (!name) throw new Error(`Cannot parse deployment name from deploy key`);
  return `https://${name}.convex.cloud`;
}

function buildTargets(): Target[] {
  const out: Target[] = [];
  const dev = process.env.CONVEX_DEPLOY_KEY;
  const prod = process.env.CONVEX_DEPLOY_KEY_Prod;
  if ((!ONLY || ONLY === "dev") && dev) out.push({ name: "dev", url: urlFromDeployKey(dev), key: dev });
  if ((!ONLY || ONLY === "prod") && prod) out.push({ name: "prod", url: urlFromDeployKey(prod), key: prod });
  if (out.length === 0) throw new Error("No deploy keys found (CONVEX_DEPLOY_KEY / CONVEX_DEPLOY_KEY_Prod)");
  return out;
}

// ---- source loading ---------------------------------------------------
function readJsonl(table: string): any[] {
  const path = join(EXPORT_DIR, table, "documents.jsonl");
  const raw = readFileSync(path, "utf8");
  return raw.split("\n").filter((l) => l.trim().length > 0).map((l) => JSON.parse(l));
}

type ChartArgs = {
  chartId: string;
  p03: number[]; p15: number[]; p50: number[]; p85: number[]; p97: number[];
  height?: number[];
};
type VaccineArgs = {
  name: string;
  doses: { doseType: "regular" | "annual" | "booster" | "unique"; doseCount?: number; maxAge?: number }[];
};

function loadCharts(): ChartArgs[] {
  return readJsonl("charts").map((c) => ({
    chartId: c.chartId,
    p03: c.p03, p15: c.p15, p50: c.p50, p85: c.p85, p97: c.p97,
    ...(c.height ? { height: c.height } : {}),
  }));
}

function loadVaccines(): VaccineArgs[] {
  const refs = readJsonl("vaccinReferences"); // { _id, name }
  const doses = readJsonl("vaccinReferenceDoses"); // { vaccinReferenceId, doseType, doseCount?, maxAge? }
  const byRef = new Map<string, VaccineArgs["doses"]>();
  for (const d of doses) {
    const list = byRef.get(d.vaccinReferenceId) ?? [];
    list.push({ doseType: d.doseType, ...(d.doseCount != null ? { doseCount: d.doseCount } : {}), ...(d.maxAge != null ? { maxAge: d.maxAge } : {}) });
    byRef.set(d.vaccinReferenceId, list);
  }
  return refs.map((r) => ({ name: r.name, doses: byRef.get(r._id) ?? [] }));
}

// ---- run --------------------------------------------------------------
async function seedTarget(t: Target, charts: ChartArgs[], vaccines: VaccineArgs[]) {
  const client = new ConvexHttpClient(t.url);
  // seed mutations are public; use admin auth if the client supports it (harmless either way)
  if (typeof (client as any).setAdminAuth === "function") {
    try { (client as any).setAdminAuth(t.key); } catch { /* public mutations don't require it */ }
  }

  console.log(`\n▸ ${t.name}  (${t.url})`);
  console.log(`  charts: ${charts.length} · vaccine refs: ${vaccines.length}${DRY ? "   [DRY RUN]" : ""}`);
  if (DRY) return;

  let c = 0;
  for (const chart of charts) {
    await client.mutation(api.seed.seedChart, chart);
    if (++c % 10 === 0) console.log(`    charts ${c}/${charts.length}`);
  }
  let v = 0;
  for (const vac of vaccines) {
    await client.mutation(api.seed.seedVaccinReference, vac);
    if (++v % 10 === 0) console.log(`    vaccines ${v}/${vaccines.length}`);
  }
  console.log(`  ✓ ${t.name}: seeded ${charts.length} charts + ${vaccines.length} vaccine refs`);
}

async function main() {
  const targets = buildTargets();
  const charts = loadCharts();
  const vaccines = loadVaccines();

  console.log(`Reference-data seed`);
  console.log(`  source : ${EXPORT_DIR}`);
  console.log(`  targets: ${targets.map((t) => t.name).join(" + ")}`);

  for (const t of targets) {
    await seedTarget(t, charts, vaccines);
  }
  console.log(`\nDone.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
