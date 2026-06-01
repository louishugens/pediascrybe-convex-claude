import { test, expect, Page } from "@playwright/test";

/**
 * Dev re-check of the routes that failed against the PRODUCTION build. Most were
 * false positives caused by Vercel BotID blocking the OIDC token in prod; this
 * confirms they're healthy on the dev server (BotID returns HUMAN). One was a
 * real bug — add-recommendation's `"use cache"` + headers() 500 — now fixed.
 */
const PID = "k572xcs5y2pcvzw4zs0e19b58x7zb311";
const AID = "j97c220x8x1rwxtmkbtp61t92h7zagze";

const ROUTES = [
  { url: "/user/labs", label: "Lab worklist" },
  { url: "/user/scrybegpt", label: "ScrybeGPT" },
  { url: "/user/settings/subscription", label: "Settings · subscription" },
  { url: "/user/settings/whatsapp", label: "Settings · whatsapp" },
  { url: "/user/telehealth/availability", label: "Telehealth · availability" },
  { url: "/user/telehealth/appointments", label: "Telehealth · appointments" },
  { url: "/user/transactions", label: "Transactions" },
  { url: "/user/patients", label: "Patients list" },
  { url: `/user/patients/${PID}/${AID}/add-exams`, label: "Add exams" },
  { url: `/user/patients/${PID}/${AID}/add-recommendation`, label: "Add recommendation (was 500)" },
];

async function loadOnce(page: Page, url: string) {
  const resp = await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const boundary = (await page.getByText("Something went wrong").count()) > 0;
  const txt = ((await page.locator("body").innerText().catch(() => "")) || "").trim();
  return { status: resp?.status() ?? 0, boundary, txtLen: txt.length };
}

async function assertHealthy(page: Page, url: string, label: string) {
  // The server-side session occasionally reports "Not authenticated" in the
  // headless harness (JWT refresh timing). Retry once — a real signed-in user
  // doesn't hit this. A persistent boundary across both loads is a real failure.
  let r = await loadOnce(page, url);
  if (r.boundary || r.txtLen === 0) {
    await page.waitForTimeout(1500);
    r = await loadOnce(page, url);
  }
  if (r.status) {
    expect(r.status, `${label}: HTTP ${r.status} at ${url}`).toBeLessThan(500);
  }
  expect(r.boundary, `${label}: error boundary persists at ${url}`).toBeFalsy();
  expect(r.txtLen, `${label}: blank at ${url}`).toBeGreaterThan(0);
}

for (const r of ROUTES) {
  test(`dev re-check: ${r.label}`, async ({ page }) => {
    await assertHealthy(page, r.url, r.label);
  });
}
