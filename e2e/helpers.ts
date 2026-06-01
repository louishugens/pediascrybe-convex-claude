import { Page, expect } from "@playwright/test";

/** Data-rich patient owned by the test doctor (appts, reports, receipts, vaccines, labs). */
export const PID = "k572xcs5y2pcvzw4zs0e19b58x7zb311";
export const AID = "j97c220x8x1rwxtmkbtp61t92h7zagze";

/**
 * Navigate and wait for client content to settle. The headless harness can hit a
 * transient server-side "Not authenticated" (JWT refresh timing) that trips the
 * error boundary — reload once if that happens. A real signed-in user is stable.
 */
export async function gotoReady(page: Page, url: string) {
  const load = async () => {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(800);
    const boundary = (await page.getByText("Something went wrong").count()) > 0;
    return { status: resp?.status() ?? 0, boundary };
  };
  let r = await load();
  if (r.boundary) {
    await page.waitForTimeout(1500);
    r = await load();
  }
  expect(r.status, `HTTP ${r.status} at ${url}`).toBeLessThan(500);
  expect(r.boundary, `error boundary persists at ${url}`).toBeFalsy();
}

/** Dismiss any subscription/promo banner that may overlay form controls. */
export async function dismissBanners(page: Page) {
  for (const name of [/^Dismiss$/i, /close/i]) {
    const btn = page.getByRole("button", { name }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {});
    }
  }
}

/** Open a shadcn Select (matched by its current/placeholder text) and pick an option. */
export async function pickSelect(
  page: Page,
  triggerText: RegExp,
  optionName: RegExp,
) {
  await page
    .locator('button[role="combobox"]')
    .filter({ hasText: triggerText })
    .first()
    .click();
  await page.getByRole("option", { name: optionName }).first().click();
}

/**
 * Pick a date from a shadcn (react-day-picker v9) calendar popover.
 * Opens the trigger, steps back one month to guarantee a non-disabled past day,
 * then clicks the first enabled day cell.
 */
export async function pickPastDate(page: Page, triggerName: RegExp = /pick a date/i) {
  const trigger = page.getByRole("button", { name: triggerName }).first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const grid = page.getByRole("grid").first();
  await grid.waitFor({ state: "visible", timeout: 8000 });
  // Step to the previous month so all days are in the past (valid for birthdates).
  await page.getByRole("button", { name: /previous|prev/i }).first().click().catch(() => {});
  await page.waitForTimeout(300);
  const day = page.getByRole("grid").first().locator("button:not([disabled])").first();
  await day.click();
  // Popover closes on selection.
  await page.waitForTimeout(300);
}

/** Like pickPastDate, but steps forward a month for future dates (e.g. expiry). */
export async function pickFutureDate(page: Page, triggerName: RegExp = /pick a date/i) {
  const trigger = page.getByRole("button", { name: triggerName }).first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const grid = page.getByRole("grid").first();
  await grid.waitFor({ state: "visible", timeout: 8000 });
  await page.getByRole("button", { name: /next/i }).first().click().catch(() => {});
  await page.waitForTimeout(300);
  await page.getByRole("grid").first().locator("button:not([disabled])").first().click();
  await page.waitForTimeout(300);
}

/** Assert the page shows real content and not the error boundary. */
export async function assertContent(page: Page, label: string) {
  await expect(
    page.getByText("Something went wrong"),
    `${label}: error boundary`,
  ).toHaveCount(0);
  const txt = ((await page.locator("body").innerText().catch(() => "")) || "").trim();
  expect(txt.length, `${label}: blank page`).toBeGreaterThan(20);
}
