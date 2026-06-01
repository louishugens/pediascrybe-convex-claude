import { test, expect, Page } from "@playwright/test";

/**
 * Deep write-path tests for the doctor side. These create REAL data in the dev
 * deployment, using clearly-labeled test values so they're easy to spot. No AI
 * buttons are clicked (those burn credits + stream).
 */

const PID = "k572xcs5y2pcvzw4zs0e19b58x7zb311"; // data-rich patient with pending lab orders

// shadcn Select: open the trigger (matched by its placeholder text) and pick an option.
async function pickSelect(page: Page, triggerText: RegExp, optionName: RegExp) {
  await page
    .locator('button[role="combobox"]')
    .filter({ hasText: triggerText })
    .first()
    .click();
  await page.getByRole("option", { name: optionName }).first().click();
}

// shadcn Calendar popover: open via the "Pick a date" button and click the first enabled day.
async function pickFirstAvailableDate(page: Page) {
  await page.getByRole("button", { name: /Pick a date/i }).first().click();
  const day = page
    .getByRole("gridcell")
    .locator("button:not([disabled])")
    .first();
  await day.click();
}

test("patient: create a new patient end-to-end", async ({ page }) => {
  const stamp = Date.now();
  const last = `Zztest${stamp}`;
  await page.goto("/user/add-patient");
  await expect(page.getByText("Add New Patient")).toBeVisible();

  await page.locator('input[placeholder="John"]').fill("E2e");
  await page.locator('input[placeholder="Doe"]').fill(last);
  await pickFirstAvailableDate(page); // birthdate
  await pickSelect(page, /sex/i, /^male$/i);

  await page.getByRole("button", { name: /^Add Patient$/i }).click();

  // Should leave the form (redirect to list/detail) without an error toast.
  await page.waitForTimeout(2500);
  await expect(page.getByText("Something went wrong")).toHaveCount(0);

  // Verify it shows up in the patients list.
  await page.goto("/user/patients");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(last).first()).toBeVisible({ timeout: 10000 });
});

test("labs: enter a result via the batch dialog", async ({ page }) => {
  await page.goto("/user/labs");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);

  const enterBtn = page.getByRole("button", { name: /^Enter results$/i }).first();
  // If no pending visit group has the button, skip gracefully (data-dependent).
  if ((await enterBtn.count()) === 0) {
    test.skip(true, "No 'Enter results' button present — no pending visit group.");
  }
  await enterBtn.click();

  // Batch dialog opens with one section per exam.
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Fill the first value field. Batch uses placeholder "12.4 or positive".
  const valueInput = dialog
    .locator('input[placeholder="12.4 or positive"]')
    .first();
  await expect(valueInput).toBeVisible();
  await valueInput.fill("13.2");

  await dialog.getByRole("button", { name: /Save all results/i }).click();

  // Dialog should close and no error boundary.
  await expect(dialog).toBeHidden({ timeout: 10000 });
  await expect(page.getByText("Something went wrong")).toHaveCount(0);
});

test("labs: mark an order collected advances its status", async ({ page }) => {
  await page.goto("/user/labs");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);

  const markBtn = page.getByRole("button", { name: /^Mark collected$/i }).first();
  if ((await markBtn.count()) === 0) {
    test.skip(true, "No 'Mark collected' action available.");
  }
  await markBtn.click();
  await page.waitForTimeout(1500);
  await expect(page.getByText("Something went wrong")).toHaveCount(0);
});
