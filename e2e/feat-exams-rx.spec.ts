import { test, expect } from "@playwright/test";
import { gotoReady, assertContent, PID, AID } from "./helpers";

test.describe("Exams & prescriptions", () => {
  test("add-exams form renders for a visit", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/${AID}/add-exams`);
    await assertContent(page, "add exams");
  });

  test("add a prescription manually", async ({ page }) => {
    await gotoReady(page, `/user/patients/${PID}/${AID}/add-prescription`);
    await assertContent(page, "add prescription");

    // Fill the first medicine row (do NOT click "Generate with ScrybeGPT?").
    await page.locator('input[placeholder="Paracetamol"]').first().fill("Amoxicillin");
    await page
      .locator('input[placeholder="1 pill twice a day for 7 days"]')
      .first()
      .fill("1 teaspoon 3x/day for 7 days");
    // Count field (first number input in the row).
    const count = page.locator('input[type="number"]').first();
    if (await count.isVisible().catch(() => false)) await count.fill("1");

    await page.getByRole("main").getByRole("button", { name: /Save Prescription/i }).click();
    await page.waitForTimeout(2500);
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
  });

  test("print views render (exams + prescription)", async ({ page }) => {
    await page.addInitScript(() => { window.print = () => {}; });
    await gotoReady(page, `/user/patients/${PID}/${AID}/print-exams`);
    await assertContent(page, "print exams");
    await gotoReady(page, `/user/patients/${PID}/${AID}/print-prescription`);
    await assertContent(page, "print prescription");
  });
});
