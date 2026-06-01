import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

/**
 * E2E config for Pediascrybe. Assumes the dev server is already running on :3000
 * (npm run dev). Authenticated specs depend on the `setup` project, which logs
 * in with E2E_EMAIL / E2E_PASSWORD and saves a storageState.
 *
 * Credentials can be supplied via env vars OR a gitignored .env.e2e file:
 *   E2E_EMAIL=you@example.com
 *   E2E_PASSWORD=••••••••
 */
try {
  const raw = fs.readFileSync(".env.e2e", "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  /* no .env.e2e — rely on real env vars */
}

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/report" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    // Public pages — no auth required.
    {
      name: "public",
      testMatch: /public\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Logs in and persists the doctor session.
    {
      name: "setup-doctor",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Authenticated doctor specs — reuse the saved session.
    // Set E2E_REUSE_SESSION=1 to skip the (botid-gated) login and reuse an
    // existing e2e/.auth/doctor.json — needed when testing a production build,
    // where Vercel BotID blocks headless logins.
    {
      name: "doctor",
      testMatch: /(doctor.*|feat-.*|flow-.*)\.spec\.ts/,
      dependencies: process.env.E2E_REUSE_SESSION ? [] : ["setup-doctor"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/doctor.json",
      },
    },
  ],
});
