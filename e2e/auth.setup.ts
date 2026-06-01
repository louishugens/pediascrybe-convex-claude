import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const AUTH_FILE = path.join(__dirname, ".auth", "doctor.json");

/**
 * Logs in once as a doctor and saves the session to storageState.
 * Requires E2E_EMAIL + E2E_PASSWORD env vars (a verified doctor account).
 * If they are absent, the setup fails fast with a clear message so the
 * dependent `doctor` project is skipped.
 */
setup("authenticate as doctor", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_EMAIL / E2E_PASSWORD not set — cannot log in. " +
        "Provide a verified doctor account to run authenticated specs.",
    );
  }

  await page.goto("/");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[placeholder="Enter your password"]').fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Doctor login redirects to /user.
  await page.waitForURL(/\/user(\/|$)/, { timeout: 30_000 });

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
