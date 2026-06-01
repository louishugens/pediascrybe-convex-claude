import { test, expect } from "@playwright/test";
import { gotoReady, assertContent, pickSelect, PID } from "./helpers";

const REPORT_ID = "kn79z3y2ja02yhgb59rhsappen7zaqay";
const RECEIPT_ID = "kh7a7d7mq40jwhb1p4pzwf1z6h7zd4yf";

test.describe("Reports", () => {
  test("create a report manually (no AI)", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/reports/create-report`);
    await assertContent(page, "create report");

    await pickSelect(page, /type/i, /^Report$/i);
    // Lexical rich-text editor — click and type (fill() doesn't work on contenteditable).
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type("E2E: Patient examined today, findings within normal limits.");

    // Do NOT click "Generate with ScrybeGPT? Yes".
    await page.getByRole("main").getByRole("button", { name: /Save report/i }).click();
    await page.waitForTimeout(2500);
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
  });

  test("report detail renders", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/reports/${REPORT_ID}`);
    await assertContent(page, "report detail");
  });

  test("reports list renders", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/reports`);
    await assertContent(page, "reports list");
  });
});

test.describe("Receipts", () => {
  test("create a receipt", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/receipts/create-receipt`);
    await assertContent(page, "create receipt");

    // Transaction date — open the date trigger and pick today (first enabled day).
    const dateBtn = page.getByRole("button", { name: /pick a date|transaction date/i }).first();
    if (await dateBtn.isVisible().catch(() => false)) {
      await dateBtn.click();
      await page.getByRole("grid").first().locator("button:not([disabled])").last().click().catch(() => {});
    }
    // Currency combobox.
    const currency = page.locator('button[role="combobox"]').filter({ hasText: /currency/i }).first();
    if (await currency.isVisible().catch(() => false)) {
      await currency.click();
      await page.getByPlaceholder(/search currency/i).fill("USD").catch(() => {});
      await page.getByRole("option", { name: /USD/i }).first().click().catch(() => {});
    }
    // Service row.
    await page
      .locator('input[placeholder="Record type, exam reading, ..."]')
      .first()
      .fill("Consultation");
    await page.locator('input[type="number"]').first().fill("50");

    await page.getByRole("main").getByRole("button", { name: /Save receipt/i }).click();
    await page.waitForTimeout(2500);
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
  });

  test("receipt detail renders", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/receipts/${RECEIPT_ID}`);
    await assertContent(page, "receipt detail");
  });

  test("receipts list renders", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/receipts`);
    await assertContent(page, "receipts list");
  });
});
