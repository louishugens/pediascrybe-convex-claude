/**
 * Script to migrate reference data from Supabase to Convex
 *
 * This script reads the following tables from Supabase:
 * - charts (growth chart reference data)
 * - VaccinReference (vaccine reference templates)
 * - VaccinReferenceDose (dose definitions for vaccine references)
 *
 * Usage:
 *   npx tsx scripts/migrate-reference-data.ts
 *
 * Required environment variables:
 *   - DATABASE_URL: Supabase PostgreSQL connection string
 *   - CONVEX_URL: Your Convex deployment URL (e.g., https://xxx.convex.cloud)
 */

import pg from "pg";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local (Next.js convention) or .env
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const { Client } = pg;

interface Chart {
  id: string;
  p03: unknown;
  p15: unknown;
  p50: unknown;
  p85: unknown;
  p97: unknown;
  height?: unknown;
}

interface VaccinReference {
  id: string;
  name: string;
}

interface VaccinReferenceDose {
  id: string;
  vaccinReferenceId: string;
  doseType: "regular" | "annual" | "booster" | "unique";
  doseCount: number | null;
  maxAge: number | null;
}

async function main() {
  console.log("🚀 Starting migration from Supabase to Convex...\n");

  // Validate environment variables
  const databaseUrl = process.env.DATABASE_URL;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  if (!convexUrl) {
    console.error("❌ NEXT_PUBLIC_CONVEX_URL or CONVEX_URL environment variable is required");
    console.error(
      "   Set it to your Convex deployment URL (e.g., https://xxx.convex.cloud)"
    );
    process.exit(1);
  }

  // Connect to Supabase PostgreSQL
  console.log("📡 Connecting to Supabase...");
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("✅ Connected to Supabase\n");

    // Initialize Convex client
    const convex = new ConvexHttpClient(convexUrl);
    console.log("✅ Convex client initialized\n");

    // Migrate charts
    await migrateCharts(client, convex);

    // Migrate vaccine references
    await migrateVaccineReferences(client, convex);

    console.log("\n🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
    console.log("\n📡 Disconnected from Supabase");
  }
}

async function migrateCharts(
  client: pg.Client,
  convex: ConvexHttpClient
): Promise<void> {
  console.log("📊 Migrating charts...");

  const result = await client.query<Chart>('SELECT * FROM "charts"');
  const charts = result.rows;

  console.log(`   Found ${charts.length} charts`);

  for (const chart of charts) {
    try {
      await convex.mutation(api.seed.seedChart, {
        chartId: chart.id,
        p03: chart.p03,
        p15: chart.p15,
        p50: chart.p50,
        p85: chart.p85,
        p97: chart.p97,
        height: chart.height ?? undefined,
      });
      console.log(`   ✅ Migrated chart: ${chart.id}`);
    } catch (error) {
      console.error(`   ❌ Failed to migrate chart ${chart.id}:`, error);
    }
  }

  console.log(`✅ Charts migration complete\n`);
}

async function migrateVaccineReferences(
  client: pg.Client,
  convex: ConvexHttpClient
): Promise<void> {
  console.log("💉 Migrating vaccine references...");

  // Get all vaccine references
  const vaccinesResult = await client.query<VaccinReference>(
    'SELECT * FROM "VaccinReference"'
  );
  const vaccines = vaccinesResult.rows;

  console.log(`   Found ${vaccines.length} vaccine references`);

  // Get all doses
  const dosesResult = await client.query<VaccinReferenceDose>(
    'SELECT * FROM "VaccinReferenceDose"'
  );
  const allDoses = dosesResult.rows;

  console.log(`   Found ${allDoses.length} dose definitions`);

  for (const vaccine of vaccines) {
    try {
      // Get doses for this vaccine
      const doses = allDoses
        .filter((d) => d.vaccinReferenceId === vaccine.id)
        .map((d) => ({
          doseType: d.doseType,
          doseCount: d.doseCount ?? undefined,
          maxAge: d.maxAge ?? undefined,
        }));

      await convex.mutation(api.seed.seedVaccinReference, {
        name: vaccine.name,
        doses,
      });
      console.log(
        `   ✅ Migrated vaccine: ${vaccine.name} (${doses.length} doses)`
      );
    } catch (error) {
      console.error(
        `   ❌ Failed to migrate vaccine ${vaccine.name}:`,
        error
      );
    }
  }

  console.log(`✅ Vaccine references migration complete`);
}

main();

